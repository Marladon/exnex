const jwt = require('jsonwebtoken');

const JWT_SECRET = 'ваш_секретный_ключ_минимум_32_символа_сложный'; // В продакшене хранить в .env
const JWT_EXPIRES_IN = '7d'; // 7 дней

// Генерация токена
function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Проверка токена
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// Middleware для проверки аутентификации
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ error: 'Неверный или истекший токен' });
    }
    
    req.userId = decoded.userId;
    next();
}

module.exports = {
    generateToken,
    verifyToken,
    authMiddleware,
    JWT_SECRET
};