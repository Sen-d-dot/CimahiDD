const db = require('../config/db');

exports.create = async (req, res) => {
    const { name, email, whatsapp, message } = req.body || {};
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Nama, email, dan pesan wajib diisi!' });
    }
    await db.query('INSERT INTO contacts (name, email, whatsapp, message) VALUES (?, ?, ?, ?)', [name, email, whatsapp || '', message]);
    res.json({ success: true, message: 'Pesan berhasil dikirim!' });
};

exports.list = async (req, res) => {
    const [rows] = await db.query("SELECT * FROM contacts WHERE created_at >= NOW() - INTERVAL '15 days' ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
};

exports.remove = async (req, res) => {
    await db.query('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Pesan berhasil dihapus.' });
};
