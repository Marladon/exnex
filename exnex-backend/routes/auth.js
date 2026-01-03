const express = require('express');
const router = express.Router();
const pool = require('../db');

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    // В реальном проекте: хеширование пароля (bcrypt)
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
      [email, password, name, phone]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Вход (упрощённо)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1 AND password_hash = $2',
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверные данные' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;