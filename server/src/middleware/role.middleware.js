const { Employee } = require('../models');
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const employee = await Employee.findOne({
        where: { employee_id: req.user.employeeId, is_active: true },
      });
      if (!employee) {
        return res.status(403).json({ message: 'Доступ заборонено' });
      }
      if (!roles.includes(employee.role)) {
        return res.status(403).json({ message: 'Недостатньо прав' });
      }
      req.employee = employee;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Помилка сервера' });
    }
  };
}
module.exports = { requireRole };