// Файл: src/models/index.js

const Client = require('./Client'); // убедитесь, что пути правильные относительно этой папки
const UserCredential = require('./UserCredential');
const Branch = require('./Branch');
const Employee = require('./Employee');
const Service = require('./Service');
const BranchService = require('./BranchService');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const SubscriptionPlan = require('./SubscriptionPlan');
const SubscriptionPlanService = require('./SubscriptionPlanService');
const Subscription = require('./Subscription');
const Account = require('./Account');
const AccountTransaction = require('./AccountTransaction');
const Review = require('./Review');

// === Настройка связей (Associations) ===

// Client
Client.hasOne(UserCredential, { foreignKey: 'client_id' });
Client.hasOne(Account, { foreignKey: 'client_id' });
Client.hasMany(Subscription, { foreignKey: 'client_id' });
Client.hasMany(Review, { foreignKey: 'client_id' });
Client.hasMany(Order, { foreignKey: 'client_id' });

UserCredential.belongsTo(Client, { foreignKey: 'client_id' });
Account.belongsTo(Client, { foreignKey: 'client_id' });
Subscription.belongsTo(Client, { foreignKey: 'client_id' });
Review.belongsTo(Client, { foreignKey: 'client_id' });
Order.belongsTo(Client, { foreignKey: 'client_id' });

// Order & Review
Order.hasOne(Review, { foreignKey: 'order_id' });
Review.belongsTo(Order, { foreignKey: 'order_id' });

// Branch & Employee
Branch.hasMany(Employee, { foreignKey: 'branch_id' });
Employee.belongsTo(Branch, { foreignKey: 'branch_id' });

// Branch & Order
Branch.hasMany(Order, { foreignKey: 'branch_id' });
Order.belongsTo(Branch, { foreignKey: 'branch_id' });

// Employee & Order
Employee.hasMany(Order, { foreignKey: 'employee_id' });
Order.belongsTo(Employee, { foreignKey: 'employee_id' });

// BranchService
Branch.hasMany(BranchService, { foreignKey: 'branch_id' });
BranchService.belongsTo(Branch, { foreignKey: 'branch_id' });
Service.hasMany(BranchService, { foreignKey: 'service_id' });
BranchService.belongsTo(Service, { foreignKey: 'service_id' });

// OrderItem & Payment
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Service.hasMany(OrderItem, { foreignKey: 'service_id' });
OrderItem.belongsTo(Service, { foreignKey: 'service_id' });
Order.hasOne(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

// Subscription and SubscriptionPlan
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id' });
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'plan_id' });

// SubscriptionPlan & Service
SubscriptionPlan.belongsToMany(Service, { through: SubscriptionPlanService, foreignKey: 'plan_id' });
Service.belongsToMany(SubscriptionPlan, { through: SubscriptionPlanService, foreignKey: 'service_id' });

// Order & Subscription
Subscription.hasMany(Order, { foreignKey: 'subscription_id' });
Order.belongsTo(Subscription, { foreignKey: 'subscription_id' });

module.exports = {
    Client, UserCredential, Branch, Employee,
    Service, BranchService, Order, OrderItem, Payment,
    SubscriptionPlan, SubscriptionPlanService, Subscription,
    Account, AccountTransaction, Review,
};