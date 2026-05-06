const { validationResult, body } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const rules = {
  register: [
    body('first_name').trim().notEmpty().withMessage("Ім'я обов'язкове"),
    body('last_name').trim().notEmpty().withMessage("Прізвище обов'язкове"),
    body('phone').trim().notEmpty().withMessage('Телефон обов\'язковий'),
    body('email').isEmail().withMessage('Невірний email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль мінімум 6 символів'),
  ],
  login: [
    body('email').isEmail().withMessage('Невірний email'),
    body('password').notEmpty().withMessage('Пароль обов\'язковий'),
  ],
  createOrder: [
    body('vehicle_id').isInt().withMessage('Невірне авто'),
    body('branch_id').isInt().withMessage('Невірна філія'),
    body('employee_id').isInt().withMessage('Невірний співробітник'),
    body('scheduled_time').isISO8601().withMessage('Невірний формат дати'),
    body('services').isArray({ min: 1 }).withMessage('Оберіть хоча б одну послугу'),
  ],
  createReview: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Оцінка від 1 до 5'),
    body('comment').optional().trim(),
  ],
  topUp: [
    body('amount').isFloat({ min: 1 }).withMessage('Мінімальна сума 1 грн'),
  ],
};

module.exports = { validate, rules };
