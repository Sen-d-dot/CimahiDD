const db = require('../config/db');

const LIMITED_COLS = 'c.id, c.name, c.category_id, c.description, c.website, c.address, c.gmaps_url, c.status, c.created_at, cat.name AS category_name';

exports.listPublic = async (req, res) => {
    let sql = `SELECT ${LIMITED_COLS} FROM companies c LEFT JOIN categories cat ON c.category_id = cat.id WHERE c.status = 'approved'`;
    const params = [];
    if (req.query.category) { sql += ' AND c.category_id = ?'; params.push(req.query.category); }
    if (req.query.search) { sql += ' AND c.name ILIKE ?'; params.push(`%${req.query.search}%`); }
    sql += ' ORDER BY c.created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
};

exports.loadFull = async (id) => {
    const [rows] = await db.query(
        `SELECT c.*, cat.name AS category_name, u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
         FROM companies c
         LEFT JOIN categories cat ON c.category_id = cat.id
         LEFT JOIN users u ON c.owner_user_id = u.id
         WHERE c.id = ?`, [id]);
    if (!rows[0]) return null;
    const [financials] = await db.query('SELECT * FROM company_financials WHERE company_id = ? ORDER BY year DESC', [id]);
    const [permits] = await db.query(
        'SELECT id, type, number, issued_by, expiry_date, (file_data IS NOT NULL) AS has_file FROM company_permits WHERE company_id = ? ORDER BY id DESC', [id]);
    return { ...rows[0], financials, permits };
};

exports.getOne = async (req, res) => {
    const company = await exports.loadFull(req.params.id);
    const user = req.user;
    const isAdmin = user?.role === 'admin';
    const isOwner = user?.role === 'company' && company?.owner_user_id === user.id;
    const isInvestor = user?.role === 'investor';

    if (!company || (company.status !== 'approved' && !isAdmin && !isOwner)) {
        return res.status(404).json({ success: false, message: 'Perusahaan tidak ditemukan.' });
    }

    if (isAdmin || isOwner || isInvestor) {
        const safe = { ...company };
        if (!isAdmin) { delete safe.owner_name; delete safe.owner_email; delete safe.owner_phone; }
        if (!isAdmin && !isOwner) { delete safe.rejection_reason; }
        return res.json({ success: true, restricted: false, data: safe });
    }

    const { id, name, category_id, category_name, description, website, address, gmaps_url, status, created_at } = company;
    res.json({ success: true, restricted: true, data: { id, name, category_id, category_name, description, website, address, gmaps_url, status, created_at } });
};
