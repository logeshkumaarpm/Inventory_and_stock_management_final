const express = require('express');
const router = express.Router();
const { createQuery, getQueries, updateQueryStatus } = require('../controllers/queryController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.route('/')
  .post(protect, roleCheck('Student', 'Staff'), createQuery)
  .get(protect, getQueries);

router.route('/:id/status')
  .put(protect, roleCheck('Admin'), updateQueryStatus);

module.exports = router;
