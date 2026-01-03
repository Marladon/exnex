const express = require('express');
const router = express.Router();
const pool = require('../db');

// Получить все категории
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить категории с подкатегориями (иерархия)
router.get('/tree', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c1.*, 
              json_agg(c2.*) as subcategories
       FROM categories c1
       LEFT JOIN categories c2 ON c2.parent_id = c1.id
       WHERE c1.parent_id IS NULL
       GROUP BY c1.id
       ORDER BY c1.name`
    );
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;