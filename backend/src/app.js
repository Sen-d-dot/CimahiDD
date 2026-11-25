const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const express = require('express');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/my-company', require('./routes/myCompanyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/api', (req, res) => res.json({ message: 'API TAKHIR berjalan dengan baik!' }));

app.use((err, req, res, next) => {
    if (err.name === 'MulterError' || /^File izin/.test(err.message)) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file maksimal 4 MB.' : err.message;
        return res.status(400).json({ success: false, message });
    }
    if (err.code === '22P02') return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    console.error(err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

module.exports = app;
