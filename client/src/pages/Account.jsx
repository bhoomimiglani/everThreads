import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { fmt, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import './Account.css'

export default function Account() {
  const { user, logout, updateUser, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' })

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return }
    setProfile({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' })
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/orders/myorders')
      setOrders(data.orders || [])
    } catch { setOrders([]) }
    setLoading(false)
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.put('/auth/updateprofile', profile)
      if (data.success) { updateUser(data.user); toast('Profile updated ✅') }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
  }

  const STATUS_COLORS = {
    pending: '#92400e', confirmed: '#1d4ed8', processing: '#92400e',
    packed: '#4c1d95', shipped: '#0e7490', out_for_delivery: '#92400e',
    delivered: '#166534', cancelled: '#991b1b', returned: '#374151'
  }

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-header">
          <div>
            <h1>My Account</h1>
            <p>Welcome back, {user?.firstName}!</p>
          </div>
          <button className="btn-outline-dark" onClick={() => { logout(); navigate('/') }}>
            <i className="fa fa-sign-out-alt" /> Sign Out
          </button>
        </div>

        <div className="account-layout">
          <aside className="account-sidebar">
            {[
              { id: 'orders', icon: 'fa-box', label: 'My Orders' },
              { id: 'profile', icon: 'fa-user', label: 'Profile' },
              { id: 'wishlist', icon: 'fa-heart', label: 'Wishlist' },
            ].map(t => (
              <button key={t.id} className={`sidebar-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                <i className={`fa ${t.icon}`} /> {t.label}
              </button>
            ))}
          </aside>

          <div className="account-content">
            {tab === 'orders' && (
              <div>
                <h2>My Orders</h2>
                {loading ? <p>Loading...</p> : orders.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa fa-box-open" />
                    <p>No orders yet</p>
                    <Link to="/shop" className="btn-primary">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(o => (
                      <div key={o._id} className="order-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-id">#{o.orderId}</span>
                            <span className="order-date">{fmtDate(o.createdAt)}</span>
                          </div>
                          <span className="order-status-badge" style={{ background: STATUS_COLORS[o.status] + '18', color: STATUS_COLORS[o.status] }}>
                            {o.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="order-items-preview">
                          {o.items?.slice(0, 3).map((item, i) => (
                            <div key={i} className="order-item-mini">
                              {item.img ? <img src={item.img} alt={item.name} /> : <div className="order-item-placeholder"><i className="fa fa-tshirt" /></div>}
                            </div>
                          ))}
                          {o.items?.length > 3 && <span className="more-items">+{o.items.length - 3}</span>}
                        </div>
                        <div className="order-card-footer">
                          <span>{o.items?.length} item(s) · {fmt(o.total)}</span>
                          <span className="payment-method">{o.paymentMethod?.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'profile' && (
              <div>
                <h2>Profile Settings</h2>
                <form onSubmit={handleProfileSave} className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={user?.email} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </form>
              </div>
            )}

            {tab === 'wishlist' && (
              <div>
                <h2>My Wishlist</h2>
                <div className="empty-state">
                  <i className="fa fa-heart" />
                  <p>View your wishlist on the <Link to="/wishlist">Wishlist page</Link></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
