const sequelize = require('./src/db/sequelize');
const { Employee, Branch, Service } = require('./src/models');

async function cleanupOldRecords() {
  try {
    console.log('Починаємо видалення неактивних записів...');

    // 1. Співробітники
    const inactiveEmployees = await Employee.findAll({ where: { is_active: false } });
    console.log(`Знайдено неактивних співробітників: ${inactiveEmployees.length}`);
    for (const emp of inactiveEmployees) {
      try {
        await emp.destroy();
        console.log(`- Співробітник ID ${emp.employee_id} успішно видалений.`);
      } catch (err) {
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          console.log(`- Співробітник ID ${emp.employee_id} не може бути видалений через зв'язані замовлення.`);
        } else {
          console.error(`- Помилка при видаленні співробітника ID ${emp.employee_id}:`, err.message);
        }
      }
    }

    // 2. Послуги
    const inactiveServices = await Service.findAll({ where: { is_active: false } });
    console.log(`\nЗнайдено неактивних послуг: ${inactiveServices.length}`);
    for (const srv of inactiveServices) {
      try {
        await srv.destroy();
        console.log(`- Послуга ID ${srv.service_id} успішно видалена.`);
      } catch (err) {
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          console.log(`- Послуга ID ${srv.service_id} не може бути видалена через зв'язані замовлення.`);
        } else {
          console.error(`- Помилка при видаленні послуги ID ${srv.service_id}:`, err.message);
        }
      }
    }

    // 3. Філії
    const inactiveBranches = await Branch.findAll({ where: { is_active: false } });
    console.log(`\nЗнайдено неактивних філій: ${inactiveBranches.length}`);
    for (const branch of inactiveBranches) {
      try {
        await branch.destroy();
        console.log(`- Філія ID ${branch.branch_id} успішно видалена.`);
      } catch (err) {
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          console.log(`- Філія ID ${branch.branch_id} не може бути видалена через зв'язані дані (замовлення/співробітники).`);
        } else {
          console.error(`- Помилка при видаленні філії ID ${branch.branch_id}:`, err.message);
        }
      }
    }

    console.log('\nОчищення завершено.');
  } catch (error) {
    console.error('Сталася помилка під час очищення:', error);
  } finally {
    process.exit();
  }
}

cleanupOldRecords();
