// js/products.js
// Динамический рендер каталога из window.BOOKS + все эффекты/фильтры/Black Friday

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const genreSelect = document.getElementById("genreSelect");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const grid = document.getElementById("products-grid");

  if (priceValue && priceRange) {
    priceValue.textContent = `$${priceRange.value}`;
  }

  const urlParams = new URLSearchParams(location.search);
  if (urlParams.has("q") && searchInput) searchInput.value = urlParams.get("q") || "";
  if (urlParams.has("genre") && genreSelect) genreSelect.value = urlParams.get("genre") || "";
  if (urlParams.has("max") && priceRange) {
    priceRange.value = urlParams.get("max") || priceRange.value;
    if (priceValue) priceValue.textContent = `$${priceRange.value}`;
  }

  let cards = [];

  function setURL(q, g, m) {
    const p = new URLSearchParams(location.search);
    q ? p.set("q", q) : p.delete("q");
    g ? p.set("genre", g) : p.delete("genre");
    m ? p.set("max", m) : p.delete("max");
    history.replaceState(null, "", `${location.pathname}?${p.toString()}`);
  }

  function applyFilter() {
    if (!cards.length) return;

    const q = (searchInput?.value || "").toLowerCase().trim();
    const g = genreSelect?.value || "";
    const m = parseFloat(priceRange?.value || "999");

    cards.forEach((c) => {
      const title = c.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const genre = c.dataset.genre || "";
      const price = parseFloat(c.dataset.price || "0");

      const match = title.includes(q) && (!g || genre === g) && price <= m;
      if (match) {
        c.classList.remove("hide");
      } else {
        c.classList.add("hide");
      }
    });

    setURL(q, g, String(m));
  }

  const debounce = (fn, d = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), d);
    };
  };

  const runFilter = debounce(applyFilter, 200);

  searchInput?.addEventListener("input", runFilter);
  genreSelect?.addEventListener("change", runFilter);
  priceRange?.addEventListener("input", () => {
    if (priceValue) priceValue.textContent = `$${priceRange.value}`;
    runFilter();
  });

  // -------------------------
  //  Hover light (градиент)
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

  // -------------------------
  //  3D tilt эффект
  // -------------------------
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

  // -------------------------
  //  Анимация появления
  // -------------------------
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

  // -------------------------
  //  Black Friday визуал
  // -------------------------
  function applyBlackFridayVisuals() {
    if (!window.BOOKS) return;

    cards.forEach((card) => {
      const id = card.getAttribute("data-id");
      if (!id) return;

      const book = window.BOOKS.find((b) => b.id === id);
      if (!book || !book.bfDeal) return;

      const sticker = card.querySelector(".bf-sticker");
      const priceEl = card.querySelector(".price");

      if (sticker) {
        const discount = Math.round((book.bfDiscount || 0) * 100);
        sticker.hidden = false;
        sticker.textContent = `Black Friday -${discount}%`;
      }

      if (priceEl) {
        const basePrice = Number(book.price || 0);
        const discounted = (basePrice * (1 - (book.bfDiscount || 0))).toFixed(2);
        priceEl.innerHTML = `
          <span class="old-price">$${basePrice.toFixed(2)}</span>
          <span class="new-price">$${discounted}</span>
        `;
      }
    });
  }

  // -------------------------
  //  Рендер карточек из BOOKS
  // -------------------------
  function createCardHTML(book) {
    const basePrice = Number(book.price || 0);
    const priceText = basePrice.toFixed(2);
    const meta = book.shortDescription || book.description || "";

    return `
      <article class="card product"
               data-genre="${book.genre || ""}"
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

  function renderProductsFromBooks() {
    if (!grid || !window.BOOKS) return;

    const books = window.BOOKS;
    grid.innerHTML = books.map(createCardHTML).join("");
    cards = [...grid.querySelectorAll(".product")];

    initHoverLight();
    initTiltEffect();
    initIntersectionAnimation();
    applyFilter();
    applyBlackFridayVisuals();
  }

  // -------------------------
  //  Клик по "Add to Cart" + pop-анимация
  // -------------------------
  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-buy");
      if (!btn) return;

      const id = btn.getAttribute("data-add");
      if (!id) return;

      // pop-анимация
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

      if (window.Cart) {
        window.dispatchEvent(new CustomEvent("cart:updated"));
      }
    });
  }

  // -------------------------
  //  Старт: ждём данные из БД
  // -------------------------
  function onDataReady() {
    renderProductsFromBooks();
    if (window.Cart) {
      window.dispatchEvent(new CustomEvent("cart:updated"));
    }
  }

  if (window.BOOKS && window.BOOKS.length) {
    onDataReady();
  } else {
    document.addEventListener("data:ready", () => {
      onDataReady();
    }, { once: true });
  }
});


// =======================================
//  Black Friday: окончание акции & баннер
// =======================================
(() => {
  let bfCleaned = false;

  function finalizeBlackFridayUI() {
  // 1) Вырубаем флаги скидок в данных И сохраняем
    if (window.LIB_DATA && window.saveLibData) {
      const updatedProducts = (window.LIB_DATA.products || []).map(p => ({
        ...p,
        bfDeal: true,
        bfDiscount: 0
      }));

      window.LIB_DATA.products = updatedProducts;
      window.BOOKS = updatedProducts;           // чтобы фронт работал как раньше
      window.saveLibData({ products: updatedProducts });
    } else if (window.BOOKS) {
      // fallback, если вдруг LIB_DATA нет
      window.BOOKS.forEach(b => {
        b.bfDeal = false;
        b.bfDiscount = 0;
      });
    }

    // 2) Чистим DOM-карточки
    document.querySelectorAll(".card.product").forEach((card) => {
      const sticker = card.querySelector(".bf-sticker");
      const priceEl = card.querySelector(".price");

      if (sticker) {
        sticker.hidden = true;
      }

      if (priceEl) {
        const base = parseFloat(card.dataset.price || "0");
        if (!isNaN(base) && base > 0) {
          // перезаписываем целиком -> old/new span-ы исчезнут
          priceEl.textContent = `$${base.toFixed(2)}`;
        }
      }
    });
  }

  document.addEventListener("bf:tick", (e) => {
    const t = e.detail;
    const box = document.querySelector(".bfp-timer");
    if (box) {
      const d = document.querySelector("[data-prod-days]");
      const h = document.querySelector("[data-prod-hours]");
      const m = document.querySelector("[data-prod-minutes]");
      const s = document.querySelector("[data-prod-seconds]");

      if (d) d.textContent = t.days;
      if (h) h.textContent = t.hours;
      if (m) m.textContent = t.minutes;
      if (s) s.textContent = t.seconds;
    }

    if (t.ended) {
      finalizeBlackFridayUI();

      document.querySelector(".bfp-ended")?.classList.add("show");

      setTimeout(() => {
        const banners = document.querySelectorAll(".bf-ended-banner");
        banners.forEach((b) => b.classList.add("fade-out"));
        setTimeout(() => banners.forEach((b) => b.remove()), 900);
      }, 2000);
    }
  });

  document.addEventListener("bf:ended", () => {
    finalizeBlackFridayUI();

    setTimeout(() => {
      const banners = document.querySelectorAll(".bf-ended-banner");
      banners.forEach((b) => b.classList.add("fade-out"));
      setTimeout(() => banners.forEach((b) => b.remove()), 900);
    }, 20000);
  });
})();
