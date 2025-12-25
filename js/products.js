// js/products.js
// Render catalog from IndexedDB-loaded window.BOOKS + filters

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const genreSelect = document.getElementById("genreSelect");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const grid = document.getElementById("products-grid");

  let cards = [];
  let ALL_BOOKS = [];

  function normalizeGenreKey(v) {
    return String(v || "").trim().toLowerCase();
  }

  function genreLabel(key) {
    // "data_science" -> "Data Science", "programming" -> "Programming"
    return normalizeGenreKey(key)
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Other";
  }

  function roundUpTo(n, step) {
    return Math.ceil(n / step) * step;
  }

  function computePriceMax(books) {
    const prices = (books || [])
      .map((b) => Number(b?.price ?? 0))
      .filter((x) => Number.isFinite(x) && x >= 0);

    const max = prices.length ? Math.max(...prices) : 0;

    // You asked: “not up to points” -> integer slider, but price can be decimals.
    // So we round the MAX up nicely.
    return roundUpTo(Math.ceil(max), 5) || 50;
  }

  function rebuildGenreOptions(books, preserveValue = true) {
    if (!genreSelect) return;

    const prev = preserveValue ? String(genreSelect.value || "") : "";

    const set = new Set();
    (books || []).forEach((b) => {
      const g = normalizeGenreKey(b?.genre ?? b?.category);
      if (g) set.add(g);
    });

    const genres = Array.from(set).sort((a, b) => a.localeCompare(b));

    // Rebuild <select> safely
    genreSelect.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All genres";
    genreSelect.appendChild(optAll);

    for (const g of genres) {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = genreLabel(g);
      genreSelect.appendChild(opt);
    }

    // Restore selection if possible
    if (preserveValue) {
      const exists = Array.from(genreSelect.options).some((o) => o.value === prev);
      genreSelect.value = exists ? prev : "";
    }
  }

  function rebuildPriceRange(books, preserveValue = true) {
    if (!priceRange || !priceValue) return;

    const prev = preserveValue ? Number(priceRange.value) : null;

    const max = computePriceMax(books);

    priceRange.min = "0";
    priceRange.max = String(max);
    priceRange.step = "1";

    // Keep current selection if it still fits, otherwise clamp
    const nextVal = preserveValue && Number.isFinite(prev) ? Math.min(prev, max) : max;
    priceRange.value = String(nextVal);
    priceValue.textContent = `$${priceRange.value}`;
  }

  function rebuildFiltersFromData(books, preserve = true) {
    rebuildGenreOptions(books, preserve);
    rebuildPriceRange(books, preserve);
  }


  // -------------------------
  // URL helpers
  // -------------------------
  function setURL(q, g, m) {
    const p = new URLSearchParams(location.search);
    q ? p.set("q", q) : p.delete("q");
    g ? p.set("genre", g) : p.delete("genre");
    m ? p.set("max", m) : p.delete("max");
    history.replaceState(null, "", `${location.pathname}?${p.toString()}`);
  }

  function initFiltersFromURL() {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has("q") && searchInput) searchInput.value = urlParams.get("q") || "";
    if (urlParams.has("genre") && genreSelect) genreSelect.value = urlParams.get("genre") || "";
    if (urlParams.has("max") && priceRange) {
      priceRange.value = urlParams.get("max") || priceRange.value;
    }
    if (priceValue && priceRange) priceValue.textContent = `$${priceRange.value}`;
  }

  // -------------------------
  // Debounce
  // -------------------------
  const debounce = (fn, d = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), d);
    };
  };

  // -------------------------
  // Effects
  // -------------------------
  function initHoverLight() {
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--y", `${e.clientY - rect.top}px`);
      });
    });
  }

  function initTiltEffect() {
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    cards.forEach((card) => {
      let rect;
      const onMove = (ev) => {
        rect = rect || card.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const px = (x / rect.width) * 2 - 1;
        const py = (y / rect.height) * 2 - 1;
        const rx = clamp(-py * 6, -8, 8);
        const ry = clamp(px * 8, -10, 10);
        card.style.setProperty("--rx", rx.toFixed(2));
        card.style.setProperty("--ry", ry.toFixed(2));
        card.style.setProperty("--gx", `${(x / rect.width) * 100}%`);
        card.style.setProperty("--gy", `${(y / rect.height) * 100}%`);
      };
      const onLeave = () => {
        rect = null;
        card.style.setProperty("--rx", 0);
        card.style.setProperty("--ry", 0);
        card.style.setProperty("--gx", "50%");
        card.style.setProperty("--gy", "50%");
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });
  }

  function initIntersectionAnimation() {
    if (!("IntersectionObserver" in window) || !cards.length) {
      cards.forEach((c) => c.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    cards.forEach((c) => io.observe(c));
  }

  function applyBlackFridayVisuals() {
    cards.forEach((card) => {
      const id = card.getAttribute("data-id");
      const book = ALL_BOOKS.find((b) => b.id === id);
      if (!book) return;

      const sticker = card.querySelector(".bf-sticker");
      const priceEl = card.querySelector(".price");

      const basePrice = Number(book.price || 0);
      const discount = Number(book.bfDiscount || 0);

      const hasDeal = Boolean(book.bfDeal) && discount > 0;

      // 1) Если BF НЕ активен — полностью очищаем BF-визуал
      if (!hasDeal) {
        if (sticker) sticker.hidden = true;
        if (priceEl) priceEl.textContent = `$${basePrice.toFixed(2)}`;
        return;
      }

      // 2) BF активен — рисуем old/new
      if (sticker) {
        sticker.hidden = false;
        sticker.textContent = `Black Friday -${Math.round(discount * 100)}%`;
      }

      if (priceEl) {
        const discounted = basePrice * (1 - discount);
        priceEl.innerHTML = `
          <span class="old-price">$${basePrice.toFixed(2)}</span>
          <span class="new-price">$${discounted.toFixed(2)}</span>
        `;
      }
    });
  }


  // -------------------------
  // Render
  // -------------------------
  function createCardHTML(book) {
    const basePrice = Number(book.price || 0);
    const priceText = basePrice.toFixed(2);
    const meta = book.shortDescription || book.description || "";
    const genre = String(book.genre || "").trim().toLowerCase();

    return `
      <article class="card product"
               data-genre="${genre}"
               data-price="${priceText}"
               data-id="${book.id}">
        <div class="bf-sticker" hidden>Black Friday</div>
        <figure class="card-media">
          <img src="${book.cover}"
               alt="${book.title} — cover"
               loading="lazy"
               decoding="async" />
        </figure>
        <h3 class="card-title">${book.title}</h3>
        <p class="card-meta">${meta}</p>
        <p class="price">$${priceText}</p>
        <button class="btn-buy" data-add="${book.id}">Add to Cart</button>
        <a href="details.html?book=${book.id}" class="btn-details">Details</a>
      </article>
    `;
  }

  function renderBooks(list) {
    if (!grid) return;
    grid.innerHTML = (list || []).map(createCardHTML).join("");
    cards = [...grid.querySelectorAll(".product")];

    initHoverLight();
    initTiltEffect();
    initIntersectionAnimation();
    applyBlackFridayVisuals();
  }

  // -------------------------
  // Filter by DATA (IndexedDB books)
  // -------------------------
  function getFilterState() {
    const q = (searchInput?.value || "").toLowerCase().trim();
    const g = String(genreSelect?.value || "").trim().toLowerCase();
    const m = parseFloat(priceRange?.value || "999");
    return { q, g, m };
  }

  function applyAndRender() {
    const { q, g, m } = getFilterState();

    const filtered = (ALL_BOOKS || []).filter((b) => {
      const title = String(b.title || "").toLowerCase();
      const genre = String(b.genre || "").trim().toLowerCase();
      const price = Number(b.price || 0);
      return title.includes(q) && (!g || genre === g) && price <= m;
    });

    setURL(q, g, String(m));
    renderBooks(filtered);
  }

  const runFilter = debounce(() => {
    if (priceValue && priceRange) priceValue.textContent = `$${priceRange.value}`;
    applyAndRender();
  }, 200);

  searchInput?.addEventListener("input", runFilter);
  genreSelect?.addEventListener("change", runFilter);
  priceRange?.addEventListener("input", runFilter);

  // -------------------------
  // Add to cart (delegation stays the same)
  // -------------------------
  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-buy");
      if (!btn) return;

      const id = btn.getAttribute("data-add");
      if (!id) return;

      btn.classList.remove("pop");
      void btn.offsetWidth;
      btn.classList.add("pop");

      const product =
        (window.ProductRepository && window.ProductRepository.byId(id)) ||
        (window.BOOKS || []).find((b) => b.id === id);

      if (!product) return alert("Product not found");

      window.Cart.add(product, 1);

      const toast = document.createElement("div");
      toast.className = "cart-toast";
      toast.textContent = `Added: ${product.title}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add("show"), 10);
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
      }, 2000);

      window.dispatchEvent(new CustomEvent("cart:updated"));
    });
  }

  // -------------------------
  // Init when data ready
  // -------------------------
  function bootFromBooks() {
    ALL_BOOKS = (Array.isArray(window.BOOKS) ? window.BOOKS : [])
                    .filter((b) => String(b?.status ?? "active") === "active");
    
    rebuildFiltersFromData(ALL_BOOKS, false);
    initFiltersFromURL();
    applyAndRender();
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }

  if (window.BOOKS && window.BOOKS.length) {
    bootFromBooks();
  } else {
    document.addEventListener("data:ready", bootFromBooks, { once: true });
  }

  // If books updated from another tab/admin (BroadcastChannel -> books:updated)
  document.addEventListener("books:updated", (e) => {
    ALL_BOOKS = Array.isArray(e.detail) ? e.detail : (window.BOOKS || []);
    ALL_BOOKS = (ALL_BOOKS || []).filter((b) => String(b?.status ?? "active") === "active");

    rebuildFiltersFromData(ALL_BOOKS, true);
    applyAndRender();
  });
});

document.addEventListener("bf:ended", () => {
  applyBlackFridayVisuals(); // функция сама очистит DOM
});