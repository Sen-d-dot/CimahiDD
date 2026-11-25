const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getPermitFile } = require('../controllers/fileController');

router.get('/permits/:id', auth, getPermitFile);

module.exports = router;
