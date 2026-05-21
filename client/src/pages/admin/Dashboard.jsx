import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { fmt, fmtDate } from '../../utils/format'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="admin-loading"><i className="fa fa-spinner fa-spin" /> Loading dashboard...</div>
  if (!data) return <div className="admin-card"><p style={{ color: '#991b1b' }}>⚠️ Could not load dashboard. Make sure the backend is running.</p></div>

  const { stats, statusCounts, last7, lowStock, recentOrders } = data

  const STAT_CARDS = [
    { label: 'Total Customers', value: stats.totalUsers?.toLocaleString(), icon: 'fa-users', color: '' },
    { label: 'Total Revenue', value: fmt(stats.revenue), icon: 'fa-rupee-sign', color: 'green' },
    { label: 'Total Orders', value: stats.totalOrders?.toLocaleString(), icon: 'fa-box', color: '' },
    { label: 'Active Products', value: stats.totalProducts, icon: 'fa-tshirt', color: '' },
    { label: "Today's Orders", value: stats.todayOrders, icon: 'fa-calendar-day', color: 'blue', sub: fmt(stats.todayRevenue) + ' today' },
    { label: 'Low Stock Items', value: lowStock?.length, icon: 'fa-exclamation-triangle', color: lowStock?.length > 0 ? 'red' : '', sub: lowStock?.length > 0 ? 'Need restock' : 'All good ✅' },
  ]

  const STATUS_COLORS = { confirmed: '#1d4ed8', processing: '#92400e', packed: '#4c1d95', shipped: '#0e7490', out_for_delivery: '#92400e', delivered: '#166534', cancelled: '#991b1b', pending: '#92400e', returned: '#374151' }
  const maxR = Math.max(...(last7?.map(d => d.revenue) || [1]), 1)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Dashboard</h1><p>Welcome back! Here's what's happening today.</p></div>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <i className={`fa ${s.icon} stat-icon`} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.sub && <div className="stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="admin-card">
          <h3>Revenue — Last 7 Days</h3>
          <div className="bar-chart">
            {last7?.map((d, i) => (
              <div key={i} className="bar-col">
                <div className="bar-val">{d.revenue > 0 ? fmt(d.revenue) : ''}</div>
                <div className="bar" style={{ height: Math.max(4, (d.revenue / maxR) * 100) + 'px' }} />
                <div className="bar-label">{d.date}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <h3>Order Status Breakdown</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(statusCounts || {}).map(([s, c]) => (
              <div key={s} style={{ background: (STATUS_COLORS[s] || '#374151') + '18', color: STATUS_COLORS[s] || '#374151', padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s] || '#374151', display: 'inline-block' }} />
                {s.replace(/_/g, ' ')}: {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="admin-card">
          <h3>Recent Orders</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recentOrders?.map(o => (
                  <tr key={o._id}>
                    <td><strong style={{ fontFamily: 'monospace' }}>{o.orderId}</strong></td>
                    <td>{o.user ? o.user.firstName + ' ' + o.user.lastName : o.userEmail}</td>
                    <td>{fmt(o.total)}</td>
                    <td><span className={`badge badge-${o.status}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                    <td>{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="admin-card">
          <h3>Low Stock Alert</h3>
          {!lowStock?.length ? <p style={{ color: '#166534', fontSize: 13 }}>All products well stocked ✅</p> : (
            <div>
              {lowStock.map(p => (
                <div key={p.productId} className="low-stock-item">
                  <div>
                    <div className="low-stock-name">{p.name}</div>
                    <div className="low-stock-detail">{p.variants?.map(v => `${v.size}:${v.stock}`).join(' · ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
