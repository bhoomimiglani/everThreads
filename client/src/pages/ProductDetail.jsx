import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { fmt } from '../utils/format'
import toast from 'react-hot-toast'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImg, setSelectedImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data.product)
        if (data.product?.sizes?.length) setSelectedSize(data.product.sizes[0])
      } catch { setProduct(null) }
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); return }
    setSizeError(false)
    addToCart(product, selectedSize, qty)
    toast('Added to bag 🛍️')
  }

  if (loading) return (
    <div className="container" style={{ padding: '60px 20px' }}>
      <div className="product-detail-skeleton">
        <div className="skeleton-img" />
        <div className="skeleton-info">
          <div className="skeleton-line w60" />
          <div className="skeleton-line w40" />
          <div className="skeleton-line w80" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h2>Product not found</h2>
      <Link to="/shop" className="btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Back to Shop</Link>
    </div>
  )

  const save = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.name}</span>
        </div>
        <div className="product-detail-grid">
          {/* Images */}
          <div className="product-images">
            <div className="main-image">
              {product.images?.[selectedImg]
                ? <img src={product.images[selectedImg]} alt={product.name} />
                : <div className="img-placeholder"><i className="fa fa-tshirt" /></div>
              }
              {product.badge && <span className={`product-badge ${product.badge}`}>{product.badge.toUpperCase()}</span>}
            </div>
            {product.images?.length > 1 && (
              <div className="image-thumbs">
                {product.images.map((img, i) => (
                  <div key={i} className={`thumb${selectedImg === i ? ' active' : ''}`} onClick={() => setSelectedImg(i)}>
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info-panel">
            <div className="product-category-tag">{product.category} {product.collection && `· ${product.collection}`}</div>
            <h1 className="product-title">{product.name}</h1>

            <div className="product-price-row">
              <span className="price-big">{fmt(product.price)}</span>
              {product.originalPrice > product.price && (
                <>
                  <span className="price-orig">{fmt(product.originalPrice)}</span>
                  <span className="price-save-badge">Save {save}%</span>
                </>
              )}
            </div>

            {product.rating > 0 && (
              <div className="product-rating">
                {Array(5).fill(0).map((_, i) => (
                  <i key={i} className={`fa fa-star${i < Math.round(product.rating) ? '' : '-o'}`} />
                ))}
                <span>({product.numReviews} reviews)</span>
              </div>
            )}

            {product.description && <p className="product-desc">{product.description}</p>}

            {/* Colors */}
            {product.colors?.length > 0 && (
              <div className="product-option-group">
                <label>Color</label>
                <div className="color-swatches">
                  {product.colors.map(c => (
                    <span key={c} className="color-swatch" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="product-option-group">
                <label>Size {sizeError && <span className="size-error">Please select a size</span>}</label>
                <div className="size-options">
                  {product.sizes.map(s => (
                    <button
                      key={s}
                      className={`size-btn${selectedSize === s ? ' active' : ''}`}
                      onClick={() => { setSelectedSize(s); setSizeError(false) }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add */}
            <div className="add-to-cart-row">
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="btn-primary add-btn" onClick={handleAddToCart}>
                <i className="fa fa-shopping-bag" /> ADD TO BAG
              </button>
            </div>

            {/* Features */}
            <div className="product-features">
              {[
                { icon: 'fa-truck', text: 'Free shipping on orders above ₹999' },
                { icon: 'fa-undo', text: 'Easy 7-day returns' },
                { icon: 'fa-shield-alt', text: 'Secure payment' },
                { icon: 'fa-box', text: 'Ships within 48 hours' },
              ].map(f => (
                <div key={f.text} className="product-feature-item">
                  <i className={`fa ${f.icon}`} />
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
