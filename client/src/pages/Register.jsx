import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await register(form)
      if (res.success) {
        toast('Account created! Welcome 🎉')
        navigate('/')
      } else {
        toast.error(res.message || 'Registration failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Link to="/">EVER<span>THREAD</span></Link></div>
        <h2>Create Account</h2>
        <p className="auth-sub">Join the EverThread community</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" value={form.firstName} onChange={set('firstName')} required placeholder="Rahul" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" value={form.lastName} onChange={set('lastName')} required placeholder="Sharma" />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="Min 6 characters" minLength={6} />
          </div>
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
