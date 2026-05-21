import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import './Checkout.css'

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState({ name: user?.firstName + ' ' + (user?.lastName || ''), phone: user?.phone || '', line1: '', line2: '', city: '', state: '', pin: '' })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState('')

  const COUPONS = { WELCOME15: 15, FIRST15: 15, SUMMER20: 20, WELCOME5: 5, FLAT10: 10 }
  const shipping = cartTotal >= 999 ? 0 : 99
  const codFee = paymentMethod === 'cod' ? 49 : 0
  const prepaidDiscount = paymentMethod === 'razorpay' ? Math.round(cartTotal * 0.05) : 0
  const total = cartTotal - discount - prepaidDiscount + shipping + codFee

  const applyCoupon = () => {
    const pct = COUPONS[coupon.toUpperCase()]
    if (pct) {
      const d = Math.round(cartTotal * pct / 100)
      setDiscount(d)
      setCouponApplied(coupon.toUpperCase())
      toast(`Coupon applied! Saved ${fmt(d)} 🎉`)
    } else {
      toast.error('Invalid coupon code')
    }
  }

  const handlePlaceOrder = async () => {
    if (!isLoggedIn()) { navigate('/login'); return }
    if (cart.length === 0) { toast.error('Your cart is empty'); return }
    setLoading(true)
    try {
      const orderData = {
        items: cart.map(i => ({ productId: i.productId, name: i.name, img: i.img, price: i.price, size: i.size, qty: i.qty, category: i.category })),
        address,
        subtotal: cartTotal,
        discount: discount + prepaidDiscount,
        couponCode: couponApplied || undefined,
        shipping,
        codFee,
        total,
        paymentMethod,
        paymentId: paymentMethod === 'demo' ? 'DEMO_' + Date.now() : undefined,
      }
      const { data } = await api.post('/orders', orderData)
      if (data.success) {
        clearCart()
        toast('Order placed successfully! 🎉')
        navigate('/account')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    }
    setLoading(false)
  }

  if (cart.length === 0) return (
    <div className="checkout-page">
      <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Your cart is empty</h2>
        <Link to="/shop" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Shop Now</Link>
      </div>
    </div>
  )

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <Link to="/" className="logo">EVER<span>THREAD</span></Link>
          <div className="checkout-steps">
            {['Address', 'Payment', 'Review'].map((s, i) => (
              <div key={s} className={`step${step > i + 1 ? ' done' : step === i + 1 ? ' active' : ''}`}>
                <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            {step === 1 && (
              <div className="checkout-section">
                <h2>Delivery Address</h2>
                <div className="address-form">
                  <div className="form-row">
                    <div className="form-group"><label>Full Name</label><input value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))} required /></div>
                    <div className="form-group"><label>Phone</label><input value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} required /></div>
                  </div>
                  <div className="form-group"><label>Address Line 1</label><input value={address.line1} onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))} required placeholder="House/Flat No., Street" /></div>
                  <div className="form-group"><label>Address Line 2 (optional)</label><input value={address.line2} onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))} placeholder="Area, Landmark" /></div>
                  <div className="form-row">
                    <div className="form-group"><label>City</label><input value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} required /></div>
                    <div className="form-group"><label>State</label><input value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))} required /></div>
                    <div className="form-group"><label>PIN Code</label><input value={address.pin} onChange={e => setAddress(a => ({ ...a, pin: e.target.value }))} required maxLength={6} /></div>
                  </div>
                  <button className="btn-primary" onClick={() => { if (!address.name || !address.line1 || !address.city || !address.pin) { toast.error('Please fill all required fields'); return } setStep(2) }}>
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="checkout-section">
                <h2>Payment Method</h2>
                <div className="payment-options">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', sub: '+₹49 COD fee', icon: 'fa-money-bill-wave' },
                    { id: 'demo', label: 'Demo Payment', sub: 'Test mode — no real payment', icon: 'fa-credit-card' },
                  ].map(opt => (
                    <label key={opt.id} className={`payment-option${paymentMethod === opt.id ? ' active' : ''}`}>
                      <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} />
                      <i className={`fa ${opt.icon}`} />
                      <div><strong>{opt.label}</strong><span>{opt.sub}</span></div>
                    </label>
                  ))}
                </div>
                <div className="coupon-row">
                  <input type="text" placeholder="Coupon code (e.g. WELCOME15)" value={coupon} onChange={e => setCoupon(e.target.value)} />
                  <button className="btn-apply" onClick={applyCoupon}>Apply</button>
                </div>
                {couponApplied && <p className="coupon-success"><i className="fa fa-check-circle" /> {couponApplied} applied — saved {fmt(discount)}</p>}
                <div className="step-btns">
                  <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={() => setStep(3)}>Review Order →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="checkout-section">
                <h2>Review Order</h2>
                <div className="review-items">
                  {cart.map(item => (
                    <div key={`${item.productId}-${item.size}`} className="review-item">
                      <div className="review-item-img">{item.img ? <img src={item.img} alt={item.name} /> : <i className="fa fa-tshirt" />}</div>
                      <div className="review-item-info"><h4>{item.name}</h4><p>Size: {item.size} · Qty: {item.qty}</p></div>
                      <span>{fmt(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="review-address">
                  <h4>Delivering to:</h4>
                  <p>{address.name} · {address.phone}</p>
                  <p>{address.line1}{address.line2 ? ', ' + address.line2 : ''}, {address.city}, {address.state} - {address.pin}</p>
                </div>
                <div className="step-btns">
                  <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn-primary place-order-btn" onClick={handlePlaceOrder} disabled={loading}>
                    {loading ? 'Placing Order...' : `Place Order · ${fmt(total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="checkout-sidebar">
            <h3>Order Summary</h3>
            {cart.map(item => (
              <div key={`${item.productId}-${item.size}`} className="sidebar-item">
                <span>{item.name} × {item.qty}</span>
                <span>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
            <div className="sidebar-divider" />
            <div className="sidebar-row"><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
            {discount > 0 && <div className="sidebar-row green"><span>Coupon ({couponApplied})</span><span>−{fmt(discount)}</span></div>}
            {prepaidDiscount > 0 && <div className="sidebar-row green"><span>Prepaid Discount (5%)</span><span>−{fmt(prepaidDiscount)}</span></div>}
            <div className="sidebar-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : fmt(shipping)}</span></div>
            {codFee > 0 && <div className="sidebar-row"><span>COD Fee</span><span>{fmt(codFee)}</span></div>}
            <div className="sidebar-divider" />
            <div className="sidebar-row total"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
