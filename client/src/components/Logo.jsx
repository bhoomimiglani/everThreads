import { Link } from 'react-router-dom'
import './Logo.css'

/**
 * EverThreads logo — matches the brand image:
 * "Ever" in cursive script + "Threads" in bold sans-serif + ™
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   dark: bool — white version for dark backgrounds (default: false)
 *   noLink: bool — render as div instead of Link
 */
export default function Logo({ size = 'md', dark = false, noLink = false }) {
  const content = (
    <span className={`et-logo et-logo--${size}${dark ? ' et-logo--dark' : ''}`}>
      <span className="et-logo-ever">Ever</span>
      <span className="et-logo-threads">Threads</span>
      <sup className="et-logo-tm">™</sup>
    </span>
  )

  if (noLink) return content
  return <Link to="/" className="et-logo-link">{content}</Link>
}
