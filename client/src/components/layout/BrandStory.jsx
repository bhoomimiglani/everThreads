import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../utils/brand'
import Logo from '../Logo'
import toast from 'react-hot-toast'
import './BrandStory.css'

const VALUES = [
  { icon: '✦', label: 'CREATIVE\nEXPRESSION' },
  { icon: '◈', label: 'CREATOR\nFIRST' },
  { icon: '◉', label: 'HIGH\nQUALITY' },
  { icon: '◇', label: 'BUILT IN\nINDIA' },
]

export default function BrandStory() {
  const [email, setEmail] = useState('')

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    toast.success('Subscribed! Welcome to the community 🎉')
    setEmail('')
  }

  return (
    <>
      {/* ── BRAND STORY SECTION ── */}
      <section className="brand-story-section">
        {/* Left — image / visual */}
        <div className="brand-story-left">
          <div className="brand-story-visual">
            <div className="brand-story-gradient" />
            <div className="brand-story-overlay-text">
              <span>FOR</span>
              <span>CREATORS</span>
            </div>
          </div>
        </div>

        {/* Right — content */}
        <div className="brand-story-right">
          <h2 className="brand-story-name"><Logo size="lg" dark noLink /></h2>
          <h3 className="brand-story-subtitle">OUR STORY</h3>
          <p className="brand-story-desc">
            Everthreads isn't just a brand — it's a culture. Built for the people creating something of their own. For designers, editors, artists, filmmakers, gamers, photographers, musicians, and dreamers chasing something bigger than themselves. We create story-driven clothing inspired by creative culture, self-expression, and the energy of modern creators. Every drop is designed with intention — carrying its own concept, emotion, and identity.
          </p>
          <div className="brand-story-values">
            {VALUES.map(v => (
              <div key={v.label} className="brand-value-item">
                <div className="brand-value-icon">{v.icon}</div>
                <div className="brand-value-label">
                  {v.label.split('\n').map((line, i) => <span key={i}>{line}</span>)}
                </div>
              </div>
            ))}
          </div>
          <Link to="/about" className="brand-story-link">
            Read Full Story <i className="fa fa-arrow-right" />
          </Link>
        </div>
      </section>

      {/* ── NEWSLETTER SECTION ── */}
      <section className="newsletter-section">
        <div className="newsletter-inner-wrap">
          <div className="newsletter-text-block">
            <h3>JOIN THE COMMUNITY</h3>
            <p>Get early access to drops, exclusive deals & creator stories</p>
          </div>
          <form className="newsletter-form-block" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit">SUBSCRIBE</button>
          </form>
        </div>
      </section>
    </>
  )
}
