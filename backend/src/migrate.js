const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
    await db.raw(fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8'));
    console.log('Tabel database siap.');

    const [[{ n }]] = await db.query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'");
    if (!n) {
        const { ADMIN_NAME = 'Administrator', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
            console.warn('Belum ada admin. Isi ADMIN_EMAIL dan ADMIN_PASSWORD (min 8 karakter) di .env lalu jalankan ulang npm run migrate.');
        } else {
            await db.query(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
                [ADMIN_NAME, ADMIN_EMAIL.trim().toLowerCase(), await bcrypt.hash(ADMIN_PASSWORD, 10)]);
            console.log('Akun admin dibuat:', ADMIN_EMAIL);
        }
    }

    console.log('Migrasi selesai.');
    await db.end();
})().catch((err) => {
    console.error('Migrasi gagal:', err.message);
    process.exit(1);
});
