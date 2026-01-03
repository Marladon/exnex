const express = require('express');
const router = express.Router();
const pool = require('../db');

// Получить все объявления (с пагинацией)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT ads.*, users.name as user_name, categories.name as category_name 
       FROM ads 
       LEFT JOIN users ON ads.user_id = users.id
       LEFT JOIN categories ON ads.category_id = categories.id
       WHERE status = 'active'
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query('SELECT COUNT(*) FROM ads WHERE status = $1', ['active']);
    
    res.json({
      ads: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать объявление
router.post('/', async (req, res) => {
  try {
    const { user_id, category_id, title, description, price, location, images } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ads 
       (user_id, category_id, title, description, price, location, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [user_id, category_id, title, description, price, location, images || []]
    );
    
    res.status(201).json({ ad: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить одно объявление
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Увеличиваем счетчик просмотров
    await pool.query('UPDATE ads SET views = views + 1 WHERE id = $1', [id]);
    
    const result = await pool.query(
      `SELECT ads.*, users.name as user_name, users.rating, users.phone,
       categories.name as category_name
       FROM ads 
       LEFT JOIN users ON ads.user_id = users.id
       LEFT JOIN categories ON ads.category_id = categories.id
       WHERE ads.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    res.json({ ad: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;