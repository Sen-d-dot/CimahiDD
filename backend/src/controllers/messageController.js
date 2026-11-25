const db = require('../config/db');

const bodyOf = (req) => String(req.body?.body ?? '').trim();
const reject = (res, message) => res.status(400).json({ success: false, message });
const invalid = (body) => (!body ? 'Pesan tidak boleh kosong.' : body.length > 2000 ? 'Pesan maksimal 2000 karakter.' : null);

exports.unread = async (req, res) => {
    const admin = req.user.role === 'admin';
    const [[row]] = await db.query(
        admin
            ? 'SELECT COUNT(*) AS n FROM messages WHERE from_admin = 0 AND read_at IS NULL'
            : 'SELECT COUNT(*) AS n FROM messages WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL',
        admin ? [] : [req.user.id]);
    res.json({ success: true, count: Number(row.n) });
};

exports.myThread = async (req, res) => {
    const [rows] = await db.query('SELECT id, from_admin, body, created_at FROM messages WHERE user_id = ? ORDER BY id', [req.user.id]);
    await db.query('UPDATE messages SET read_at = NOW() WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL', [req.user.id]);
    res.json({ success: true, data: rows });
};

exports.sendMine = async (req, res) => {
    const body = bodyOf(req);
    const problem = invalid(body);
    if (problem) return reject(res, problem);
    await db.query('INSERT INTO messages (user_id, from_admin, body) VALUES (?, 0, ?)', [req.user.id, body]);
    res.status(201).json({ success: true, message: 'Pesan terkirim ke admin.' });
};

exports.adminThreads = async (req, res) => {
    const [rows] = await db.query(
        `SELECT u.id, u.name, u.email, u.role, u.organization,
                (SELECT c.name FROM companies c WHERE c.owner_user_id = u.id LIMIT 1) AS company_name,
                m.body AS last_body, m.created_at AS last_at, m.from_admin AS last_from_admin,
                (SELECT COUNT(*)::int FROM messages x WHERE x.user_id = u.id AND x.from_admin = 0 AND x.read_at IS NULL) AS unread
         FROM users u
         JOIN messages m ON m.id = (SELECT MAX(id) FROM messages WHERE user_id = u.id)
         WHERE u.role <> 'admin'
         ORDER BY m.id DESC`);
    res.json({ success: true, data: rows });
};

async function findParticipant(id) {
    const [rows] = await db.query(
        `SELECT u.id, u.name, u.email, u.role, u.organization,
                (SELECT c.name FROM companies c WHERE c.owner_user_id = u.id LIMIT 1) AS company_name
         FROM users u WHERE u.id = ? AND u.role <> 'admin'`, [id]);
    return rows[0];
}

exports.adminThread = async (req, res) => {
    const user = await findParticipant(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    const [rows] = await db.query('SELECT id, from_admin, body, created_at FROM messages WHERE user_id = ? ORDER BY id', [user.id]);
    await db.query('UPDATE messages SET read_at = NOW() WHERE user_id = ? AND from_admin = 0 AND read_at IS NULL', [user.id]);
    res.json({ success: true, user, data: rows });
};

exports.adminSend = async (req, res) => {
    const user = await findParticipant(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    const body = bodyOf(req);
    const problem = invalid(body);
    if (problem) return reject(res, problem);
    await db.query('INSERT INTO messages (user_id, from_admin, body) VALUES (?, 1, ?)', [user.id, body]);
    res.status(201).json({ success: true, message: 'Pesan terkirim.' });
};
