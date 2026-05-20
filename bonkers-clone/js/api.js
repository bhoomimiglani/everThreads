// ===== API CLIENT =====
const API_BASE = 'http://localhost:5000/api';

// ── Token / User helpers ──
const getToken  = ()  => localStorage.getItem('bc_token');
const setToken  = (t) => localStorage.setItem('bc_token', t);
const clearToken= ()  => localStorage.removeItem('bc_token');
const getUser   = ()  => { try { return JSON.parse(localStorage.getItem('bc_user') || 'null'); } catch(_){ return null; } };
const setUser   = (u) => localStorage.setItem('bc_user', JSON.stringify(u));
const clearUser = ()  => { localStorage.removeItem('bc_user'); localStorage.removeItem('bc_token'); };

// ── Base fetch ──
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res  = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    if (err.message.includes('fetch') || err.message.includes('Failed') || err.message.includes('NetworkError')) {
      return null; // backend offline
    }
    throw err;
  }
}

// ── getBasePath (needed by cart.js / products.js before main.js loads) ──
function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '' : 'pages/';
}

// ===== AUTH =====
const Auth = {
  async register(data) {
    const res = await apiFetch('/auth/register', { method:'POST', body:JSON.stringify(data) });
    if (res?.success) { setToken(res.token); setUser(res.user); }
    return res;
  },
  async login(email, password) {
    const res = await apiFetch('/auth/login', { method:'POST', body:JSON.stringify({ email, password }) });
    if (res?.success) { setToken(res.token); setUser(res.user); }
    return res;
  },
  logout() {
    clearUser();
    localStorage.removeItem('bc_cart');
    const base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.href = base + 'login.html';
  },
  async getMe() { return apiFetch('/auth/me'); },
  async updateProfile(data) {
    const res = await apiFetch('/auth/updateprofile', { method:'PUT', body:JSON.stringify(data) });
    if (res?.success) setUser(res.user);
    return res;
  },
  async changePassword(currentPassword, newPassword) {
    return apiFetch('/auth/changepassword', { method:'PUT', body:JSON.stringify({ currentPassword, newPassword }) });
  },
  async addAddress(addr) {
    const res = await apiFetch('/auth/address', { method:'POST', body:JSON.stringify(addr) });
    if (res?.success) { const u = getUser(); if (u) { u.addresses = res.addresses; setUser(u); } }
    return res;
  },
  async deleteAddress(id) { return apiFetch(`/auth/address/${id}`, { method:'DELETE' }); },
  async toggleWishlist(productId) {
    if (!getToken()) {
      const wl  = JSON.parse(localStorage.getItem('bc_wishlist') || '[]');
      const idx = wl.indexOf(productId);
      if (idx === -1) wl.push(productId); else wl.splice(idx, 1);
      localStorage.setItem('bc_wishlist', JSON.stringify(wl));
      return { success:true, wishlist:wl, added: idx === -1 };
    }
    const res = await apiFetch(`/auth/wishlist/${productId}`, { method:'PUT' });
    if (res?.success) {
      const u = getUser();
      if (u) { u.wishlist = res.wishlist; setUser(u); }
      localStorage.setItem('bc_wishlist', JSON.stringify(res.wishlist));
    }
    return res;
  },
  isLoggedIn()   { return !!getToken(); },
  isAdmin()      { return getUser()?.role === 'admin'; },
  currentUser()  { return getUser(); }
};

// ===== PRODUCTS API =====
const ProductsAPI = {
  async getAll(params = {}) { return apiFetch(`/products?${new URLSearchParams(params)}`); },
  async getOne(id)          { return apiFetch(`/products/${id}`); },
  async addReview(id, data) {
    if (!Auth.isLoggedIn()) { showToast('Please login to write a review'); return null; }
    return apiFetch(`/products/${id}/review`, { method:'POST', body:JSON.stringify(data) });
  }
};

// ===== ORDERS API =====
const OrdersAPI = {
  async create(data) {
    if (!Auth.isLoggedIn()) return null;
    return apiFetch('/orders', { method:'POST', body:JSON.stringify(data) });
  },
  async getMyOrders() {
    if (!Auth.isLoggedIn()) {
      return { success:true, orders: JSON.parse(localStorage.getItem('bc_orders') || '[]') };
    }
    return apiFetch('/orders/myorders');
  },
  async getOne(id)   { return apiFetch(`/orders/${id}`); },
  async cancel(id)   { return apiFetch(`/orders/${id}/cancel`, { method:'PUT' }); }
};

// ===== PAYMENT API =====
const PaymentAPI = {
  async createRazorpayOrder(amount) {
    return apiFetch('/payment/create-order', { method:'POST', body:JSON.stringify({ amount }) });
  },
  async verify(data) {
    return apiFetch('/payment/verify', { method:'POST', body:JSON.stringify(data) });
  }
};

// ===== ADMIN API =====
const AdminAPI = {
  async getDashboard()         { return apiFetch('/admin/dashboard'); },
  async getAnalytics()         { return apiFetch('/admin/analytics'); },
  async getUsers(p)            { return apiFetch(`/admin/users?${new URLSearchParams(p)}`); },
  async toggleUser(id)         { return apiFetch(`/admin/users/${id}/toggle`, { method:'PUT' }); },
  async getOrders(p)           { return apiFetch(`/admin/orders?${new URLSearchParams(p)}`); },
  async updateOrderStatus(id, data) { return apiFetch(`/admin/orders/${id}/status`, { method:'PUT', body:JSON.stringify(data) }); },
  async getInventory()         { return apiFetch('/admin/inventory'); },
  async restock(pid, data)     { return apiFetch(`/admin/inventory/${pid}/restock`, { method:'PUT', body:JSON.stringify(data) }); },
  async createProduct(data)    { return apiFetch('/products', { method:'POST', body:JSON.stringify(data) }); },
  async updateProduct(id, data){ return apiFetch(`/products/${id}`, { method:'PUT', body:JSON.stringify(data) }); },
  async deleteProduct(id)      { return apiFetch(`/products/${id}`, { method:'DELETE' }); }
};

// ===== HEADER AUTH UI — runs on every page =====
// Updates account icon and shows user name in a dropdown (NOT in search bar)
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.currentUser();

  // ── Account icon: show name tooltip, NOT in search bar ──
  const accountLink = document.getElementById('accountLink');
  if (accountLink) {
    if (user) {
      accountLink.title    = `Hi, ${user.firstName}`;
      accountLink.setAttribute('aria-label', user.firstName);
      // Show a small name badge next to icon on desktop
      const badge = document.createElement('span');
      badge.className = 'user-name-badge';
      badge.textContent = user.firstName;
      accountLink.appendChild(badge);
    } else {
      accountLink.href  = (window.location.pathname.includes('/pages/') ? '' : 'pages/') + 'login.html';
      accountLink.title = 'Login / Sign Up';
    }
  }

  // ── Sync wishlist from user object ──
  if (user?.wishlist?.length) {
    localStorage.setItem('bc_wishlist', JSON.stringify(user.wishlist));
  }

  // ── Show admin link if admin ──
  if (user?.role === 'admin') {
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink) adminLink.style.display = 'flex';
  }
});
