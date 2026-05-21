import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo footer-logo">EVER<span>THREAD</span></Link>
            <p>Unisex luxury streetwear crafted for the bold. Made in India, worn worldwide.</p>
            <div className="social-links">
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a>
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook" /></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter" /></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube" /></a>
            </div>
          </div>
          <div className="footer-col">
            <h4>SHOP</h4>
            <ul>
              <li><Link to="/shop?category=men">Men</Link></li>
              <li><Link to="/shop?category=women">Women</Link></li>
              <li><Link to="/shop?tag=new">New In</Link></li>
              <li><Link to="/shop">Collections</Link></li>
              <li><Link to="/shop?sort=discount">Sale</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>HELP</h4>
            <ul>
              <li><a href="#">Size Guide</a></li>
              <li><a href="#">Track Order</a></li>
              <li><a href="#">Returns & Exchange</a></li>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>COMPANY</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 EverThread. All rights reserved. Made with ❤️ in India.</p>
          <div className="payment-icons">
            <i className="fab fa-cc-visa" />
            <i className="fab fa-cc-mastercard" />
            <i className="fab fa-cc-paypal" />
            <i className="fab fa-google-pay" />
          </div>
        </div>
      </div>
    </footer>
  )
}
