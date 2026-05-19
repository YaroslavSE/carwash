const sequelize = require('./src/db/sequelize');
const { SubscriptionPlan, SubscriptionPlanService, Order } = require('./src/models');

async function syncDb() {
  try {
    console.log("Syncing specific models...");
    
    await SubscriptionPlan.sync({ alter: true });
    console.log("SubscriptionPlan synced.");
    
    await SubscriptionPlanService.sync({ alter: true });
    console.log("SubscriptionPlanService synced.");

    await sequelize.query('ALTER TABLE "order" ADD COLUMN "subscription_id" INTEGER;');
    console.log("Order table altered.");
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log("Column already exists.");
    } else {
      console.error("Error syncing:", error.message);
    }
  } finally {
    process.exit();
  }
}
syncDb();
