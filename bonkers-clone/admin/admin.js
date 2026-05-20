const BC_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api';
// ===== ADMIN PANEL =====
'use strict';

const PAGE_SIZE = 15;
let allProducts = [], allInventory = [], allUsers = [];
let productPage = 1, orderPage = 1, userPage = 1;
let editingProductId = null, currentOrderId = null, deleteTargetId = null;

// â”€â”€ Debounce â”€â”€
function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// â”€â”€ Formatters â”€â”€
const fmt     = n  => 'â‚¹' + Number(n||0).toLocaleString('en-IN');
const fmtDate = d  => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
const fmtTime = d  => new Date(d).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

// â”€â”€ Toast â”€â”€
function toast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' toast-'+type : '');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3500);
}

// â”€â”€ Modal helpers â”€â”€
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// â”€â”€ Auth Guard â”€â”€
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('bc_token');
  const user  = (() => { try { return JSON.parse(localStorage.getItem('bc_user')||'null'); } catch(_){return null;} })();

  if (!token || !user) {
    showAuthGate(); return;
  }

  // Verify with backend
  const me = await adminFetch('/auth/me');
  if (!me || me.user?.role !== 'admin') {
    // Check localStorage role as fallback (offline mode)
    if (user.role !== 'admin') { showAuthGate(); return; }
  }

  // Authenticated
  document.body.classList.remove('loading-state');
  document.getElementById('adminName').textContent = (me?.user?.firstName || user.firstName) + ' ' + (me?.user?.lastName || user.lastName);
  setupNav();
  loadDashboard();
});

function showAuthGate() {
  document.body.classList.remove('loading-state');
  const gate = document.getElementById('authGate');
  gate.style.display = 'flex';
}

function adminLogout() {
  localStorage.removeItem('bc_token');
  localStorage.removeItem('bc_user');
  window.location.href = '../pages/login.html';
}

// â”€â”€ Navigation â”€â”€
function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });
}

function switchSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + name)?.classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  document.getElementById('topbarTitle').textContent =
    name.charAt(0).toUpperCase() + name.slice(1);
  const loaders = {
    products: loadProducts, orders: loadOrders,
    inventory: loadInventory, users: loadUsers, analytics: loadAnalytics
  };
  if (loaders[name]) loaders[name]();
}

