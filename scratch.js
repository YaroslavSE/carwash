const { Review, Client, Order, Branch } = require('./server/src/models');
const sequelize = require('./server/src/db/sequelize');

async function test() {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: Client, attributes: ['first_name'] },
        { model: Order, include: [{ model: Branch, attributes: ['name'] }] }
      ]
    });
    console.log(JSON.stringify(reviews, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}
test();
