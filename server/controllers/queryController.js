const Query = require('../models/Query');
const Notification = require('../models/Notification');

const createQuery = async (req, res) => {
  const { type, itemName, message } = req.body;

  if (!type || !itemName || !message) {
    return res.status(400).json({ message: 'Type, item name, and message are required' });
  }

  const query = await Query.create({
    userId: req.user._id,
    type,
    itemName,
    message
  });

  await Notification.create({
    message: `New ${req.user.role.toLowerCase()} query from ${req.user.name}: ${type}`,
    type: 'NEW_QUERY'
  });

  res.status(201).json(query);
};

const getQueries = async (req, res) => {
  let queries;
  if (req.user.role === 'Admin') {
    queries = await Query.find({}).populate('userId', 'name email role').sort({ createdAt: -1 });
  } else {
    queries = await Query.find({ userId: req.user._id }).sort({ createdAt: -1 });
  }
  
  res.json(queries);
};

const updateQueryStatus = async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const query = await Query.findById(req.params.id);
  if (!query) {
    return res.status(404).json({ message: 'Query not found' });
  }

  query.status = status;
  await query.save();

  res.json(query);
};

module.exports = {
  createQuery,
  getQueries,
  updateQueryStatus
};
