const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'Purchased Item Feedback',
      'Replacement Feedback',
      'Lab Item Issue',
      'Repair Request',
      'Replacement Request',
    ],
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Query', QuerySchema);
