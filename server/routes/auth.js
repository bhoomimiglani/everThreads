const router = require('express').Router();
const { body } = require('express-validator');
const ctrl   = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], ctrl.register);

router.post('/login', ctrl.login);
router.get('/me', protect, ctrl.getMe);
router.put('/updateprofile', protect, ctrl.updateProfile);
router.put('/changepassword', protect, ctrl.changePassword);
router.post('/address', protect, ctrl.addAddress);
router.delete('/address/:id', protect, ctrl.deleteAddress);
router.put('/wishlist/:productId', protect, ctrl.toggleWishlist);

module.exports = router;
