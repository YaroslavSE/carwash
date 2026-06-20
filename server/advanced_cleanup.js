const sequelize = require('./src/db/sequelize');
const { Employee, Branch, Service, Order, OrderItem, Payment, Review, AccountTransaction, BranchService, SubscriptionPlanService } = require('./src/models');
const { Op } = require('sequelize');

async function advancedCleanup() {
  const transaction = await sequelize.transaction();
  try {
    console.log('Починаємо глибоке очищення бази даних...');

    // 1. Знайти активну філію для переприв'язки
    const activeBranch = await Branch.findOne({ where: { is_active: true } });
    if (!activeBranch) {
      throw new Error("Немає жодної активної філії для переприв'язки робітників.");
    }

    const inactiveBranches = await Branch.findAll({ where: { is_active: false } });
    const inactiveBranchIds = inactiveBranches.map(b => b.branch_id);
    
    const inactiveServices = await Service.findAll({ where: { is_active: false } });
    const inactiveServiceIds = inactiveServices.map(s => s.service_id);

    console.log(`Знайдено неактивних філій: ${inactiveBranchIds.length}, неактивних послуг: ${inactiveServiceIds.length}`);

    // 2. Переприв'язати робітників неактивних філій до першої активної
    if (inactiveBranchIds.length > 0) {
      const [updatedCount] = await Employee.update(
        { branch_id: activeBranch.branch_id },
        { where: { branch_id: { [Op.in]: inactiveBranchIds } }, transaction }
      );
      console.log(`Переприв'язано ${updatedCount} співробітників до філії ID ${activeBranch.branch_id} ("${activeBranch.name}")`);
    }

    // 3. Знайти замовлення для видалення
    let ordersToDelete = [];
    if (inactiveBranchIds.length > 0) {
      const branchOrders = await Order.findAll({ where: { branch_id: { [Op.in]: inactiveBranchIds } } });
      ordersToDelete.push(...branchOrders.map(o => o.order_id));
    }

    if (inactiveServiceIds.length > 0) {
      const orderItems = await OrderItem.findAll({ where: { service_id: { [Op.in]: inactiveServiceIds } } });
      ordersToDelete.push(...orderItems.map(oi => oi.order_id));
    }

    // Унікальні ID замовлень
    const allOrderIdsToDelete = [...new Set(ordersToDelete)];
    
    // 4. Видалити замовлення та всі пов'язані дані
    if (allOrderIdsToDelete.length > 0) {
      console.log(`Знайдено ${allOrderIdsToDelete.length} замовлень, які блокують видалення. Видаляємо їхні залежності...`);
      await AccountTransaction.destroy({ where: { order_id: { [Op.in]: allOrderIdsToDelete } }, transaction });
      await Payment.destroy({ where: { order_id: { [Op.in]: allOrderIdsToDelete } }, transaction });
      await Review.destroy({ where: { order_id: { [Op.in]: allOrderIdsToDelete } }, transaction });
      await OrderItem.destroy({ where: { order_id: { [Op.in]: allOrderIdsToDelete } }, transaction });
      await Order.destroy({ where: { order_id: { [Op.in]: allOrderIdsToDelete } }, transaction });
      console.log('Старі замовлення та пов\'язані дані успішно видалено.');
    }

    // 5. Видалити зв'язки послуг і філій з допоміжних таблиць
    if (inactiveBranchIds.length > 0) {
        await BranchService.destroy({ where: { branch_id: { [Op.in]: inactiveBranchIds } }, transaction });
    }
    if (inactiveServiceIds.length > 0) {
        await BranchService.destroy({ where: { service_id: { [Op.in]: inactiveServiceIds } }, transaction });
        await SubscriptionPlanService.destroy({ where: { service_id: { [Op.in]: inactiveServiceIds } }, transaction });
    }

    await transaction.commit();
    console.log('Транзакцію успішно збережено. База готова до остаточного видалення.');

    // 6. Видалити самі філії та послуги
    for (const b of inactiveBranches) {
      await b.destroy();
      console.log(`- Філію ID ${b.branch_id} видалено назавжди.`);
    }

    for (const s of inactiveServices) {
      await s.destroy();
      console.log(`- Послугу ID ${s.service_id} видалено назавжди.`);
    }

    console.log('\n✅ Усе успішно видалено та переприв\'язано!');
  } catch (error) {
    if (!transaction.finished === 'commit') {
      await transaction.rollback();
    }
    console.error('Помилка під час очищення:', error);
  } finally {
    process.exit();
  }
}

advancedCleanup();
