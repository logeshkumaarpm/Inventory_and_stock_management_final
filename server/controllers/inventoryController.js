const Inventory = require('../models/Inventory');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');

const checkLowStock = async (item) => {
  if (item.quantity === 0 && item.status !== 'Out of Stock') {
    item.status = 'Out of Stock';
    await item.save();
    await Notification.create({ message: `${item.name} is now Out of Stock.`, type: 'OUT_OF_STOCK' });
  } else if (item.quantity < 5 && item.status !== 'Out of Stock') {
    await Notification.create({ message: `${item.name} is running low (Quantity: ${item.quantity}).`, type: 'LOW_STOCK' });
  }
};

const getRecentApprovedTransaction = async (userId, inventoryId, action) => {
  const transactions = await Transaction.find({
    userId,
    inventoryId,
    action,
    status: 'Approved'
  }).sort({ approvedAt: -1, createdAt: -1 });

  return transactions[0] || null;
};

const calculateOverdueFine = (dueAt, returnedAt) => {
  if (!dueAt || !returnedAt) {
    return 0;
  }

  const lateMs = new Date(returnedAt).getTime() - new Date(dueAt).getTime();
  if (lateMs <= 0) {
    return 0;
  }

  const lateDays = Math.ceil(lateMs / (24 * 60 * 60 * 1000));
  return lateDays * 10;
};

const getInventory = async (req, res) => {
  const items = await Inventory.find({});
  res.json(items);
};

// Admin
const addInventory = async (req, res) => {
  const { itemId, name, category, quantity, price, assignedTo, status } = req.body;
  if (!itemId || !name || !category || price === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existingItem = await Inventory.findOne({ itemId });
  if (existingItem) {
    return res.status(400).json({ message: 'Item ID already exists' });
  }

  const item = await Inventory.create({ itemId, name, category, quantity, price, assignedTo, status });
  await checkLowStock(item);
  res.status(201).json(item);
};

// Admin
const updateInventory = async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (item) {
    Object.assign(item, req.body);
    item.lastUpdated = Date.now();
    await item.save();
    await checkLowStock(item);
    res.json(item);
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
};

// Admin
const deleteInventory = async (req, res) => {
  const item = await Inventory.findByIdAndDelete(req.params.id);
  if (item) {
    res.json({ message: 'Item removed' });
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
};

// Student / Staff Actions
const purchaseItem = async (req, res) => {
  const { itemId, quantity } = req.body;
  const qty = Number(quantity);

  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Only students can purchase items' });
  }

  const item = await Inventory.findById(itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (item.status === 'Out of Stock' || item.quantity < qty) {
    return res.status(400).json({ message: 'Insufficient stock or out of stock' });
  }

  await Transaction.create({
    userId: req.user._id,
    inventoryId: item._id,
    action: 'Purchase',
    quantity: qty,
    status: 'Pending'
  });

  await Notification.create({
    message: `Purchase request submitted by ${req.user.name} for ${item.name}.`,
    type: 'NEW_QUERY'
  });

  res.json({ message: 'Purchase request submitted for admin approval', item });
};

const borrowItem = async (req, res) => {
  const { itemId, duration, quantity } = req.body;
  const qty = Number(quantity);

  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Only students can borrow items' });
  }

  if (!duration) return res.status(400).json({ message: 'Duration is required for borrowing' });

  const item = await Inventory.findById(itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  if (item.status === 'Out of Stock' || item.quantity < qty) {
    return res.status(400).json({ message: 'Insufficient stock or out of stock' });
  }

  await Transaction.create({
    userId: req.user._id,
    inventoryId: item._id,
    action: 'Borrow',
    quantity: qty,
    duration,
    status: 'Pending'
  });

  await Notification.create({
    message: `Borrow request submitted by ${req.user.name} for ${item.name}.`,
    type: 'NEW_QUERY'
  });

  res.json({ message: 'Borrow request submitted for admin approval', item });
};

const returnItem = async (req, res) => {
  const { itemId, reason, quantity } = req.body;
  const qty = Number(quantity);

  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Only students can return items' });
  }

  if (!reason) return res.status(400).json({ message: 'Reason is required for returning' });

  const item = await Inventory.findById(itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  const originalPurchase = await getRecentApprovedTransaction(req.user._id, item._id, 'Purchase');
  const originalBorrow = await getRecentApprovedTransaction(req.user._id, item._id, 'Borrow');
  const originalTransaction = originalPurchase || originalBorrow;

  if (!originalTransaction) {
    return res.status(400).json({ message: 'No approved purchase or borrow found for this item' });
  }

  if (qty > originalTransaction.quantity) {
    return res.status(400).json({ message: 'Return quantity cannot exceed the approved quantity' });
  }

  if (originalTransaction.action === 'Purchase') {
    const originalDate = originalTransaction.approvedAt || originalTransaction.createdAt;
    const windowMs = 7 * 24 * 60 * 60 * 1000;
    const withinWindow = Date.now() - new Date(originalDate).getTime() <= windowMs;

    if (!withinWindow) {
      return res.status(400).json({ message: 'Return window expired. Returns are only accepted within 7 days.' });
    }
  }

  await Transaction.create({
    userId: req.user._id,
    inventoryId: item._id,
    action: 'Return',
    quantity: qty,
    reason,
    status: 'Pending',
    originalTransactionId: originalTransaction._id
  });

  await Notification.create({ 
    message: `Return request submitted by ${req.user.name} for ${item.name}. Reason: ${reason}`, 
    type: 'RETURN_REASON' 
  });

  res.json({ message: 'Return request submitted for admin review', item });
};

const getMyTransactions = async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id })
    .populate('inventoryId', 'itemId name category quantity status')
    .populate('originalTransactionId')
    .populate('returnTransactionId')
    .sort({ createdAt: -1 });

  res.json(transactions);
};

module.exports = {
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  purchaseItem,
  borrowItem,
  returnItem,
  getMyTransactions,
  calculateOverdueFine
};