// ===== DASHBOARD =====
async function loadDashboard() {
  const data = await adminFetch('/admin/dashboard');
  if (!data) { renderOfflineBanner('statsGrid'); return; }
  const { stats, statusCounts, last7, lowStock, recentOrders } = data;

  document.getElementById('statsGrid').innerHTML = [
    { label:'Total Customers', value: stats.totalUsers.toLocaleString(), icon:'fa-users', color:'' },
    { label:'Total Revenue',   value: fmt(stats.revenue),                icon:'fa-rupee-sign', color:'green' },
    { label:'Total Orders',    value: stats.totalOrders.toLocaleString(),icon:'fa-box', color:'' },
    { label:'Active Products', value: stats.totalProducts,               icon:'fa-tshirt', color:'' },
    { label:"Today's Orders",  value: stats.todayOrders,                 icon:'fa-calendar-day', color:'blue', sub: fmt(stats.todayRevenue)+' today' },
    { label:'Low Stock Items', value: lowStock.length,                   icon:'fa-exclamation-triangle', color: lowStock.length>0?'red':'', sub: lowStock.length>0?'Need restock':'All good âœ…' }
  ].map(s => `
    <div class="stat-card ${s.color}">
      <i class="fa ${s.icon} stat-icon"></i>
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      ${s.sub ? `<div class="stat-sub">${s.sub}</div>` : ''}
    </div>`).join('');

  // Revenue bar chart
  const maxR = Math.max(...last7.map(d => d.revenue), 1);
  document.getElementById('revenueChart').innerHTML = `
    <div class="bar-chart">
      ${last7.map(d => `
        <div class="bar-col">
          <div class="bar-val">${d.revenue > 0 ? fmt(d.revenue) : ''}</div>
          <div class="bar" style="height:${Math.max(4,(d.revenue/maxR)*100)}px"></div>
          <div class="bar-label">${d.date}</div>
        </div>`).join('')}
    </div>`;

  // Status pills
  const colors = { confirmed:'#1d4ed8',processing:'#92400e',packed:'#4c1d95',shipped:'#0e7490',out_for_delivery:'#92400e',delivered:'#166534',cancelled:'#991b1b',pending:'#92400e',returned:'#374151' };
  document.getElementById('statusChart').innerHTML = `
    <div class="status-pills">
      ${Object.entries(statusCounts).map(([s,c]) => `
        <div class="status-pill" style="background:${colors[s]||'#374151'}18;color:${colors[s]||'#374151'}">
          <div class="pill-dot" style="background:${colors[s]||'#374151'}"></div>
          ${s.replace(/_/g,' ')}: <strong>${c}</strong>
        </div>`).join('')}
    </div>`;

  // Recent orders
  document.getElementById('recentOrdersTable').innerHTML = `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${recentOrders.map(o => `
            <tr style="cursor:pointer" onclick="switchSection('orders')">
              <td><strong style="font-family:monospace">${o.orderId}</strong></td>
              <td>${o.user ? o.user.firstName+' '+o.user.lastName : o.userEmail}</td>
              <td>${fmt(o.total)}</td>
              <td><span class="badge badge-${o.status}">${o.status.replace(/_/g,' ')}</span></td>
              <td>${fmtDate(o.createdAt)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  // Low stock
  document.getElementById('lowStockList').innerHTML = !lowStock.length
    ? '<p class="empty-msg">All products well stocked âœ…</p>'
    : lowStock.map(p => `
        <div class="low-stock-item">
          <div>
            <div class="low-stock-name">${p.name}</div>
            <div class="low-stock-detail">${p.variants.map(v=>`${v.size}:${v.stock}`).join(' Â· ')}</div>
          </div>
          <button class="btn-sm" onclick="openRestockModal(${p.productId},'${p.name.replace(/'/g,"\\'")}',${JSON.stringify(p.variants.map(v=>v.size))})">
            Restock
          </button>
        </div>`).join('');
}

function renderOfflineBanner(id) {
  document.getElementById(id).innerHTML = `
    <div class="offline-banner">
      <i class="fa fa-server"></i>
      <div>
        <strong>Backend Offline</strong>
        <p>Start the server: <code>cd server && node index.js</code></p>
      </div>
    </div>`;
}

// ===== PRODUCTS =====
async function loadProducts() {
  // Use admin inventory endpoint â€” returns ALL products including inactive
  const data = await adminFetch('/admin/inventory');
  allProducts = data?.products || [];
  document.getElementById('productCount').textContent = allProducts.length;
  filterProducts();
}

function filterProducts() {
  const q   = document.getElementById('productSearch')?.value.toLowerCase() || '';
  const cat = document.getElementById('productCatFilter')?.value || '';
  const col = document.getElementById('productCollFilter')?.value || '';
  const list = allProducts.filter(p =>
    (!q   || p.name.toLowerCase().includes(q)) &&
    (!cat || p.category === cat) &&
    (!col || p.collection === col)
  );
  renderProductsTable(list);
}

function renderProductsTable(list) {
  const start = (productPage - 1) * PAGE_SIZE;
  const page  = list.slice(start, start + PAGE_SIZE);
  document.getElementById('productsBody').innerHTML = page.map(p => {
    const stock = p.variants?.reduce((s,v) => s+v.stock, 0) || 0;
    const sc    = stock === 0 ? 'stock-out' : stock <= (p.lowStockAlert||5) ? 'stock-low' : 'stock-ok';
    return `
      <tr>
        <td><img src="${p.images?.[0]||''}" class="product-thumb" alt="${p.name}" onerror="this.style.display='none'" /></td>
        <td>
          <strong>${p.name}</strong>
          <div style="font-size:11px;color:#64748b">#${p.productId} Â· ${p.slug||''}</div>
        </td>
        <td><span class="badge" style="background:#f1f5f9;color:#334155">${p.category}</span></td>
        <td><strong>${fmt(p.price)}</strong></td>
        <td style="color:#94a3b8;text-decoration:line-through">${fmt(p.originalPrice)}</td>
        <td><span class="${sc}">${stock}</span></td>
        <td>${p.badge ? `<span class="badge badge-${p.badge}">${p.badge.toUpperCase()}</span>` : 'â€”'}</td>
        <td>${p.isFeatured ? '<i class="fa fa-star" style="color:#f59e0b"></i>' : 'â€”'}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" onclick="editProduct('${p._id}')" title="Edit"><i class="fa fa-edit"></i></button>
            <button class="btn-icon" onclick="openRestockModal(${p.productId},'${p.name.replace(/'/g,"\\'")}',${JSON.stringify(p.sizes||[])})" title="Restock"><i class="fa fa-plus-circle"></i></button>
            <button class="btn-icon danger" onclick="openDeleteModal('${p._id}','${p.name.replace(/'/g,"\\'")}',${p.isActive})" title="${p.isActive?'Deactivate':'Activate'}">
              <i class="fa fa-${p.isActive?'eye-slash':'eye'}"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="9" class="empty-cell">No products found</td></tr>';
  renderPagination('productsPagination', list.length, productPage, n => { productPage=n; renderProductsTable(list); });
}

// â”€â”€ Product Modal â”€â”€
function openProductModal() {
  editingProductId = null;
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  ['pName','pDesc','pImage'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('pPrice').value = '';
  document.getElementById('pOriginalPrice').value = '';
  document.getElementById('pSizes').value = 'XS,S,M,L,XL,XXL';
  document.getElementById('pColors').value = '#1a1a1a,#ffffff';
  document.getElementById('pDefaultStock').value = '50';
  document.getElementById('pLowStock').value = '5';
  document.getElementById('pBadge').value = '';
  document.getElementById('pFeatured').value = 'false';
  document.getElementById('pTag').value = 'trending';
  document.getElementById('pCollection').value = '';
  document.getElementById('pCategory').value = 'men';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('productPreview').style.display = 'none';
  clearFormErrors();
  openModal('productModal');
}

function editProduct(id) {
  const p = allProducts.find(x => x._id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('productModalTitle').textContent = 'Edit Product â€” ' + p.name;
  document.getElementById('pName').value          = p.name;
  document.getElementById('pCategory').value      = p.category;
  document.getElementById('pCollection').value    = p.collection || '';
  document.getElementById('pTag').value           = p.tag || 'trending';
  document.getElementById('pPrice').value         = p.price;
  document.getElementById('pOriginalPrice').value = p.originalPrice;
  document.getElementById('pBadge').value         = p.badge || '';
  document.getElementById('pSizes').value         = (p.sizes||[]).join(',');
  document.getElementById('pColors').value        = (p.colors||[]).join(',');
  document.getElementById('pImage').value         = p.images?.[0] || '';
  document.getElementById('pDesc').value          = p.description || '';
  document.getElementById('pFeatured').value      = p.isFeatured ? 'true' : 'false';
  document.getElementById('pLowStock').value      = p.lowStockAlert || 5;
  document.getElementById('pDefaultStock').value  = 50;
  previewImage(p.images?.[0] || '');
  clearFormErrors();
  openModal('productModal');
}

function previewImage(url) {
  const img = document.getElementById('imagePreview');
  if (!url) { img.style.display='none'; return; }
  img.src = url; img.style.display = 'block';
  img.onerror = () => img.style.display='none';
}

function previewProduct() {
  const name  = document.getElementById('pName').value || 'Product Name';
  const price = +document.getElementById('pPrice').value || 0;
  const orig  = +document.getElementById('pOriginalPrice').value || 0;
  const img   = document.getElementById('pImage').value;
  const badge = document.getElementById('pBadge').value;
  const save  = orig > 0 ? Math.round(((orig-price)/orig)*100) : 0;
  const wrap  = document.getElementById('productPreview');
  const card  = document.getElementById('productPreviewCard');
  wrap.style.display = 'block';
  card.innerHTML = `
    <div style="border:1px solid #eee;overflow:hidden;font-family:Inter,sans-serif">
      <div style="position:relative;aspect-ratio:3/4;background:#f0f0f0;display:flex;align-items:center;justify-content:center">
        ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover" />` : '<i class="fa fa-tshirt" style="font-size:40px;color:#ccc"></i>'}
        ${badge ? `<span style="position:absolute;top:8px;left:8px;background:#e63946;color:#fff;font-size:9px;font-weight:700;padding:3px 7px">${badge.toUpperCase()}</span>` : ''}
      </div>
      <div style="padding:10px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px">${name}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="font-size:13px;font-weight:700">â‚¹${price.toLocaleString('en-IN')}</span>
          ${orig ? `<span style="font-size:11px;color:#aaa;text-decoration:line-through">â‚¹${orig.toLocaleString('en-IN')}</span>` : ''}
          ${save ? `<span style="font-size:10px;color:#e63946;font-weight:700">Save ${save}%</span>` : ''}
        </div>
      </div>
    </div>`;
}

function clearFormErrors() {
  ['pNameErr','pPriceErr','pOrigErr'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=''; });
}

function validateProductForm() {
  let ok = true;
  const name  = document.getElementById('pName').value.trim();
  const price = +document.getElementById('pPrice').value;
  const orig  = +document.getElementById('pOriginalPrice').value;
  if (!name) { document.getElementById('pNameErr').textContent='Name required'; ok=false; }
  if (!price || price <= 0) { document.getElementById('pPriceErr').textContent='Valid price required'; ok=false; }
  if (!orig || orig <= 0)   { document.getElementById('pOrigErr').textContent='Valid MRP required'; ok=false; }
  if (price > orig) { document.getElementById('pPriceErr').textContent='Price cannot exceed MRP'; ok=false; }
  return ok;
}

async function saveProduct() {
  if (!validateProductForm()) return;
  const btn = document.getElementById('saveProductBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

  const body = {
    name:          document.getElementById('pName').value.trim(),
    category:      document.getElementById('pCategory').value,
    collection:    document.getElementById('pCollection').value || undefined,
    tag:           document.getElementById('pTag').value,
    price:         +document.getElementById('pPrice').value,
    originalPrice: +document.getElementById('pOriginalPrice').value,
    badge:         document.getElementById('pBadge').value || null,
    sizes:         document.getElementById('pSizes').value.split(',').map(s=>s.trim()).filter(Boolean),
    colors:        document.getElementById('pColors').value.split(',').map(s=>s.trim()).filter(Boolean),
    images:        [document.getElementById('pImage').value.trim()].filter(Boolean),
    description:   document.getElementById('pDesc').value.trim(),
    isFeatured:    document.getElementById('pFeatured').value === 'true',
    lowStockAlert: +document.getElementById('pLowStock').value || 5,
    defaultStock:  +document.getElementById('pDefaultStock').value || 50
  };

  try {
    const res = editingProductId
      ? await adminFetch(`/products/${editingProductId}`, { method:'PUT', body:JSON.stringify(body) })
      : await adminFetch('/products', { method:'POST', body:JSON.stringify(body) });

    if (res?.success) {
      toast(editingProductId ? 'âœ… Product updated successfully' : 'âœ… Product created â€” customers can now see it');
      closeModal('productModal');
      await loadProducts();
    } else if (res === null) {
      toast('âš ï¸ Backend offline â€” product not saved', 'error');
    } else {
      toast(res.message || 'Failed to save', 'error');
    }
  } catch (err) {
    toast(err.message, 'error');
  }
  btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Save Product';
}

function openDeleteModal(id, name, isActive) {
  deleteTargetId = { id, isActive };
  document.getElementById('deleteProductName').textContent = name;
  openModal('deleteModal');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const { id, isActive } = deleteTargetId;
  const res = await adminFetch(`/products/${id}`, { method:'PUT', body:JSON.stringify({ isActive: !isActive }) });
  if (res?.success) {
    toast(isActive ? 'Product deactivated â€” hidden from store' : 'Product activated â€” visible in store');
    closeModal('deleteModal');
    loadProducts();
  } else toast('Backend offline', 'error');
}

// ===== ORDERS =====
async function loadOrders() {
  const search = document.getElementById('orderSearch')?.value || '';
  const status = document.getElementById('orderStatusFilter')?.value || '';
  const pay    = document.getElementById('orderPayFilter')?.value || '';
  const params = new URLSearchParams({ page: orderPage, limit: PAGE_SIZE });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const data = await adminFetch(`/admin/orders?${params}`);
  if (!data) { document.getElementById('ordersBody').innerHTML='<tr><td colspan="8" class="empty-cell">Backend offline</td></tr>'; return; }
  document.getElementById('orderCount').textContent = data.total;
  let orders = data.orders;
  if (pay) orders = orders.filter(o => o.paymentMethod === pay);
  renderOrdersTable(orders, data.total);
}

function renderOrdersTable(orders, total) {
  document.getElementById('ordersBody').innerHTML = orders.map(o => `
    <tr>
      <td><strong style="font-family:monospace;font-size:12px">${o.orderId}</strong></td>
      <td>
        <div style="font-weight:600;font-size:13px">${o.user ? o.user.firstName+' '+o.user.lastName : 'â€”'}</div>
        <div style="font-size:11px;color:#64748b">${o.userEmail}</div>
      </td>
      <td>${o.items?.length||0} item(s)</td>
      <td><strong>${fmt(o.total)}</strong></td>
      <td>
        <span class="badge" style="background:${o.paymentMethod==='cod'?'#fef3c7':'#dbeafe'};color:${o.paymentMethod==='cod'?'#92400e':'#1e40af'}">
          ${o.paymentMethod?.toUpperCase()}
        </span>
      </td>
      <td><span class="badge badge-${o.status}">${o.status.replace(/_/g,' ')}</span></td>
      <td style="font-size:12px">${fmtDate(o.createdAt)}</td>
      <td>
        <button class="btn-icon" onclick="viewOrder('${o.orderId}')" title="View & Update"><i class="fa fa-eye"></i></button>
      </td>
    </tr>`).join('') || '<tr><td colspan="8" class="empty-cell">No orders found</td></tr>';
  renderPagination('ordersPagination', total, orderPage, n => { orderPage=n; loadOrders(); });
}

async function viewOrder(orderId) {
  currentOrderId = orderId;
  const data = await adminFetch(`/orders/${orderId}`);
  if (!data) { toast('Backend offline', 'error'); return; }
  const o = data.order;
  document.getElementById('orderModalTitle').textContent = `Order #${o.orderId}`;
  document.getElementById('orderModalBody').innerHTML = `
    <div class="order-detail-grid">
      <div class="detail-block">
        <h4>Customer</h4>
        <p><strong>${o.address?.name||'â€”'}</strong><br>${o.userEmail}<br>${o.address?.phone||''}</p>
      </div>
      <div class="detail-block">
        <h4>Delivery Address</h4>
        <p>${o.address?.line1||''}<br>${o.address?.city}, ${o.address?.state} ${o.address?.pin}</p>
      </div>
      <div class="detail-block">
        <h4>Payment</h4>
        <p>Method: <strong>${o.paymentMethod?.toUpperCase()}</strong><br>
        ${o.paymentId?'ID: '+o.paymentId:''}<br>
        Total: <strong>${fmt(o.total)}</strong><br>
        ${o.couponCode?'Coupon: '+o.couponCode:''}</p>
      </div>
      <div class="detail-block">
        <h4>Timeline</h4>
        <p>Placed: ${fmtTime(o.createdAt)}<br>
        Est. Delivery: ${o.estimatedDelivery?fmtDate(o.estimatedDelivery):'N/A'}</p>
      </div>
    </div>
    <h4 style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:16px 0 10px">Items (${o.items?.length||0})</h4>
    <div class="order-items-list">
      ${(o.items||[]).map(i => `
        <div class="order-item-row">
          <img src="${i.img}" class="order-item-img" alt="${i.name}" onerror="this.style.display='none'" />
          <div class="order-item-info">
            <h4>${i.name}</h4>
            <p>Size: ${i.size} Â· Qty: ${i.qty} Â· â‚¹${i.price.toLocaleString('en-IN')} each</p>
          </div>
          <div class="order-item-price">${fmt(i.price*i.qty)}</div>
        </div>`).join('')}
    </div>
    <div style="background:#f8fafc;padding:14px;border-radius:6px;margin:12px 0;font-size:13px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Subtotal</span><span>${fmt(o.subtotal)}</span></div>
      ${o.discount?`<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#166534"><span>Discount</span><span>âˆ’${fmt(o.discount)}</span></div>`:''}
      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Shipping</span><span>${o.shipping===0?'FREE':fmt(o.shipping)}</span></div>
      ${o.codFee?`<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>COD Fee</span><span>${fmt(o.codFee)}</span></div>`:''}
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:15px;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:4px"><span>Total</span><span>${fmt(o.total)}</span></div>
    </div>
    <h4 style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin-bottom:8px">Update Status</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <select class="status-select" id="newOrderStatus">
        ${['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','returned']
          .map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s.replace(/_/g,' ')}</option>`).join('')}
      </select>
      <input type="text" id="statusMessage" placeholder="Status note (optional)" style="padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;outline:none" />
    </div>
    <h4 style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin:16px 0 8px">Tracking History</h4>
    <div class="tracking-list">
      ${(o.tracking||[]).slice().reverse().map(t=>`
        <div class="tracking-item">
          <div class="tracking-dot"></div>
          <div class="tracking-info">
            <strong>${t.status?.replace(/_/g,' ')}</strong>
            <span>${t.message} Â· ${fmtTime(t.timestamp)}</span>
          </div>
        </div>`).join('')}
    </div>`;
  openModal('orderModal');
}

async function submitStatusUpdate() {
  const status  = document.getElementById('newOrderStatus').value;
  const message = document.getElementById('statusMessage').value;
  const res = await adminFetch(`/admin/orders/${currentOrderId}/status`, {
    method:'PUT', body:JSON.stringify({ status, message })
  });
  if (res?.success) { toast('âœ… Order status updated'); closeModal('orderModal'); loadOrders(); }
  else toast('Backend offline', 'error');
}

function exportOrdersCSV() {
  toast('CSV export requires backend connection');
}

// ===== INVENTORY =====
async function loadInventory() {
  const data = await adminFetch('/admin/inventory');
  allInventory = data?.products || [];
  filterInventory();
}

function filterInventory() {
  const q     = document.getElementById('invSearch')?.value.toLowerCase() || '';
  const cat   = document.getElementById('invCatFilter')?.value || '';
  const stock = document.getElementById('invStockFilter')?.value || '';
  const list  = allInventory.filter(p => {
    const total = p.variants?.reduce((s,v)=>s+v.stock,0)||0;
    return (!q   || p.name.toLowerCase().includes(q)) &&
           (!cat || p.category===cat) &&
           (!stock || (stock==='low'&&total>0&&total<=(p.lowStockAlert||5)) || (stock==='out'&&total===0));
  });
  renderInventoryTable(list);
}

function renderInventoryTable(list) {
  const sizes = ['XS','S','M','L','XL','XXL'];
  document.getElementById('inventoryBody').innerHTML = list.map(p => {
    const total = p.variants?.reduce((s,v)=>s+v.stock,0)||0;
    const tc    = total===0?'stock-out':total<=(p.lowStockAlert||5)?'stock-low':'stock-ok';
    const cells = sizes.map(sz => {
      const v = p.variants?.find(x=>x.size===sz);
      if (!v) return '<td class="stock-cell" style="color:#cbd5e1">â€”</td>';
      const c = v.stock===0?'stock-out':v.stock<=(p.lowStockAlert||5)?'stock-low':'stock-ok';
      return `<td class="stock-cell"><span class="${c}">${v.stock}</span></td>`;
    }).join('');
    return `
      <tr>
        <td><strong>${p.name}</strong><br><span style="font-size:11px;color:#64748b">#${p.productId}</span></td>
        <td>${p.category}</td>
        ${cells}
        <td><span class="${tc}">${total}</span></td>
        <td>
          <button class="btn-sm" onclick="openRestockModal(${p.productId},'${p.name.replace(/'/g,"\\'")}',${JSON.stringify(p.variants?.map(v=>v.size)||[])})">
            <i class="fa fa-plus"></i> Restock
          </button>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="10" class="empty-cell">No products found</td></tr>';
}

function openRestockModal(productId, name, sizes) {
  document.getElementById('restockProductName').textContent = name;
  const sel = document.getElementById('restockSize');
  const arr  = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
  sel.innerHTML = arr.map(s=>`<option value="${s}">${s}</option>`).join('');
  sel.dataset.productId = productId;
  document.getElementById('restockQty').value  = 50;
  document.getElementById('restockNote').value = '';
  openModal('restockModal');
}

async function submitRestock() {
  const productId = document.getElementById('restockSize').dataset.productId;
  const size      = document.getElementById('restockSize').value;
  const qty       = +document.getElementById('restockQty').value;
  const note      = document.getElementById('restockNote').value;
  if (!qty || qty < 1) { toast('Enter a valid quantity', 'error'); return; }
  const res = await adminFetch(`/admin/inventory/${productId}/restock`, {
    method:'PUT', body:JSON.stringify({ size, qty, note })
  });
  if (res?.success) { toast(`âœ… ${res.message||'Restocked successfully'}`); closeModal('restockModal'); loadInventory(); }
  else toast('Backend offline', 'error');
}

async function loadInventoryLogs() {
  const panel = document.getElementById('logsPanel');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior:'smooth' });
  const data = await adminFetch('/inventory/logs?limit=100');
  if (!data) { document.getElementById('logsBody').innerHTML='<tr><td colspan="8" class="empty-cell">Backend offline</td></tr>'; return; }
  document.getElementById('logsBody').innerHTML = data.logs.map(l => `
    <tr>
      <td style="font-size:11px">${fmtTime(l.createdAt)}</td>
      <td>${l.productName}</td>
      <td>${l.size||'â€”'}</td>
      <td><span class="badge" style="background:${l.type==='restock'?'#d1fae5':l.type==='sale'?'#dbeafe':'#fef3c7'};color:${l.type==='restock'?'#065f46':l.type==='sale'?'#1e40af':'#92400e'}">${l.type}</span></td>
      <td><strong>${l.type==='sale'?'-':'+'}${l.qty}</strong></td>
      <td>${l.before??'â€”'}</td>
      <td>${l.after??'â€”'}</td>
      <td style="font-size:12px;color:#64748b">${l.note||'â€”'}</td>
    </tr>`).join('') || '<tr><td colspan="8" class="empty-cell">No logs</td></tr>';
}

function exportInventoryCSV() {
  if (!allInventory.length) { toast('No data to export'); return; }
  const rows = [['Product','Category','XS','S','M','L','XL','XXL','Total']];
  allInventory.forEach(p => {
    const sizes = ['XS','S','M','L','XL','XXL'];
    const stocks = sizes.map(sz => p.variants?.find(v=>v.size===sz)?.stock??0);
    rows.push([p.name, p.category, ...stocks, stocks.reduce((a,b)=>a+b,0)]);
  });
  downloadCSV(rows, 'inventory.csv');
}

// ===== CUSTOMERS =====
async function loadUsers() {
  const search = document.getElementById('userSearch')?.value || '';
  const params = new URLSearchParams({ page: userPage, limit: PAGE_SIZE });
  if (search) params.set('search', search);
  const data = await adminFetch(`/admin/users?${params}`);
  if (!data) { document.getElementById('usersBody').innerHTML='<tr><td colspan="6" class="empty-cell">Backend offline</td></tr>'; return; }
  document.getElementById('userCount').textContent = data.total;
  document.getElementById('usersBody').innerHTML = data.users.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:50%;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">${u.firstName[0]}</div>
          <strong>${u.firstName} ${u.lastName}</strong>
        </div>
      </td>
      <td>${u.email}</td>
      <td>${u.phone||'â€”'}</td>
      <td style="font-size:12px">${fmtDate(u.createdAt)}</td>
      <td><span class="badge ${u.isActive?'badge-active':'badge-inactive'}">${u.isActive?'Active':'Blocked'}</span></td>
      <td>
        <button class="btn-icon ${u.isActive?'danger':''}" onclick="toggleUser('${u._id}','${u.firstName}',${u.isActive})" title="${u.isActive?'Block':'Unblock'}">
          <i class="fa fa-${u.isActive?'ban':'check'}"></i>
        </button>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty-cell">No customers found</td></tr>';
  renderPagination('usersPagination', data.total, userPage, n => { userPage=n; loadUsers(); });
}

async function toggleUser(id, name, isActive) {
  if (!confirm(`${isActive?'Block':'Unblock'} user "${name}"?`)) return;
  const res = await adminFetch(`/admin/users/${id}/toggle`, { method:'PUT' });
  if (res?.success) { toast(`User ${isActive?'blocked':'unblocked'}`); loadUsers(); }
  else toast('Backend offline', 'error');
}

function exportUsersCSV() { toast('CSV export requires backend connection'); }

// ===== ANALYTICS =====
async function loadAnalytics() {
  const data = await adminFetch('/admin/analytics');
  if (!data) { document.getElementById('monthlyChart').innerHTML='<p class="empty-msg">Backend offline</p>'; return; }
  const { topProducts, categoryRevenue, monthly } = data;

  const maxM = Math.max(...monthly.map(m=>m.revenue),1);
  document.getElementById('monthlyChart').innerHTML = `
    <div class="bar-chart">
      ${monthly.map(m=>`
        <div class="bar-col">
          <div class="bar-val" style="font-size:10px">${m.revenue>0?fmt(m.revenue):''}</div>
          <div class="bar" style="height:${Math.max(4,(m.revenue/maxM)*100)}px;background:#1a1a1a"></div>
          <div class="bar-label">${m.month}</div>
        </div>`).join('')}
    </div>`;

  const maxC = Math.max(...categoryRevenue.map(c=>c.revenue),1);
  document.getElementById('categoryChart').innerHTML = categoryRevenue.map(c=>`
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:4px">
        <span style="text-transform:capitalize">${c._id}</span><span>${fmt(c.revenue)}</span>
      </div>
      <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${(c.revenue/maxC)*100}%;background:#e63946;border-radius:4px;transition:width .5s"></div>
      </div>
      <div style="font-size:10px;color:#64748b;margin-top:2px">${c.units} units sold</div>
    </div>`).join('');

  document.getElementById('topProductsBody').innerHTML = topProducts.map((p,i)=>`
    <tr>
      <td><strong>#${i+1}</strong></td>
      <td>${p.name}</td>
      <td><strong>${p.totalSold}</strong></td>
      <td>${fmt(p.revenue)}</td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty-cell">No data yet</td></tr>';
}

// ===== PAGINATION =====
function renderPagination(id, total, current, onPage) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) { document.getElementById(id).innerHTML=''; return; }
  let html = '';
  const start = Math.max(1, current-2), end = Math.min(pages, current+2);
  if (start > 1) html += `<button class="page-btn" onclick="(${onPage.toString()})(1)">1</button>${start>2?'<span style="padding:0 4px">â€¦</span>':''}`;
  for (let i=start; i<=end; i++) html += `<button class="page-btn ${i===current?'active':''}" onclick="(${onPage.toString()})(${i})">${i}</button>`;
  if (end < pages) html += `${end<pages-1?'<span style="padding:0 4px">â€¦</span>':''}<button class="page-btn" onclick="(${onPage.toString()})(${pages})">${pages}</button>`;
  document.getElementById(id).innerHTML = html;
}

// ===== CSV DOWNLOAD =====
function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download= filename; a.click();
}


