module.exports = ({ windowMs = 15 * 60 * 1000, max = 20 } = {}) => {
    const hits = new Map();
    setInterval(() => {
        const now = Date.now();
        for (const [key, v] of hits) if (v.reset < now) hits.delete(key);
    }, windowMs).unref();

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const entry = hits.get(key);
        if (!entry || entry.reset < now) {
            hits.set(key, { count: 1, reset: now + windowMs });
            return next();
        }
        entry.count += 1;
        if (entry.count > max) {
            return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' });
        }
        next();
    };
};
