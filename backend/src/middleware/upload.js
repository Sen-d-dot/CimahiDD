const multer = require('multer');

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

exports.uploadPermit = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED.includes(file.mimetype)) return cb(null, true);
        cb(new Error('File izin harus berformat PDF, JPG, atau PNG.'));
    },
}).single('file');
