const jwt = require('jsonwebtoken');

function secret() {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET belum diisi di file .env');
    return process.env.JWT_SECRET;
}

exports.signToken = (user) =>
    jwt.sign({ id: user.id, role: user.role, name: user.name }, secret(), { expiresIn: '7d' });

function readUser(req) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    try {
        return jwt.verify(token, secret());
    } catch {
        return null;
    }
}

exports.optionalAuth = (req, res, next) => {
    req.user = readUser(req);
    next();
};

exports.auth = (req, res, next) => {
    const user = readUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu.' });
    req.user = user;
    next();
};

exports.requireRole = (...roles) => [
    exports.auth,
    (req, res, next) =>
        roles.includes(req.user.role)
            ? next()
            : res.status(403).json({ success: false, message: 'Anda tidak punya akses ke fitur ini.' }),
];
