const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Создаем папку uploads если её нет
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения!'));
        }
    }
});

// Тестовый маршрут
router.post('/test', (req, res) => {
    console.log('Тестовый маршрут вызван');
    res.json({ message: 'Сервер работает' });
});

// Загрузка нескольких изображений
router.post('/multiple', (req, res, next) => {
    upload.array('images', 10)(req, res, function(err) {
        if (err) {
            console.error('Ошибка multer:', err.message);
            return res.status(400).json({ error: err.message });
        }
        
        console.log('Файлы получены:', req.files ? req.files.length : 0);
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Файлы не загружены' });
        }
        
        const files = req.files.map(file => ({
            filename: file.filename,
            path: `/uploads/${file.filename}`,
            size: file.size,
            originalname: file.originalname
        }));
        
        res.json({ 
            success: true,
            files: files 
        });
    });
});

module.exports = router;