// Файл: src/models/index.js

const Client = require('./Client'); // убедитесь, что пути правильные относительно этой папки
const UserCredential = require('./UserCredential');
const Vehicle = require('./Vehicle');
const Branch = require('./Branch');
const Employee = require('./Employee');
const Service = require('./Service');
const BranchService = require('./BranchService');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const SubscriptionPlan = require('./SubscriptionPlan');
const Subscription = require('./Subscription');
const Equipment = require('./Equipment');
const Account = require('./Account');
const AccountTransaction = require('./AccountTransaction');
const Review = require('./Review');

// === Настройка связей (Associations) ===

// Client
Client.hasOne(UserCredential, { foreignKey: 'client_id' });
Client.hasMany(Vehicle, { foreignKey: 'client_id' });
Client.hasOne(Account, { foreignKey: 'client_id' });
Client.hasMany(Subscription, { foreignKey: 'client_id' });
Client.hasMany(Review, { foreignKey: 'client_id' });

UserCredential.belongsTo(Client, { foreignKey: 'client_id' });
Vehicle.belongsTo(Client, { foreignKey: 'client_id' });
Account.belongsTo(Client, { foreignKey: 'client_id' });
Subscription.belongsTo(Client, { foreignKey: 'client_id' });
Review.belongsTo(Client, { foreignKey: 'client_id' });

// ... (остальные ваши связи Branch, Service, Order, Account и т.д.) ...

// Экспортируем готовые модели
module.exports = {
    Client, UserCredential, Vehicle, Branch, Employee,
    Service, BranchService, Order, OrderItem, Payment,
    SubscriptionPlan, Subscription, Equipment,
    Account, AccountTransaction, Review,
};