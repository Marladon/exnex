const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const { generateToken } = require('../config/jwt');

// Регистрация с хешированием пароля
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Проверка обязательных полей
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Сохранение в БД
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, phone',
      [email, passwordHash, name || null, phone || null]
    );
    
    // Автоматический вход после регистрации
    const token = generateToken(result.rows[0].id);
    
    res.status(201).json({ 
      user: result.rows[0],
      token: token,
      message: 'Регистрация успешна'
    });
    
  } catch (err) {
    // Обработка ошибки дубликата email
    if (err.code === '23505') { // PostgreSQL код ошибки unique violation
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Вход с проверкой пароля
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    // Ищем пользователя
    const result = await pool.query(
      'SELECT id, email, password_hash, name, phone FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const user = result.rows[0];
    
    // Проверяем пароль
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Генерируем токен
    const token = generateToken(user.id);
    
    // Успешный вход - возвращаем данные без пароля
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      token: token
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Выход (клиентская сторона просто удаляет токен)
router.post('/logout', (req, res) => {
  res.json({ message: 'Выход успешен' });
});

module.exports = router;