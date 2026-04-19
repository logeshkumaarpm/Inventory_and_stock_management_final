const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.post('/login', loginUser);
router.post('/register', protect, roleCheck('Admin'), registerUser);

module.exports = router;
