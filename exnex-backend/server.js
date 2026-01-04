const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const app = express();
const PORT = 3000;

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

app.use(express.json());
app.use(express.static('public'));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static('uploads'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});