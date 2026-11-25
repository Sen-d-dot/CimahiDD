const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rateLimit');
const { requireRole } = require('../middleware/auth');
const c = require('../controllers/contactController');

router.post('/', rateLimit({ max: 10 }), c.create);
router.get('/', requireRole('admin'), c.list);
router.delete('/:id', requireRole('admin'), c.remove);

module.exports = router;
