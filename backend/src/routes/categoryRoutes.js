const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Gagal memuat kategori:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat kategori.' });
    }
});

module.exports = router;