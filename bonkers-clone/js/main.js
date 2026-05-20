// ===== MAIN JS =====
document.addEventListener('DOMContentLoaded', () => {

  // ── Sticky header ──
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ── Mobile hamburger ──
  const hamburger = document.getElementById('hamburger');
  const nav       = document.getElementById('nav');
  const overlay   = document.getElementById('mobileOverlay');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      if (overlay) overlay.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }
  if (overlay) overlay.addEventListener('click', closeMobileNav);

  // Mobile dropdown accordion
  document.querySelectorAll('.has-dropdown > a').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  // ── Search — header search box ──
  // Works on ALL pages: Enter key or click search button
  const searchInput = document.getElementById('searchInput');
  const searchBtn   = document.getElementById('searchBtn');

  function doSearch() {
    const q = (searchInput?.value || '').trim();
    if (!q) return;
    // Determine correct path to shop.html
    const isInPages = window.location.pathname.includes('/pages/');
    const shopUrl   = isInPages ? `shop.html?q=${encodeURIComponent(q)}` : `pages/shop.html?q=${encodeURIComponent(q)}`;
    window.location.href = shopUrl;
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    // Live search suggestions (simple dropdown)
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      showSearchSuggestions(q);
    });
    searchInput.addEventListener('blur', () => {
      setTimeout(() => hideSearchSuggestions(), 200);
    });
  }
  if (searchBtn) searchBtn.addEventListener('click', doSearch);

  // ── Hero Slider ──
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('#sliderDots .dot');
  if (slides.length) {
    let cur = 0, timer;
    const go = n => {
      slides[cur].classList.remove('active');
      if (dots[cur]) dots[cur].classList.remove('active');
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('active');
      if (dots[cur]) dots[cur].classList.add('active');
    };
    const reset = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 5000); };
    document.getElementById('sliderPrev')?.addEventListener('click', () => { go(cur - 1); reset(); });
    document.getElementById('sliderNext')?.addEventListener('click', () => { go(cur + 1); reset(); });
    dots.forEach(d => d.addEventListener('click', () => { go(+d.dataset.index); reset(); }));
    reset();
    // Touch swipe
    let tx = 0;
    const slider = document.getElementById('heroSlider');
    if (slider) {
      slider.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend',   e => {
        const diff = tx - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { go(diff > 0 ? cur + 1 : cur - 1); reset(); }
      });
    }
  }

  // ── Testimonials ──
  const tcards = document.querySelectorAll('.testimonial-card');
  const tdots  = document.querySelectorAll('.testimonial-dots .dot');
  if (tcards.length) {
    let tc = 0;
    const goT = n => {
      tcards[tc].classList.remove('active');
      if (tdots[tc]) tdots[tc].classList.remove('active');
      tc = (n + tcards.length) % tcards.length;
      tcards[tc].classList.add('active');
      if (tdots[tc]) tdots[tc].classList.add('active');
    };
    tdots.forEach((d, i) => d.addEventListener('click', () => goT(i)));
    setInterval(() => goT(tc + 1), 4500);
  }

  // ── Filter Tabs (homepage) ──
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      populateGrid('newArrivalsGrid', tab.dataset.filter, 8);
    });
  });

  // ── Newsletter ──
  document.getElementById('newsletterForm')?.addEventListener('submit', e => {
    e.preventDefault();
    showToast("You're in the club! 🎉");
    e.target.reset();
  });

  // ── Back to top ──
  const btt = document.getElementById('backToTop');
  if (btt) {
    window.addEventListener('scroll', () => btt.classList.toggle('visible', window.scrollY > 400), { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  initReveal();
});

// ── Search suggestions dropdown ──
function showSearchSuggestions(q) {
  let box = document.getElementById('searchSuggestions');
  if (!q) { if (box) box.remove(); return; }

  const matches = (typeof products !== 'undefined' ? products : [])
    .filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    .slice(0, 6);

  if (!matches.length) { if (box) box.remove(); return; }

  if (!box) {
    box = document.createElement('div');
    box.id = 'searchSuggestions';
    box.className = 'search-suggestions';
    document.getElementById('searchInput')?.parentElement?.appendChild(box);
  }

  const isInPages = window.location.pathname.includes('/pages/');
  box.innerHTML = matches.map(p => `
    <a href="${isInPages ? '' : 'pages/'}product.html?id=${p.id}" class="suggestion-item">
      <img src="${p.img}" alt="${p.name}" />
      <div>
        <div class="sug-name">${p.name}</div>
        <div class="sug-price">₹${p.price.toLocaleString('en-IN')}</div>
      </div>
    </a>`).join('') +
    `<a href="${isInPages ? '' : 'pages/'}shop.html?q=${encodeURIComponent(q)}" class="suggestion-all">
      See all results for "<strong>${q}</strong>"
    </a>`;
}

function hideSearchSuggestions() {
  document.getElementById('searchSuggestions')?.remove();
}

function closeMobileNav() {
  document.getElementById('nav')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('open');
  document.getElementById('mobileOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}
