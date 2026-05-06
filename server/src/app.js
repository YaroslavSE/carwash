const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes         = require('./routes/auth.routes');
const clientRoutes       = require('./routes/client.routes');
const orderRoutes        = require('./routes/order.routes');
const branchRoutes       = require('./routes/branch.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const paymentRoutes      = require('./routes/payment.routes');
const adminRoutes        = require('./routes/admin.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth',          authRoutes);
app.use('/api/clients',       clientRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/branches',      branchRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/account',       paymentRoutes);
app.use('/api/admin',         adminRoutes);

module.exports = app;
