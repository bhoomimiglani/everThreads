const router = require('express').Router();
const ctrl   = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/',           protect, ctrl.createOrder);
router.get('/myorders',    protect, ctrl.getMyOrders);
router.get('/:id',         protect, ctrl.getOrder);
router.put('/:id/cancel',  protect, ctrl.cancelOrder);

module.exports = router;
