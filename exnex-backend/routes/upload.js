const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Настройка хранилища
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
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
      return cb(null, true);
    } else {
      cb(new Error('Только изображения!'));
    }
  }
});

// Загрузка одного изображения
router.post('/single', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }
    res.json({ 
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Загрузка нескольких изображений
router.post('/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не загружены' });
    }
    const files = req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      size: file.size
    }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;