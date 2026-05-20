// ===== SHOP PAGE =====
const SHOP_API = BC_API;
let allShopProducts = [];   // full list from API or static
let filteredProducts = [];  // after filters applied
let visibleCount = 12;

// â”€â”€ Init â”€â”€
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAllProducts();

  // Read ?q= from URL and pre-fill search box
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    const si = document.getElementById('searchInput');
    if (si) si.value = q;
  }

  // Read ?category= from URL
  const cat = params.get('category');
  if (cat) {
    const cb = document.querySelector(`.filter-section input[value="${cat}"]`);
    if (cb) { cb.checked = true; }
  }

  applyFilters();

  // Search input: live filter
  document.getElementById('searchInput')?.addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(applyFilters, 300);
  });
  document.getElementById('searchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') applyFilters();
  });
});

// â”€â”€ Fetch products from API, fallback to static â”€â”€
async function fetchAllProducts() {
  try {
    const res = await fetch(`${SHOP_API}/products?limit=200`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.products?.length) {
        allShopProducts = data.products.map(normaliseProduct);
        // Merge into global products array so cart/detail work
        allShopProducts.forEach(np => {
          const idx = products.findIndex(p => p.id === np.id);
          if (idx !== -1) products[idx] = { ...products[idx], ...np };
          else products.push(np);
        });
        return;
      }
    }
  } catch (_) {}
  // Static fallback
  allShopProducts = [...products];
}

// â”€â”€ Apply all filters + sort â”€â”€
function applyFilters() {
  const search   = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const maxPrice = +(document.getElementById('priceRange')?.value || 2500);
  const sort     = document.getElementById('sortSelect')?.value || 'default';
  const minRating= +(document.querySelector('input[name="rating"]:checked')?.value || 0);

  // Collect checked category/collection checkboxes
  const checkedCats = [...document.querySelectorAll('.filter-section input[type=checkbox]:checked')]
    .map(c => c.value).filter(v => v !== 'all');

  let result = allShopProducts.filter(p => {
    // Search: name, category, collection, tag
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      (p.category || '').toLowerCase().includes(search) ||
      (p.collection || '').toLowerCase().includes(search) ||
      (p.tag || '').toLowerCase().includes(search);

    // Category/collection filter
    const matchCat = checkedCats.length === 0 ||
      checkedCats.includes(p.category) ||
      checkedCats.includes(p.collection);

    // Price
    const matchPrice = p.price <= maxPrice;

    // Rating
    const matchRating = !minRating || (p.rating || 0) >= minRating;

    return matchSearch && matchCat && matchPrice && matchRating;
  });

  // Sort
  if (sort === 'price-low')  result.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
  if (sort === 'newest')     result.sort((a, b) => b.id - a.id);
  if (sort === 'discount')   result.sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price));
  if (sort === 'rating')     result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  filteredProducts = result;
  visibleCount = 12;
  renderGrid();
  renderActiveFilters(search, checkedCats, maxPrice, minRating);
}

// â”€â”€ Render product grid â”€â”€
function renderGrid() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  const visible = filteredProducts.slice(0, visibleCount);

  if (!visible.length) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa fa-search"></i>
        <p>No products found</p>
        <button class="btn-primary" onclick="clearFilters()">Clear Filters</button>
      </div>`;
  } else {
    grid.innerHTML = visible.map(renderProductCard).join('');
    initReveal();
  }

  // Update count
  const rc = document.getElementById('resultsCount');
  if (rc) rc.textContent = `${filteredProducts.length} PRODUCTS`;

  // Load more button
  const lb = document.getElementById('loadMoreBtn');
  if (lb) lb.style.display = visibleCount >= filteredProducts.length ? 'none' : 'inline-block';
}

// â”€â”€ Load more â”€â”€
function loadMore() {
  visibleCount += 8;
  renderGrid();
  // Scroll to first new card
  const cards = document.querySelectorAll('#shopGrid .product-card');
  if (cards[visibleCount - 8]) {
    cards[visibleCount - 8].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// â”€â”€ Clear all filters â”€â”€
function clearFilters() {
  document.querySelectorAll('.filter-section input[type=checkbox]').forEach(cb => {
    cb.checked = cb.value === 'all';
  });
  const pr = document.getElementById('priceRange');
  if (pr) { pr.value = 2500; updatePriceLabel(2500); }
  const ss = document.getElementById('sortSelect');
  if (ss) ss.value = 'default';
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  document.querySelectorAll('input[name="rating"]').forEach((r, i) => r.checked = i === 0);
  applyFilters();
}

// â”€â”€ Price label â”€â”€
function updatePriceLabel(val) {
  const el = document.getElementById('priceLabel');
  if (el) el.textContent = `â‚¹${Number(val).toLocaleString('en-IN')}`;
}

// â”€â”€ View toggle â”€â”€
function setView(type) {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  document.getElementById('gridView')?.classList.toggle('active', type === 'grid');
  document.getElementById('listView')?.classList.toggle('active', type === 'list');
  grid.classList.toggle('list-view', type === 'list');
}

// â”€â”€ Sidebar toggle (mobile) â”€â”€
function toggleSidebar() {
  document.getElementById('shopSidebar')?.classList.toggle('open');
  document.getElementById('sidebarOverlay')?.classList.toggle('open');
}

// â”€â”€ Active filter chips â”€â”€
function renderActiveFilters(search, cats, maxPrice, minRating) {
  const container = document.getElementById('activeFilters');
  if (!container) return;
  const chips = [];
  if (search) chips.push(`<div class="filter-chip">"${search}" <button onclick="clearSearch()">Ã—</button></div>`);
  cats.forEach(c => chips.push(`<div class="filter-chip">${c} <button onclick="removeFilterChip('${c}')">Ã—</button></div>`));
  if (maxPrice < 2500) chips.push(`<div class="filter-chip">Under â‚¹${maxPrice} <button onclick="resetPrice()">Ã—</button></div>`);
  if (minRating) chips.push(`<div class="filter-chip">â˜… ${minRating}+ <button onclick="resetRating()">Ã—</button></div>`);
  container.innerHTML = chips.join('');
}

function clearSearch()         { const si = document.getElementById('searchInput'); if(si) si.value=''; applyFilters(); }
function resetPrice()          { const pr = document.getElementById('priceRange'); if(pr){pr.value=2500;updatePriceLabel(2500);} applyFilters(); }
function resetRating()         { document.querySelectorAll('input[name="rating"]').forEach((r,i)=>r.checked=i===0); applyFilters(); }
function removeFilterChip(val) { const cb=document.querySelector(`.filter-section input[value="${val}"]`); if(cb){cb.checked=false;} applyFilters(); }


