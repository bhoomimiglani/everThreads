const router   = require('express').Router();
const { protect } = require('../middleware/auth');

// POST /api/payment/create-order  — creates Razorpay order on backend
router.post('/create-order', protect, async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const options = {
      amount:   req.body.amount * 100,   // paise
      currency: 'INR',
      receipt:  'bc_' + Date.now(),
      notes:    { userId: req.user._id.toString() }
    };
    const order = await rzp.orders.create(options);
    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    // Razorpay not configured — return demo mode
    res.json({ success: true, demo: true, order: { id: 'demo_' + Date.now() }, key: 'demo' });
  }
});

// POST /api/payment/verify  — verify Razorpay signature
router.post('/verify', protect, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body   = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body).digest('hex');
    if (expected === razorpay_signature) {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
