const express = require('express');
const router = express.Router();
const {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  purchaseItem,
  borrowItem,
  returnItem
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.route('/')
  .get(protect, getInventory)
  .post(protect, roleCheck('Admin'), addInventory);

router.route('/:id')
  .put(protect, roleCheck('Admin'), updateInventory)
  .delete(protect, roleCheck('Admin'), deleteInventory);

router.post('/purchase', protect, roleCheck('Student'), purchaseItem);
router.post('/borrow', protect, roleCheck('Student'), borrowItem);
router.post('/return', protect, roleCheck('Student'), returnItem);

module.exports = router;
