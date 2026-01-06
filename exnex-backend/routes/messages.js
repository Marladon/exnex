const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../config/jwt');

// Отправить сообщение
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { receiver_id, ad_id, text } = req.body;
        const sender_id = req.userId;
        
        if (!receiver_id || !text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Получатель и текст обязательны' });
        }
        
        // Проверяем что получатель существует
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [receiver_id]
        );
        
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Получатель не найден' });
        }
        
        // Нельзя отправлять сообщение самому себе
        if (sender_id === receiver_id) {
            return res.status(400).json({ error: 'Нельзя отправлять сообщение самому себе' });
        }
        
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, ad_id, text) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [sender_id, receiver_id, ad_id || null, text.trim()]
        );
        
        res.status(201).json({ message: result.rows[0] });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить диалог с пользователем
router.get('/conversation/:user_id', authMiddleware, async (req, res) => {
    try {
        const { user_id: other_user_id } = req.params;
        const current_user_id = req.userId;
        
        // Помечаем сообщения как прочитанные
        await pool.query(
            `UPDATE messages 
             SET is_read = TRUE 
             WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
            [current_user_id, other_user_id]
        );
        
        const result = await pool.query(
            `SELECT m.*, 
                    u1.name as sender_name,
                    u2.name as receiver_name,
                    ads.title as ad_title
             FROM messages m
             LEFT JOIN users u1 ON m.sender_id = u1.id
             LEFT JOIN users u2 ON m.receiver_id = u2.id
             LEFT JOIN ads ON m.ad_id = ads.id
             WHERE (m.sender_id = $1 AND m.receiver_id = $2)
                OR (m.sender_id = $2 AND m.receiver_id = $1)
             ORDER BY m.created_at ASC`,
            [current_user_id, other_user_id]
        );
        
        res.json({ messages: result.rows });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить список диалогов
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const user_id = req.userId;
        
        const result = await pool.query(
            `SELECT DISTINCT ON (
                LEAST(m.sender_id, m.receiver_id), 
                GREATEST(m.sender_id, m.receiver_id)
              )
              LEAST(m.sender_id, m.receiver_id) as user1_id,
              GREATEST(m.sender_id, m.receiver_id) as user2_id,
              m.*,
              u.name as other_user_name,
              COUNT(CASE WHEN m.receiver_id = $1 AND m.is_read = FALSE THEN 1 END) as unread_count
             FROM messages m
             JOIN users u ON u.id = CASE 
                WHEN m.sender_id = $1 THEN m.receiver_id 
                ELSE m.sender_id 
             END
             WHERE m.sender_id = $1 OR m.receiver_id = $1
             GROUP BY m.id, u.id
             ORDER BY LEAST(m.sender_id, m.receiver_id), 
                      GREATEST(m.sender_id, m.receiver_id), 
                      m.created_at DESC`,
            [user_id]
        );
        
        res.json({ conversations: result.rows });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить количество непрочитанных сообщений
router.get('/unread', authMiddleware, async (req, res) => {
    try {
        const user_id = req.userId;
        
        const result = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = FALSE',
            [user_id]
        );
        
        res.json({ unread_count: parseInt(result.rows[0].count) });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;