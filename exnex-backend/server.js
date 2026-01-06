const express = require('express');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ads');
const categoryRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const favoriteRoutes = require('./routes/favorites');
const messageRoutes = require('./routes/messages');
const { JWT_SECRET } = require('./config/jwt');

const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');


const app = express();
const server = http.createServer(app);
const io = socketIo(server, { // добавляем io
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = 3000;

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

app.use(express.json());
app.use(express.static('public'));
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);

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

// WebSocket логика
io.on('connection', (socket) => {
    console.log('🔌 WebSocket подключение:', socket.id);
    console.log('Auth token in handshake:', socket.handshake.auth?.token ? 'есть' : 'нет');
    
    // Авторизация из handshake
        if (socket.handshake.auth && socket.handshake.auth.token) {
            try {
                const decoded = jwt.verify(socket.handshake.auth.token, JWT_SECRET);
                socket.userId = decoded.userId;
                socket.join(`user_${socket.userId}`);
                socket.emit('authenticated', { userId: socket.userId });
                console.log(`Пользователь ${socket.userId} авторизован при подключении`);
            } catch (err) {
                console.log('Ошибка авторизации при подключении:', err.message);
            }
        }
        
        // Ручная авторизация
        socket.on('authenticate', (token) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                socket.userId = decoded.userId;
                socket.join(`user_${socket.userId}`);
                socket.emit('authenticated', { userId: socket.userId });
                console.log(`Пользователь ${socket.userId} авторизован через authenticate`);
            } catch (err) {
                console.log('Ошибка авторизации WS:', err.message);
            }
        });
    
    // Присоединиться к комнате диалога
    socket.on('join_conversation', (otherUserId) => {
        if (socket.userId) {
        const roomId = [socket.userId, otherUserId].sort().join('_');
        socket.join(`conversation_${roomId}`);
        }
    });
    
    // Новое сообщение
    socket.on('new_message', async (data) => {
        try {
        const { receiver_id, text, ad_id } = data;
        
        // Сохраняем в БД
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, ad_id, text) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [socket.userId, receiver_id, ad_id || null, text]
        );
        
        const message = result.rows[0];
        
        // Отправляем отправителю
        socket.emit('message_sent', message);
        
        // Отправляем получателю если онлайн
        io.to(`user_${receiver_id}`).emit('new_message', {
            ...message,
            sender_name: data.sender_name,
            sender_id: socket.userId
        });
        
        // Обновляем комнату диалога
        const roomId = [socket.userId, receiver_id].sort().join('_');
        io.to(`conversation_${roomId}`).emit('message_received', message);
        
        } catch (err) {
        socket.emit('error', { message: 'Ошибка отправки сообщения' });
        console.error('WS ошибка отправки:', err);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Отключение:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});