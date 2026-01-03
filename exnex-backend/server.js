const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const categoryRoutes = require('./routes/categories');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/api/ads', adRoutes);
app.use('/api/categories', categoryRoutes);

// Подключаем маршруты аутентификации
app.use('/api/auth', authRoutes); 

// Существующий тестовый маршрут
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Ура! Сайт EXNEX работает!',
      time: result.rows[0].now 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Новый тестовый маршрут для проверки пользователей
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для главной страницы
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Редирект с корня на /home
app.get('/', (req, res) => {
  res.redirect('/home');
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});