const Transaction = require('../models/Transaction');
const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const { calculateOverdueFine } = require('./inventoryController');

const checkLowStock = async (item) => {
  if (item.quantity === 0 && item.status !== 'Out of Stock') {
    item.status = 'Out of Stock';
    await item.save();
    await Notification.create({
      message: `${item.name} is now Out of Stock.`,
      type: 'OUT_OF_STOCK'
    });
  } else if (item.quantity > 0 && item.status === 'Out of Stock') {
    item.status = 'Available';
    await item.save();
  } else if (item.quantity < 5 && item.status !== 'Out of Stock') {
    await Notification.create({
      message: `${item.name} is running low (Quantity: ${item.quantity}).`,
      type: 'LOW_STOCK'
    });
  }
};

const getTransactions = async (req, res) => {
  const query = req.user.role === 'Admin' ? {} : { userId: req.user._id };
  const transactions = await Transaction.find(query)
    .populate('userId', 'name email role')
    .populate('inventoryId', 'itemId name category quantity status')
    .populate('originalTransactionId')
    .sort({ createdAt: -1 });

  res.json(transactions);
};

const approveTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  if (transaction.status !== 'Pending') {
    return res.status(400).json({ message: 'Transaction is not pending' });
  }

  const item = await Inventory.findById(transaction.inventoryId);
  if (!item) {
    return res.status(404).json({ message: 'Inventory item not found' });
  }

  if (transaction.action === 'Purchase' || transaction.action === 'Borrow') {
    if (item.quantity < transaction.quantity) {
      transaction.status = 'Rejected';
      await transaction.save();
      return res.status(400).json({ message: 'Not enough inventory available to approve this request' });
    }

    item.quantity -= transaction.quantity;
    item.lastUpdated = Date.now();
    await item.save();
    await checkLowStock(item);
  }

  if (transaction.action === 'Return') {
    const original = await Transaction.findById(transaction.originalTransactionId);
    if (!original) {
      return res.status(400).json({ message: 'Original transaction not found' });
    }

    const originalDate = original.approvedAt || original.createdAt;
    const windowMs = 7 * 24 * 60 * 60 * 1000;
    const withinWindow = Date.now() - new Date(originalDate).getTime() <= windowMs;

    if (original.action === 'Purchase' && !withinWindow) {
      transaction.status = 'Rejected';
      await transaction.save();
      return res.status(400).json({ message: 'Return window expired. Returns are only accepted within 7 days.' });
    }

    item.quantity += transaction.quantity;
    item.lastUpdated = Date.now();
    await item.save();
    await checkLowStock(item);

    original.status = 'Returned';
    original.returnedAt = new Date();
    original.returnTransactionId = transaction._id;
    original.fineAmount = original.action === 'Borrow'
      ? calculateOverdueFine(original.dueAt, original.returnedAt)
      : 0;
    await original.save();

    transaction.returnedAt = new Date();
  }

  transaction.status = 'Approved';
  transaction.approvedBy = req.user._id;
  transaction.approvedAt = new Date();
  if (transaction.action === 'Borrow') {
    transaction.dueAt = new Date(Date.now() + (Number(transaction.duration || 0) * 24 * 60 * 60 * 1000));
  }
  if (transaction.action === 'Return') {
    transaction.fineAmount = 0;
  }
  await transaction.save();

  await Notification.create({
    message: `${transaction.action} request approved for ${item.name}.`,
    type: transaction.action === 'Return' ? 'RETURN_REASON' : 'NEW_QUERY'
  });

  res.json({ message: 'Transaction approved', transaction });
};

const rejectTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  if (transaction.status !== 'Pending') {
    return res.status(400).json({ message: 'Transaction is not pending' });
  }

  transaction.status = 'Rejected';
  transaction.approvedBy = req.user._id;
  transaction.approvedAt = new Date();
  await transaction.save();

  res.json({ message: 'Transaction rejected', transaction });
};

module.exports = {
  getTransactions,
  approveTransaction,
  rejectTransaction
};
