const db = require('../config/db');

async function deleteCompanyById(id) {
    await db.query('DELETE FROM companies WHERE id = ?', [id]);
}

exports.listCompanies = async (req, res) => {
    let sql = `SELECT c.id, c.name, c.status, c.address, c.created_at, c.funding_needed, cat.name AS category_name,
                      u.name AS owner_name, u.email AS owner_email,
                      (SELECT COUNT(*)::int FROM company_financials f WHERE f.company_id = c.id) AS financial_count,
                      (SELECT COUNT(*)::int FROM company_permits p WHERE p.company_id = c.id) AS permit_count
               FROM companies c
               LEFT JOIN categories cat ON c.category_id = cat.id
               LEFT JOIN users u ON c.owner_user_id = u.id`;
    const params = [];
    if (req.query.status) { sql += ' WHERE c.status = ?'; params.push(req.query.status); }
    sql += " ORDER BY CASE c.status WHEN 'pending' THEN 0 WHEN 'draft' THEN 1 WHEN 'rejected' THEN 2 ELSE 3 END, c.created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
};

exports.setStatus = async (req, res) => {
    const { status, reason } = req.body || {};
    if (!['approved', 'rejected', 'pending', 'draft'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }
    if (status === 'rejected' && !reason?.trim()) {
        return res.status(400).json({ success: false, message: 'Isi alasan penolakan agar perusahaan tahu apa yang harus diperbaiki.' });
    }
    const [result] = await db.query(
        'UPDATE companies SET status = ?, rejection_reason = ? WHERE id = ?',
        [status, status === 'rejected' ? reason.trim().slice(0, 500) : null, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Perusahaan tidak ditemukan.' });
    res.json({ success: true, message: `Status diubah menjadi ${status}.` });
};

exports.deleteCompany = async (req, res) => {
    await deleteCompanyById(req.params.id);
    res.json({ success: true, message: 'Perusahaan dihapus.' });
};

exports.listUsers = async (req, res) => {
    const [rows] = await db.query('SELECT u.id, u.name, u.email, u.role, u.phone, u.organization, u.created_at, (SELECT c.name FROM companies c WHERE c.owner_user_id = u.id LIMIT 1) AS company_name FROM users u ORDER BY u.created_at DESC');
    res.json({ success: true, data: rows });
};

exports.deleteUser = async (req, res) => {
    const [rows] = await db.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    const target = rows[0];
    if (!target) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    if (target.role === 'admin') return res.status(403).json({ success: false, message: 'Akun admin tidak bisa dihapus dari sini.' });

    if (target.role === 'company') {
        const [companies] = await db.query('SELECT id FROM companies WHERE owner_user_id = ?', [target.id]);
        for (const c of companies) await deleteCompanyById(c.id);
    }
    await db.query('DELETE FROM users WHERE id = ?', [target.id]);
    res.json({ success: true, message: 'Akun dihapus.' });
};
