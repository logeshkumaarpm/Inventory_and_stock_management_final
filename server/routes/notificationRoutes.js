const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Only Admin can see/manage notifications
router.route('/')
  .get(protect, roleCheck('Admin'), getNotifications);

router.route('/:id')
  .put(protect, roleCheck('Admin'), markAsRead);

module.exports = router;
