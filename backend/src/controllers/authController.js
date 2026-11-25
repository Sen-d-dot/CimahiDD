const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, organization: u.organization });

exports.register = async (req, res) => {
    const { name, email, password, role, phone, organization, company_name } = req.body || {};

    if (!['company', 'investor'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Pilih jenis akun: perusahaan atau investor.' });
    }
    if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password minimal 8 karakter.' });
    if (role === 'company' && !company_name?.trim()) {
        return res.status(400).json({ success: false, message: 'Nama perusahaan wajib diisi.' });
    }

    const conn = await db.getConnection();
    try {
        const [exists] = await conn.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (exists.length) return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

        await conn.beginTransaction();
        const hash = await bcrypt.hash(password, 10);
        const [result] = await conn.query(
            'INSERT INTO users (name, email, password_hash, role, phone, organization) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hash, role, phone?.trim() || null, organization?.trim() || null],
        );
        if (role === 'company') {
            await conn.query(
                "INSERT INTO companies (owner_user_id, name, status) VALUES (?, ?, 'draft')",
                [result.insertId, company_name.trim()],
            );
        }
        await conn.commit();

        const user = { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), role, phone: phone || null, organization: organization || null };
        res.status(201).json({ success: true, token: signToken(user), user: publicUser(user) });
    } catch (err) {
        await conn.rollback();
        console.error('Gagal register:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    } finally {
        conn.release();
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ success: false, message: 'Email atau password salah.' });

    res.json({ success: true, token: signToken(user), user: publicUser(user) });
};

exports.me = async (req, res) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]) return res.status(401).json({ success: false, message: 'Akun tidak ditemukan.' });
    res.json({ success: true, user: publicUser(rows[0]) });
};
