// Файл: server/index.js (или как он у вас называется в корне)

const app = require('./src/app');
const pool = require('./src/db/pool');

// Инициализируем модели и их связи ДО запуска сервера
require('./src/models'); 

const PORT = process.env.PORT || 5000;

pool.query('SELECT 1')
    .then(() => {
        console.log('✅ PostgreSQL підключено');
        app.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));
    })
    .catch(err => {
        console.error('❌ Помилка підключення до БД:', err);
        process.exit(1);
    });