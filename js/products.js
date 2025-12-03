document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const genreSelect = document.getElementById("genreSelect");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const cards = [...document.querySelectorAll(".product")];
 
  if (priceValue && priceRange) priceValue.textContent = `$${priceRange.value}`;
 
  const urlParams = new URLSearchParams(location.search);
  if (urlParams.has('q') && searchInput) searchInput.value = urlParams.get('q') || '';
  if (urlParams.has('genre') && genreSelect) genreSelect.value = urlParams.get('genre') || '';
  if (urlParams.has('max') && priceRange) {
    priceRange.value = urlParams.get('max'); 
    if (priceValue) priceValue.textContent = `$${priceRange.value}`;
  }

  const setURL = (q, g, m)=>{
    const p = new URLSearchParams(location.search);
    q ? p.set('q', q) : p.delete('q');
    g ? p.set('genre', g) : p.delete('genre');
    m ? p.set('max', m) : p.delete('max');
    history.replaceState(null,'', `${location.pathname}?${p.toString()}`);
  };

  const applyFilter = ()=>{
    const q = (searchInput?.value || "").toLowerCase().trim();
    const g = genreSelect?.value || "";
    const m = parseFloat(priceRange?.value || "999");

    cards.forEach(c=>{
      const title = c.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const genre = c.dataset.genre || "";
      const price = parseFloat(c.dataset.price || "0");

      const match = title.includes(q) && (!g || genre===g) && price <= m;
      if(match){
        c.classList.remove('hide');
      } else {
        c.classList.add('hide');
      }
    });

    setURL(q, g, String(m));
  };

  const debounce = (fn, d=250)=>{
    let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), d); };
  };

  const run = debounce(applyFilter, 200);

  searchInput?.addEventListener("input", run);
  genreSelect?.addEventListener("change", run);
  priceRange?.addEventListener("input", ()=>{
    if (priceValue) priceValue.textContent = `$${priceRange.value}`;
    run();
  });
 
  applyFilter();
 
  document.querySelectorAll(".product").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--y", `${e.clientY - rect.top}px`);
    });
  });

  document.querySelectorAll(".product").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--y", `${e.clientY - rect.top}px`);
    });
  });


  document.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-add");
      const product = (window.ProductRepository && window.ProductRepository.byId(id)) ||
                      (window.BOOKS || []).find(b=>b.id===id);
      if (!product) return alert("Product not found");
      window.Cart.add(product, 1);
  
      const title = product.title;
      const toast = document.createElement('div');
      toast.className = 'cart-toast';
      toast.textContent = `Added: ${title}`;
      document.body.appendChild(toast);
      setTimeout(()=> toast.classList.add('show'),10);
      setTimeout(()=> { toast.classList.remove('show'); setTimeout(()=>toast.remove(),300); }, 2000);
    });
  });

  if (window.Cart) {
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }
});


(() => {
  const cards = document.querySelectorAll('.product');
  if (!('IntersectionObserver' in window) || !cards.length) {
    cards.forEach(c => c.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, {threshold: .15, rootMargin: '0px 0px -10% 0px'});
  cards.forEach(c => io.observe(c));
})();

(() => {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  document.querySelectorAll('.product').forEach(card => {
    let rect;
    const onMove = (ev) => {
      rect = rect || card.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const px = (x / rect.width) * 2 - 1;
      const py = (y / rect.height) * 2 - 1;
      const rx = clamp(-py * 6, -8, 8);
      const ry = clamp(px * 8, -10, 10);
      card.style.setProperty('--rx', rx.toFixed(2));
      card.style.setProperty('--ry', ry.toFixed(2));
      card.style.setProperty('--gx', `${(x/rect.width)*100}%`);
      card.style.setProperty('--gy', `${(y/rect.height)*100}%`);
    };
    const onLeave = () => {
      rect = null;
      card.style.setProperty('--rx', 0);
      card.style.setProperty('--ry', 0);
      card.style.setProperty('--gx', '50%');
      card.style.setProperty('--gy', '50%');
    };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
})();

(() => {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-buy');
    if (!btn) return;
    btn.classList.remove('pop');
    void btn.offsetWidth;
    btn.classList.add('pop');
  });
})();

document.addEventListener("DOMContentLoaded", () => {
    if (!window.BOOKS) return;

    const cards = document.querySelectorAll(".card.product");

    cards.forEach(card => {
        const id = card.getAttribute("data-id");
        if (!id) return;

        const book = window.BOOKS.find(b => b.id === id || b.slug === id || b.dataId === id || b.bookId === id);

        if (!book) return;

        if (book.bfDeal) {
            const sticker = card.querySelector(".bf-sticker");
            const priceEl = card.querySelector(".price");

            if (sticker) {
                sticker.hidden = false;
                const discount = Math.round(book.bfDiscount * 100);
                sticker.textContent = `Black Friday -${discount}%`;
            }

            if (priceEl) {
                const discounted = (book.price * (1 - book.bfDiscount)).toFixed(2);

                priceEl.innerHTML = `
                    <span class="old-price">$${book.price}</span>
                    <span class="new-price">$${discounted}</span>
                `;
            }
        }
    });
});

(() => {
  let bfCleaned = false;

  function finalizeBlackFridayUI() {
    if (bfCleaned) return;
    bfCleaned = true;

    if (window.BOOKS) {
      window.BOOKS.forEach(b => {
        b.bfDeal = false;
        b.bfDiscount = 0;
      });
    }

    document.querySelectorAll(".card.product").forEach(card => {
      const sticker = card.querySelector(".bf-sticker");
      const priceEl = card.querySelector(".price");

      if (sticker) {
        sticker.hidden = true;
      }

      if (priceEl) {
        const base = parseFloat(card.dataset.price || "0");
        if (!isNaN(base) && base > 0) {
          priceEl.textContent = `$${base.toFixed(2)}`;
        }
      }
    });
  }

  document.addEventListener("bf:tick", (e) => {
    const t = e.detail;
    const box = document.querySelector(".bfp-timer");
    if (box) {
      document.querySelector("[data-prod-days]").textContent = t.days;
      document.querySelector("[data-prod-hours]").textContent = t.hours;
      document.querySelector("[data-prod-minutes]").textContent = t.minutes;
      document.querySelector("[data-prod-seconds]").textContent = t.seconds;
    }

    if (t.ended) {
      finalizeBlackFridayUI();

      document.querySelector(".bfp-ended")?.classList.add("show");

      setTimeout(() => {
        const banners = document.querySelectorAll(".bf-ended-banner");
        banners.forEach(b => b.classList.add("fade-out"));
        setTimeout(() => banners.forEach(b => b.remove()), 900);
      }, 2000);
    }
  });

  document.addEventListener("bf:ended", () => {
    finalizeBlackFridayUI();

    setTimeout(() => {
        const banners = document.querySelectorAll(".bf-ended-banner");
        banners.forEach(b => b.classList.add("fade-out"));
        setTimeout(() => banners.forEach(b => b.remove()), 900);
    }, 20000);
});
})();