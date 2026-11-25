const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rateLimit');
const { auth } = require('../middleware/auth');
const c = require('../controllers/authController');

const limiter = rateLimit({ max: 20 });
router.post('/register', limiter, c.register);
router.post('/login', limiter, c.login);
router.get('/me', auth, c.me);

module.exports = router;
