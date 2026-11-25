const db = require('../config/db');
const { loadFull } = require('./companyController');

const bad = (res, message) => res.status(400).json({ success: false, message });
const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const isHttps = (v) => /^https?:\/\/\S+$/i.test(v);

async function myCompanyId(userId) {
    const [rows] = await db.query('SELECT id FROM companies WHERE owner_user_id = ? ORDER BY id LIMIT 1', [userId]);
    return rows[0]?.id;
}

exports.getMine = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    if (!id) return res.status(404).json({ success: false, message: 'Data perusahaan tidak ditemukan.' });
    res.json({ success: true, data: await loadFull(id) });
};

exports.updateMine = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    if (!id) return res.status(404).json({ success: false, message: 'Data perusahaan tidak ditemukan.' });

    const b = req.body || {};
    const sets = [];
    const vals = [];
    const put = (col, val) => { sets.push(`${col} = ?`); vals.push(val); };

    if ('name' in b) { if (!String(b.name).trim()) return bad(res, 'Nama perusahaan wajib diisi.'); put('name', String(b.name).trim()); }
    if ('category_id' in b) put('category_id', num(b.category_id));
    if ('description' in b) put('description', b.description?.trim() || null);
    if ('website' in b) {
        if (b.website && !isHttps(b.website)) return bad(res, 'Website harus diawali http:// atau https://');
        put('website', b.website?.trim() || null);
    }
    if ('address' in b) put('address', b.address?.trim() || null);
    if ('gmaps_url' in b) {
        if (b.gmaps_url && !isHttps(b.gmaps_url)) return bad(res, 'Link Google Maps harus diawali http:// atau https://');
        put('gmaps_url', b.gmaps_url?.trim() || null);
    }
    if ('funding_needed' in b) {
        const n = num(b.funding_needed);
        if (n !== null && (Number.isNaN(n) || n < 0)) return bad(res, 'Nominal pendanaan tidak valid.');
        put('funding_needed', n);
    }
    if ('funding_purpose' in b) put('funding_purpose', b.funding_purpose?.trim() || null);
    if ('funding_deadline' in b) put('funding_deadline', b.funding_deadline || null);

    if (!sets.length) return bad(res, 'Tidak ada data yang diubah.');
    await db.query(`UPDATE companies SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
    res.json({ success: true, message: 'Data berhasil disimpan.', data: await loadFull(id) });
};

exports.saveFinancial = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    if (!id) return res.status(404).json({ success: false, message: 'Data perusahaan tidak ditemukan.' });

    const { year, revenue, net_profit, total_assets, total_liabilities, notes } = req.body || {};
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1990 || y > new Date().getFullYear()) return bad(res, 'Tahun laporan tidak valid.');
    const [r, p, a, l] = [revenue, net_profit, total_assets, total_liabilities].map(num);
    if ([r, p, a, l].some((v) => v === null || Number.isNaN(v))) return bad(res, 'Pendapatan, laba bersih, aset, dan kewajiban wajib diisi dengan angka.');

    await db.query(
        `INSERT INTO company_financials (company_id, year, revenue, net_profit, total_assets, total_liabilities, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (company_id, year) DO UPDATE SET revenue = EXCLUDED.revenue, net_profit = EXCLUDED.net_profit,
           total_assets = EXCLUDED.total_assets, total_liabilities = EXCLUDED.total_liabilities, notes = EXCLUDED.notes`,
        [id, y, r, p, a, l, notes?.trim() || null]);
    res.json({ success: true, message: `Laporan tahun ${y} tersimpan.`, data: await loadFull(id) });
};

exports.deleteFinancial = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    await db.query('DELETE FROM company_financials WHERE id = ? AND company_id = ?', [req.params.fid, id]);
    res.json({ success: true, message: 'Laporan dihapus.', data: await loadFull(id) });
};

exports.addPermit = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    if (!id) return res.status(404).json({ success: false, message: 'Data perusahaan tidak ditemukan.' });

    const file = req.file;
    const { type, number, issued_by, expiry_date } = req.body || {};
    if (!type?.trim() || !number?.trim()) return bad(res, 'Jenis dan nomor izin wajib diisi.');
    if (!file) return bad(res, 'Unggah dokumen izin (PDF/JPG/PNG, maks 4 MB).');

    await db.query(
        'INSERT INTO company_permits (company_id, type, number, issued_by, expiry_date, file_data, file_mime) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, type.trim(), number.trim(), issued_by?.trim() || null, expiry_date || null, file.buffer, file.mimetype]);
    res.status(201).json({ success: true, message: 'Izin berhasil ditambahkan.', data: await loadFull(id) });
};

exports.deletePermit = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    await db.query('DELETE FROM company_permits WHERE id = ? AND company_id = ?', [req.params.pid, id]);
    res.json({ success: true, message: 'Izin dihapus.', data: await loadFull(id) });
};

exports.submit = async (req, res) => {
    const id = await myCompanyId(req.user.id);
    const c = await loadFull(id);
    if (!c) return res.status(404).json({ success: false, message: 'Data perusahaan tidak ditemukan.' });
    if (c.status === 'pending') return bad(res, 'Pengajuan Anda sedang ditinjau admin.');

    const missing = [];
    if (!c.category_id || !c.description) missing.push('profil usaha (kategori & deskripsi)');
    if (!c.address || !c.gmaps_url) missing.push('alamat lengkap & link Google Maps');
    if (!c.financials.length) missing.push('minimal 1 laporan keuangan');
    if (!c.funding_needed || !c.funding_purpose) missing.push('kebutuhan pendanaan');
    if (!c.permits.length) missing.push('minimal 1 izin usaha');
    if (missing.length) return bad(res, `Lengkapi dulu: ${missing.join(', ')}.`);

    await db.query("UPDATE companies SET status = 'pending', rejection_reason = NULL WHERE id = ?", [id]);
    res.json({ success: true, message: 'Data dikirim ke admin untuk diverifikasi.', data: await loadFull(id) });
};
