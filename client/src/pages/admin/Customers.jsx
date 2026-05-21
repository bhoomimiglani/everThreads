import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'
import { fmtDate } from '../../utils/format'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (search) params.set('search', search)
      const { data } = await api.get(`/admin/users?${params}`)
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch { toast.error('Failed to load customers') }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const toggleUser = async (u) => {
    if (!window.confirm(`${u.isActive ? 'Block' : 'Unblock'} user "${u.firstName} ${u.lastName}"?`)) return
    try {
      await api.put(`/admin/users/${u._id}/toggle`)
      toast.success(`User ${u.isActive ? 'blocked' : 'unblocked'}`)
      load()
    } catch { toast.error('Failed to update user') }
  }

  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="admin-page-header">
        <div><h1>Customers</h1><p>{total} registered customers</p></div>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <i className="fa fa-search" />
            <input placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Customer</th><th>Email</th><th>Phone</th><th>Joined</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="empty-cell"><i className="fa fa-spinner fa-spin" /> Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="empty-cell">No customers found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a1a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {u.firstName?.[0]}
                      </div>
                      <strong>{u.firstName} {u.lastName}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                  <td><span className={`badge badge-${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Blocked'}</span></td>
                  <td>
                    <button className={`btn-icon${u.isActive ? ' danger' : ''}`} onClick={() => toggleUser(u)} title={u.isActive ? 'Block' : 'Unblock'}>
                      <i className={`fa fa-${u.isActive ? 'ban' : 'check'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="admin-pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><i className="fa fa-chevron-left" /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}><i className="fa fa-chevron-right" /></button>
          </div>
        )}
      </div>
    </div>
  )
}
