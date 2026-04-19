const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({}).sort({ createdAt: -1 });
  res.json(notifications);
};

const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (notification) {
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
