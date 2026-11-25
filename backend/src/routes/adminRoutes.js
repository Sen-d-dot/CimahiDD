const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const c = require('../controllers/adminController');

router.use(requireRole('admin'));
router.get('/companies', c.listCompanies);
router.patch('/companies/:id/status', c.setStatus);
router.delete('/companies/:id', c.deleteCompany);
router.get('/users', c.listUsers);
router.delete('/users/:id', c.deleteUser);

module.exports = router;
