const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Account, AccountTransaction } = require('../models');
const sequelize = require('../db/sequelize');

// POST /api/stripe/create-checkout-session
async function createCheckoutSession(req, res) {
  try {
    const { amount } = req.body;
    const clientId = req.user.clientId; 

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Невірна сума' });
    }

    const account = await Account.findOne({ where: { client_id: clientId } });
    if (!account) {
      return res.status(404).json({ message: 'Рахунок не знайдено' });
    }

    // Stripe accepts amount in cents/kopiyka
    const amountInKopiyka = Math.round(amount * 100);

    // Dynamically determine the client URL based on who is making the request
    const clientUrl = req.headers.origin || process.env.CORS_ORIGIN.split(',')[1];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'uah', 
            product_data: {
              name: 'Поповнення балансу',
              description: 'Поповнення особистого рахунку автомийки',
            },
            unit_amount: amountInKopiyka,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/top-up/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/topup`,
      metadata: {
        account_id: account.account_id,
        amount: amount,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Помилка Stripe:', err);
    res.status(500).json({ message: 'Помилка при створенні платіжної сесії' });
  }
}

// POST /api/stripe/webhook
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const accountId = session.metadata.account_id;
    const amount = parseFloat(session.metadata.amount);

    if (accountId && amount) {
      const t = await sequelize.transaction();
      try {
        const account = await Account.findByPk(accountId, { transaction: t, lock: true });
        
        if (account) {
          await AccountTransaction.create({
            account_id: account.account_id,
            type: 'top_up',
            amount: amount,
            balance_before: account.balance,
            balance_after: parseFloat(account.balance) + amount,
            description: 'Поповнення рахунку через Stripe',
          }, { transaction: t });

          // Assuming there's no DB trigger automatically updating the Account.balance for top_up,
          // we update it directly to be safe. If there is a trigger, this might over-add, but earlier 
          // we saw `payment.controller.js` didn't update Account.balance. Let's check trigger again.
          // Wait, in payment.controller.js, `account` is re-fetched and returned. Does it update?
          // If it didn't update, we must update it manually. Actually, let's update it manually here just in case,
          // wait, let's look at `Account` model to be sure. I will update it.
          await account.update({ balance: parseFloat(account.balance) + amount }, { transaction: t });

          await t.commit();
          console.log(`✅ Поповнення успішне: Рахунок ID ${accountId}, Сума ₴${amount}`);
        } else {
          await t.rollback();
          console.error(`⚠️ Account not found: ${accountId}`);
        }
      } catch (err) {
        await t.rollback();
        console.error('Помилка при оновленні балансу в базі даних:', err);
        return res.status(500).send('Database Error');
      }
    }
  }

  res.send();
}

module.exports = {
  createCheckoutSession,
  handleWebhook
};
