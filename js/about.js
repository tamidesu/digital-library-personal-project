(function () {
  const $ = (s) => document.querySelector(s);

  const FAQ = [
    {
        q: "How do I buy a book?",
        a: "Open Products, add a book to your cart, then proceed to Checkout. After placing an order, you’ll see an order confirmation."
    },
    {
        q: "Can I edit my profile details?",
        a: "Yes. Go to your Profile page to update your name, email, and (optionally) your password."
    },
    {
        q: "Where can I see my previous purchases?",
        a: "Open Purchase history from the profile menu. You’ll see your orders, totals, and items."
    },
    {
        q: "What if I entered the wrong email at checkout?",
        a: "Use the same account email for consistent purchase history. If you use a different email, the order may not show under your profile."
    },
    {
        q: "Can I remove items from the cart?",
        a: "Yes. Open the cart page and adjust quantities or remove items. Your total updates automatically."
    },
    {
        q: "Do you offer discounts?",
        a: "Sometimes. When a promo is active, discounted books are highlighted and show the updated price."
    },
    {
        q: "How do I search faster for a book?",
        a: "Use the search field in Products and optionally combine it with genre and max price filters."
    },
    {
        q: "Is there a refund policy?",
        a: "This is a demo project, so payments are simulated. In a real store, refunds depend on the store policy and purchase terms."
    }
    ];


  function renderFaq(){
    const root = $("#faqGrid");
    if (!root) return;

    root.innerHTML = FAQ.map((x, i) => `
      <article class="faq-item" data-i="${i}">
        <div class="faq-q" role="button" tabindex="0" aria-expanded="false">
          <strong>${escapeHtml(x.q)}</strong>
          <span class="faq-chevron" aria-hidden="true">▾</span>
        </div>
        <div class="faq-a">${escapeHtml(x.a)}</div>
      </article>
    `).join("");

    root.addEventListener("click", (e) => {
      const item = e.target.closest(".faq-item");
      if (!item) return;
      toggle(item);
    });

    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".faq-item");
      if (!item) return;
      e.preventDefault();
      toggle(item);
    });

    function toggle(item){
      const open = item.classList.toggle("open");
      const q = item.querySelector(".faq-q");
      q?.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  function setStats(){
    const books = window.BOOKS || [];
    const users = (window.LIB_DATA && window.LIB_DATA.users) ? window.LIB_DATA.users : [];

    $("#aBooks") && ($("#aBooks").textContent = String(books.length));
    $("#aUsers") && ($("#aUsers").textContent = String(users.length));

    // orders store exists in db.js, but your books-data.js currently doesn't sync orders into LIB_DATA
    // Here: try reading orders directly from IndexedDB if available.
    const setOrders = (n) => { $("#aOrders") && ($("#aOrders").textContent = String(n)); };

    if (window.LibraryDB && ("indexedDB" in window)) {
      window.LibraryDB.open()
        .then(db => window.LibraryDB.getAll(db, "orders"))
        .then(arr => setOrders(Array.isArray(arr) ? arr.length : 0))
        .catch(() => setOrders(0));
    } else {
      setOrders(0);
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function init(){
    setStats();
    renderFaq();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.LIB_DATA && (window.BOOKS || []).length) init();
    else document.addEventListener("data:ready", init, { once: true });
  });
})();
