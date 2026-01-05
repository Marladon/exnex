const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../config/jwt'); // добавляем

// Получить все объявления с фильтрами
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      category_id,
      min_price,
      max_price,
      location,
      search,
      sort = 'newest' // newest, cheapest, expensive, popular
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Базовый запрос
    let query = `
      SELECT ads.*, users.name as user_name, categories.name as category_name 
      FROM ads 
      LEFT JOIN users ON ads.user_id = users.id
      LEFT JOIN categories ON ads.category_id = categories.id
      WHERE status = 'active'
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Фильтры
    if (category_id) {
      query += ` AND ads.category_id = $${paramCount}`;
      queryParams.push(category_id);
      paramCount++;
    }
    
    if (min_price) {
      query += ` AND ads.price >= $${paramCount}`;
      queryParams.push(parseFloat(min_price));
      paramCount++;
    }
    
    if (max_price) {
      query += ` AND ads.price <= $${paramCount}`;
      queryParams.push(parseFloat(max_price));
      paramCount++;
    }
    
    if (location) {
      query += ` AND ads.location ILIKE $${paramCount}`;
      queryParams.push(`%${location}%`);
      paramCount++;
    }
    
    if (search) {
      query += ` AND (ads.title ILIKE $${paramCount} OR ads.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }
    
    // Сортировка
    switch(sort) {
      case 'cheapest':
        query += ` ORDER BY ads.price ASC NULLS LAST`;
        break;
      case 'expensive':
        query += ` ORDER BY ads.price DESC NULLS LAST`;
        break;
      case 'popular':
        query += ` ORDER BY ads.views DESC`;
        break;
      default: // newest
        query += ` ORDER BY ads.created_at DESC`;
    }
    
    // Пагинация
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    // Подсчет общего количества (без пагинации)
    let countQuery = `SELECT COUNT(*) FROM ads WHERE status = 'active'`;
    const countParams = [];
    let countParamCount = 1;
    
    if (category_id) {
      countQuery += ` AND category_id = $${countParamCount}`;
      countParams.push(category_id);
      countParamCount++;
    }
    
    // ... аналогично другие фильтры для countQuery
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      ads: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
      filters: {
        category_id,
        min_price,
        max_price,
        location,
        search,
        sort
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать объявление (ТРЕБУЕТ АВТОРИЗАЦИИ)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category_id, title, description, price, location, images } = req.body;
    const user_id = req.userId; // берем из токена
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Заголовок и описание обязательны' });
    }
    
    const result = await pool.query(
      `INSERT INTO ads 
       (user_id, category_id, title, description, price, location, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [user_id, category_id || null, title, description, price || null, location || null, images || []]
    );
    
    res.status(201).json({ ad: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить одно объявление (публичный доступ)
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

// Удалить объявление (ТОЛЬКО ВЛАДЕЛЕЦ)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.userId;
    
    // Проверяем владельца
    const checkResult = await pool.query(
      'SELECT user_id FROM ads WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }
    
    if (checkResult.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Нет прав для удаления' });
    }
    
    await pool.query('DELETE FROM ads WHERE id = $1', [id]);
    
    res.json({ message: 'Объявление удалено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;