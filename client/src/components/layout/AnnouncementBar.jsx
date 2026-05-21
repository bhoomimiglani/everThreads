import './AnnouncementBar.css'

const messages = [
  '🚚 FREE SHIPPING ON ORDERS ABOVE ₹999',
  '💳 EXTRA 5% OFF ON PREPAID ORDERS',
  '📦 SHIPS WITHIN 48 HOURS',
  '🎁 USE CODE WELCOME15 FOR 15% OFF YOUR FIRST ORDER',
  '🔄 EASY 7-DAY RETURNS',
  '🇮🇳 100% MADE IN INDIA',
]

export default function AnnouncementBar() {
  const track = [...messages, ...messages]
  return (
    <div className="announcement-bar">
      <div className="announcement-track">
        {track.map((msg, i) => (
          <span key={i}>{msg}&nbsp;&nbsp;•&nbsp;&nbsp;</span>
        ))}
      </div>
    </div>
  )
}
