// js/purchases-page.js
(function (window, document) {
  const $ = (s, r = document) => r.querySelector(s);

  function money(n) {
    return `$${(+n || 0).toFixed(2)}`;
  }

  function fmtDate(iso) {
    try {
      if (!iso) return "—";
      const d = new Date(iso);
      return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return "—";
    }
  }

  function statusClass(s) {
    const v = String(s || "").toLowerCase();
    if (v === "paid") return "badge-paid";
    if (v === "pending") return "badge-pending";
    if (v === "refunded") return "badge-refunded";
    if (v === "cancelled") return "badge-cancelled";
    return "badge-cancelled";
  }

  async function waitForDataReady() {
    if (window.LIB_DATA && window.LIB_DATA.users) return;
    await new Promise((resolve) => document.addEventListener("data:ready", resolve, { once: true }));
  }

  function requireAuth() {
    const user = window.Auth?.getCurrentUser?.();
    if (!user) {
      location.href = "products.html";
      return null;
    }
    return user;
  }

  // Read using index if possible, fallback to getAll + filter
  function getAllByIndex(db, storeName, indexName, key) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const idx = store.index(indexName);
        const req = idx.getAll(key);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function loadOrdersAndItems(currentUser) {
    const db = window.LIB_DB || await window.LibraryDB.open();

    // Orders
    let orders = [];
    try {
      // prefer indexed userId read
      if (currentUser?.id) {
        orders = await getAllByIndex(db, "orders", "by_user", currentUser.id);
      }
    } catch (_) {
      // ignore, fallback below
    }

    if (!orders.length) {
      // fallback: read all and filter by userId/email
      const all = await window.LibraryDB.getAll(db, "orders");
      const email = (currentUser?.email || "").toLowerCase();
      orders = all.filter((o) => {
        const uid = o?.userId != null ? String(o.userId) : "";
        const mineById = currentUser?.id && uid === String(currentUser.id);
        const oEmail = String(o?.customer?.email || "").toLowerCase();
        const mineByEmail = email && oEmail === email;
        return mineById || mineByEmail;
      });
    }

    // Items (we’ll fetch all items once and map)
    const allItems = await window.LibraryDB.getAll(db, "order_items");
    const itemsByOrder = new Map();
    for (const it of allItems) {
      const oid = it?.orderId;
      if (!oid) continue;
      if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
      itemsByOrder.get(oid).push(it);
    }

    // attach items
    const enriched = orders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    }));

    return enriched;
  }

  function computeStats(orders) {
    const ordersCount = orders.length;
    const itemsCount = orders.reduce((s, o) => s + (o.items || []).reduce((a, i) => a + (+i.qty || 0), 0), 0);
    const spent = orders.reduce((s, o) => s + (+o?.totals?.total || 0), 0);
    return { ordersCount, itemsCount, spent };
  }

  function normalizeOrderForSearch(order) {
    const id = String(order?.id || "").toLowerCase();
    const titles = (order.items || []).map((i) => String(i?.title || "").toLowerCase()).join(" ");
    return `${id} ${titles}`.trim();
  }

  function sortOrders(orders, mode) {
    const copy = [...orders];
    const getTime = (o) => {
      const iso = o?.createdAt || o?.created_at || o?.created || o?.updatedAt || "";
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const getTotal = (o) => +o?.totals?.total || 0;

    switch (mode) {
      case "oldest": return copy.sort((a, b) => getTime(a) - getTime(b));
      case "total_desc": return copy.sort((a, b) => getTotal(b) - getTotal(a));
      case "total_asc": return copy.sort((a, b) => getTotal(a) - getTotal(b));
      case "newest":
      default: return copy.sort((a, b) => getTime(b) - getTime(a));
    }
  }

  function matchesStatus(order, status) {
    if (!status || status === "all") return true;
    return String(order?.status || "").toLowerCase() === String(status).toLowerCase();
  }

  function coverFor(bookId) {
    const b = (window.BOOKS || []).find((x) => x.id === bookId);
    return b?.cover || "";
  }

  function render(orders) {
    const root = $("#ordersRoot");
    const empty = $("#emptyState");

    root.innerHTML = "";

    if (!orders.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    for (const o of orders) {
      const created = fmtDate(o.createdAt);
      const status = String(o.status || "paid");
      const badgeCls = statusClass(status);

      const total = money(o?.totals?.total ?? 0);
      const subtotal = money(o?.totals?.subtotal ?? 0);
      const shipping = money(o?.totals?.shipping ?? 0);
      const tax = money(o?.totals?.tax ?? 0);

      const fullName = o?.customer?.fullName || "—";
      const email = o?.customer?.email || "—";

      const itemsHtml = (o.items || []).map((it) => {
        const img = coverFor(it.bookId) || "";
        const title = it.title || it.bookId || "Item";
        const qty = +it.qty || 1;
        const price = money(it.price || 0);
        const line = money(it.subtotal ?? ((it.price || 0) * qty));
        return `
          <div class="i-row">
            <div class="i-left">
              ${img ? `<img class="i-cover" src="${img}" alt="${title} cover"/>` : `<div class="i-cover" aria-hidden="true"></div>`}
              <div class="i-text" style="min-width:0">
                <div class="i-title">${title}</div>
                <div class="i-meta">${qty} × ${price}</div>
              </div>
            </div>
            <div class="i-right">
              <span class="i-pill">${line}</span>
            </div>
          </div>
        `;
      }).join("");

      const card = document.createElement("article");
      card.className = "o-card";
      card.innerHTML = `
        <div class="o-head">
          <div class="o-left">
            <div class="o-id">
              <span class="badge-status ${badgeCls}">${status}</span>
              <span class="mono">${o.id}</span>
            </div>
            <div class="o-meta">
              <span>Placed: <strong>${created}</strong></span>
              <span>Customer: <strong>${fullName}</strong></span>
            </div>
          </div>

          <div class="o-right">
            <div class="o-total">${total}</div>
            <button type="button" class="o-toggle" aria-expanded="false">
              Details
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="o-body" hidden>
          <div class="o-sum">
            <div class="o-chip"><div class="k">Email</div><div class="v">${email}</div></div>
            <div class="o-chip"><div class="k">Items</div><div class="v">${(o.items || []).reduce((s,i)=>s+(+i.qty||0),0)}</div></div>

            <div class="o-chip"><div class="k">Subtotal</div><div class="v">${subtotal}</div></div>
            <div class="o-chip"><div class="k">Shipping</div><div class="v">${shipping}</div></div>

            <div class="o-chip"><div class="k">Tax</div><div class="v">${tax}</div></div>
            <div class="o-chip"><div class="k">Total</div><div class="v">${total}</div></div>
          </div>

          <div class="o-items">
            ${itemsHtml || `<div class="i-row"><div class="i-left"><div class="i-title">No items found</div></div></div>`}
          </div>
        </div>
      `;

      const btn = card.querySelector(".o-toggle");
      const body = card.querySelector(".o-body");

      btn.addEventListener("click", () => {
        const isOpen = card.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(isOpen));

        if (isOpen) {
          body.hidden = false;
          // allow CSS transition to run
          requestAnimationFrame(() => {});
        } else {
          // wait for transition then hide
          setTimeout(() => { body.hidden = true; }, 220);
        }
      });

      root.appendChild(card);
    }
  }

  function applyFiltersAndRender(allOrders) {
    const q = String($("#q")?.value || "").trim().toLowerCase();
    const status = String($("#status")?.value || "all");
    const sort = String($("#sort")?.value || "newest");

    let out = allOrders.filter((o) => matchesStatus(o, status));

    if (q) {
      out = out.filter((o) => normalizeOrderForSearch(o).includes(q));
    }

    out = sortOrders(out, sort);
    render(out);

    const stats = computeStats(out);
    $("#statOrders").textContent = stats.ordersCount;
    $("#statItems").textContent = stats.itemsCount;
    $("#statSpent").textContent = money(stats.spent);
  }

  async function init() {
    await waitForDataReady();
    const user = requireAuth();
    if (!user) return;

    const skeleton = $("#skeleton");
    skeleton.hidden = false;

    let orders = [];
    try {
      orders = await loadOrdersAndItems(user);
    } catch (e) {
      console.error(e);
      orders = [];
    } finally {
      skeleton.hidden = true;
    }

    // global orders list
    let allOrders = orders;

    // initial stats (unfiltered)
    const statsAll = computeStats(allOrders);
    $("#statOrders").textContent = statsAll.ordersCount;
    $("#statItems").textContent = statsAll.itemsCount;
    $("#statSpent").textContent = money(statsAll.spent);

    // initial render
    applyFiltersAndRender(allOrders);

    // listeners
    $("#q")?.addEventListener("input", () => applyFiltersAndRender(allOrders));
    $("#status")?.addEventListener("change", () => applyFiltersAndRender(allOrders));
    $("#sort")?.addEventListener("change", () => applyFiltersAndRender(allOrders));

    $("#btnRefresh")?.addEventListener("click", async () => {
      skeleton.hidden = false;
      try {
        allOrders = await loadOrdersAndItems(user);
      } catch (e) {
        console.error(e);
      } finally {
        skeleton.hidden = true;
      }
      applyFiltersAndRender(allOrders);
    });

    // If checkout broadcasts an update, you can refresh automatically (optional)
    document.addEventListener("orders:updated", () => applyFiltersAndRender(allOrders));
  }

  document.addEventListener("includes:loaded", init);
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("[data-include]")) return;
    init();
  });
})(window, document);
