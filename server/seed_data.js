const sequelize = require('./src/db/sequelize');
const { Branch, Service, BranchService, SubscriptionPlan, SubscriptionPlanService } = require('./src/models');

async function seedDb() {
  try {
    console.log("Seeding database with real data...");

    // 1. Створення філій у Черкасах
    const branchesData = [
      {
        name: 'AutoSpa Центр',
        address: 'Бул. Шевченка, 150',
        city: 'Черкаси',
        phone: '+380931112233',
        working_hours: '09:00 - 18:00',
        capacity: 3,
        is_active: true
      },
      {
        name: 'Wash&Go Митниця',
        address: 'Вул. Гагаріна, 55',
        city: 'Черкаси',
        phone: '+380932223344',
        working_hours: '09:00 - 18:00',
        capacity: 4,
        is_active: true
      },
      {
        name: 'Premium Detailing Південно-Західний',
        address: 'Вул. Сумгаїтська, 10',
        city: 'Черкаси',
        phone: '+380933334455',
        working_hours: '09:00 - 18:00',
        capacity: 2,
        is_active: true
      }
    ];

    const branches = await Branch.bulkCreate(branchesData, { returning: true });
    console.log(`Created ${branches.length} branches.`);

    // 2. Створення послуг по категоріям
    const servicesData = [
      { name: 'Експрес мийка (ззовні)', description: 'Швидка мийка кузова з активною піною', category: 'basic_wash', base_price: 150, duration_minutes: 15 },
      { name: 'Комплексна мийка', description: 'Мийка кузова + прибирання салону (пилосос, пластик)', category: 'premium_wash', base_price: 350, duration_minutes: 45 },
      { name: 'Преміум мийка з воском', description: 'Комплексна мийка + нанесення твердого воску', category: 'premium_wash', base_price: 500, duration_minutes: 60 },
      { name: 'Хімчистка салону (повна)', description: 'Глибока хімчистка всіх елементів салону та багажника', category: 'interior', base_price: 2500, duration_minutes: 240 },
      { name: 'Хімчистка сидінь', description: 'Хімчистка передніх та задніх сидінь', category: 'interior', base_price: 800, duration_minutes: 90 },
      { name: 'Полірування фар', description: 'Відновлення прозорості пластику фар', category: 'polishing', base_price: 400, duration_minutes: 30 },
      { name: 'Відновлювальне полірування кузова', description: 'Видалення дрібних подряпин та надання блиску', category: 'polishing', base_price: 3500, duration_minutes: 300 },
      { name: 'Керамічне покриття', description: 'Нанесення захисного керамічного складу (2 шари)', category: 'detailing', base_price: 6000, duration_minutes: 360 },
      { name: 'Антидощ на скло', description: 'Гідрофобне покриття на всі вікна', category: 'detailing', base_price: 300, duration_minutes: 20 },
    ];

    const services = await Service.bulkCreate(servicesData, { returning: true });
    console.log(`Created ${services.length} services.`);

    // 3. Прив'язка послуг до філій (BranchService)
    const branchServicesData = [];
    for (const branch of branches) {
      for (const service of services) {
        // Додамо трохи різниці в цінах для "Premium Detailing" філії
        let currentPrice = service.base_price;
        if (branch.name.includes('Premium') && service.category === 'detailing') {
          currentPrice = Math.round(Number(currentPrice) * 1.1); // +10% для преміум послуг на цій філії
        }

        branchServicesData.push({
          branch_id: branch.branch_id,
          service_id: service.service_id,
          price: currentPrice,
          is_available: true
        });
      }
    }

    await BranchService.bulkCreate(branchServicesData);
    console.log(`Linked ${branchServicesData.length} services to branches.`);

    // 4. Створення планів підписок
    const plansData = [
      {
        name: 'Базовий Безліміт',
        description: 'Безлімітна експрес-мийка протягом 30 днів (ліміт: 1 раз на день)',
        price: 999,
        duration_days: 30,
        is_unlimited: true,
        washes_included: 0,
        daily_limit: 1,
        discount_percent: 0
      },
      {
        name: 'Пакет "Комплекс 4x"',
        description: '4 комплексні мийки на місяць зі знижкою',
        price: 1100, // Замість 1400 (4 * 350)
        duration_days: 30,
        is_unlimited: false,
        washes_included: 4,
        daily_limit: 1,
        discount_percent: 0
      },
      {
        name: 'Преміум Клуб',
        description: 'Безлімітна комплексна мийка (1 раз на день) + 20% знижка на всі послуги дітейлінгу',
        price: 2500,
        duration_days: 30,
        is_unlimited: true,
        washes_included: 0,
        daily_limit: 1,
        discount_percent: 20
      }
    ];

    const plans = await SubscriptionPlan.bulkCreate(plansData, { returning: true });
    console.log(`Created ${plans.length} subscription plans.`);

    // 5. Прив'язка послуг до підписок
    // "Базовий Безліміт" покриває "Експрес мийка (ззовні)"
    const expressService = services.find(s => s.name.includes('Експрес мийка'));
    const basicPlan = plans.find(p => p.name === 'Базовий Безліміт');

    // "Пакет Комплекс 4x" покриває "Комплексна мийка"
    const complexService = services.find(s => s.name === 'Комплексна мийка');
    const complexPlan = plans.find(p => p.name.includes('Комплекс'));

    // "Преміум Клуб" покриває "Комплексна мийка" та "Преміум мийка з воском"
    const premiumWashService = services.find(s => s.name.includes('з воском'));
    const premiumPlan = plans.find(p => p.name === 'Преміум Клуб');

    const planServicesData = [
      { plan_id: basicPlan.plan_id, service_id: expressService.service_id },
      { plan_id: complexPlan.plan_id, service_id: complexService.service_id },
      { plan_id: premiumPlan.plan_id, service_id: complexService.service_id },
      { plan_id: premiumPlan.plan_id, service_id: premiumWashService.service_id },
    ];

    await SubscriptionPlanService.bulkCreate(planServicesData);
    console.log(`Linked services to subscription plans.`);

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    process.exit(0);
  }
}

seedDb();
