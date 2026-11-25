const db = require('../config/db');

exports.getPermitFile = async (req, res) => {
    const [rows] = await db.query(
        `SELECT p.file_data, p.file_mime, c.owner_user_id, c.status FROM company_permits p
         JOIN companies c ON c.id = p.company_id WHERE p.id = ?`, [req.params.id]);
    const permit = rows[0];
    if (!permit || !permit.file_data) return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });

    const { role, id } = req.user;
    const allowed = role === 'admin' || (role === 'company' && permit.owner_user_id === id) || (role === 'investor' && permit.status === 'approved');
    if (!allowed) return res.status(403).json({ success: false, message: 'Anda tidak punya akses ke dokumen ini.' });

    res.set('Content-Type', permit.file_mime || 'application/octet-stream');
    res.set('Content-Disposition', 'inline');
    res.send(permit.file_data);
};
