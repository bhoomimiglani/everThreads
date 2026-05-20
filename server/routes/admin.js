const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const oc     = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard',          ctrl.getDashboard);
router.get('/analytics',          ctrl.getAnalytics);
router.get('/users',              ctrl.getUsers);
router.put('/users/:id/toggle',   ctrl.toggleUser);
router.get('/inventory',          ctrl.getInventory);
router.put('/inventory/:productId/restock', ctrl.restock);
router.get('/orders',             oc.getAllOrders);
router.put('/orders/:id/status',  oc.updateOrderStatus);

module.exports = router;
