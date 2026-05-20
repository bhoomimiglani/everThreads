const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const InventoryLog = require('../models/Inventory');

router.use(protect, adminOnly);

// GET /api/inventory/logs
router.get('/logs', async (req, res) => {
  try {
    const { productId, type, page = 1, limit = 50 } = req.query;
    const query = {};
    if (productId) query.productId = +productId;
    if (type)      query.type = type;
    const total = await InventoryLog.countDocuments(query);
    const logs  = await InventoryLog.find(query).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(+limit);
    res.json({ success: true, total, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
