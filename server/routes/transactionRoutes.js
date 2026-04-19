const express = require('express');
const router = express.Router();
const {
  getTransactions,
  approveTransaction,
  rejectTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', protect, getTransactions);
router.patch('/:id/approve', protect, roleCheck('Admin'), approveTransaction);
router.patch('/:id/reject', protect, roleCheck('Admin'), rejectTransaction);

module.exports = router;
