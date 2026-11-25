const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const { uploadPermit } = require('../middleware/upload');
const c = require('../controllers/myCompanyController');

router.use(requireRole('company'));
router.get('/', c.getMine);
router.put('/', c.updateMine);
router.post('/financials', c.saveFinancial);
router.delete('/financials/:fid', c.deleteFinancial);
router.post('/permits', uploadPermit, c.addPermit);
router.delete('/permits/:pid', c.deletePermit);
router.post('/submit', c.submit);

module.exports = router;
