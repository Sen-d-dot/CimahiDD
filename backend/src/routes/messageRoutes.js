const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rateLimit');
const { auth, requireRole } = require('../middleware/auth');
const c = require('../controllers/messageController');

const limiter = rateLimit({ max: 60 });

router.get('/unread', auth, c.unread);

router.get('/thread', requireRole('company', 'investor'), c.myThread);
router.post('/thread', requireRole('company', 'investor'), limiter, c.sendMine);

router.get('/admin/threads', requireRole('admin'), c.adminThreads);
router.get('/admin/threads/:userId', requireRole('admin'), c.adminThread);
router.post('/admin/threads/:userId', requireRole('admin'), limiter, c.adminSend);

module.exports = router;
