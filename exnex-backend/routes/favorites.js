const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../config/jwt');

// Добавить в избранное
router.post('/:ad_id', authMiddleware, async (req, res) => {
    try {
        const { ad_id } = req.params;
        const user_id = req.userId;
        
        // Проверяем существует ли объявление
        const adCheck = await pool.query(
            'SELECT id FROM ads WHERE id = $1',
            [ad_id]
        );
        
        if (adCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Объявление не найдено' });
        }
        
        // Добавляем в избранное (игнорируем если уже есть)
        const result = await pool.query(
            `INSERT INTO favorites (user_id, ad_id) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id, ad_id) DO NOTHING
             RETURNING *`,
            [user_id, ad_id]
        );
        
        res.status(201).json({ 
            favorite: result.rows[0],
            message: 'Добавлено в избранное'
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Удалить из избранного
router.delete('/:ad_id', authMiddleware, async (req, res) => {
    try {
        const { ad_id } = req.params;
        const user_id = req.userId;
        
        const result = await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND ad_id = $2 RETURNING *',
            [user_id, ad_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Не найдено в избранном' });
        }
        
        res.json({ 
            message: 'Удалено из избранного'
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить избранное пользователя
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.userId;
        
        const result = await pool.query(
            `SELECT ads.*, 
                    users.name as user_name, 
                    categories.name as category_name,
                    favorites.created_at as favorited_at
             FROM favorites
             JOIN ads ON favorites.ad_id = ads.id
             LEFT JOIN users ON ads.user_id = users.id
             LEFT JOIN categories ON ads.category_id = categories.id
             WHERE favorites.user_id = $1
             ORDER BY favorites.created_at DESC`,
            [user_id]
        );
        
        res.json({ favorites: result.rows });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Проверить, в избранном ли объявление
router.get('/check/:ad_id', authMiddleware, async (req, res) => {
    try {
        const { ad_id } = req.params;
        const user_id = req.userId;
        
        const result = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1 AND ad_id = $2',
            [user_id, ad_id]
        );
        
        res.json({ 
            is_favorite: result.rows.length > 0,
            favorite: result.rows[0] || null
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;