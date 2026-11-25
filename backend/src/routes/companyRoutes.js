const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { listPublic, getOne } = require('../controllers/companyController');

router.get('/', listPublic);
router.get('/:id', optionalAuth, getOne);

module.exports = router;
