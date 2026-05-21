import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Admin.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'fa-tachometer-alt', end: true },
  { to: '/admin/products', label: 'Products', icon: 'fa-tshirt' },
  { to: '/admin/orders', label: 'Orders', icon: 'fa-box' },
  { to: '/admin/inventory', label: 'Inventory', icon: 'fa-warehouse' },
  { to: '/admin/customers', label: 'Customers', icon: 'fa-users' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'fa-chart-bar' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-logo">EVER<span>THREAD</span></span>
          <span className="admin-badge">Admin</span>
        </div>
        <nav className="admin-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
              <i className={`fa ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-avatar">{user?.firstName?.[0]}</div>
            <div>
              <div className="admin-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <div className="admin-sidebar-actions">
            <button onClick={() => navigate('/')} className="admin-action-btn" title="View Store">
              <i className="fa fa-store" />
            </button>
            <button onClick={() => { logout(); navigate('/login') }} className="admin-action-btn" title="Logout">
              <i className="fa fa-sign-out-alt" />
            </button>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
