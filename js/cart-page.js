// js/cart-page.js
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("cartSection");
  const btnClear = document.getElementById("btnClearCart");
  const btnCheckout = document.getElementById("btnCheckout");

  const escapeHtml = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const escapeAttr = (str) => escapeHtml(str).replaceAll("`", "&#096;");

  function getProductById(id) {
    return (
      (window.ProductRepository?.byId?.(id)) ||
      (window.BOOKS || []).find((b) => String(b.id) === String(id)) ||
      null
    );
  }

  // Унифицированная логика цены: берём "живые" данные из BOOKS
  function getPricing(product, cartItem) {
    const base = Number(product?.price ?? cartItem?.price ?? 0);
    const discount = Number(product?.bfDiscount ?? 0);
    const isDeal = !!product?.bfDeal && discount > 0;

    if (!isDeal) {
      return { unit: base, base, discount: 0, isDeal: false };
    }
    return { unit: base * (1 - discount), base, discount, isDeal: true };
  }

  function formatMoney(n) {
    return `$${Number(n || 0).toFixed(2)}`;
  }

  function render() {
    if (!root || !window.Cart) return;

    const items = Array.isArray(window.Cart.items) ? window.Cart.items : [];
    if (!items.length) {
      root.innerHTML = `
        <div class="cart-empty">
          <h3>Your cart is empty</h3>
          <p>Add a few books to see them here.</p>
          <a class="btn-back" href="products.html">← Continue Shopping</a>
        </div>
      `;
      return;
    }

    let total = 0;

    const rowsHtml = items
      .map((it) => {
        const product = getProductById(it.id);
        const title = product?.title || it.title || "Unknown";
        const cover =
          product?.cover || product?.ppath || product?.image || it.cover || "";

        const { unit, base, discount, isDeal } = getPricing(product, it);

        const qty = Math.max(1, Number(it.qty || 1));
        const subtotal = unit * qty;
        total += subtotal;

        const priceHtml = isDeal
          ? `
            <div class="price-box">
              <span class="old-price">${formatMoney(base)}</span>
              <span class="new-price">${formatMoney(unit)}</span>
              <span class="bf-pill">-${Math.round(discount * 100)}%</span>
            </div>
          `
          : `<div class="price-box"><span class="plain-price">${formatMoney(unit)}</span></div>`;

        return `
          <tr class="cart-row" data-id="${escapeAttr(it.id)}">
            <td class="cell-book">
              <div class="cart-book">
                <img class="cart-cover" src="${escapeAttr(cover)}" alt="${escapeHtml(title)} cover" loading="lazy" />
                <div class="cart-book-meta">
                  <div class="cart-title">${escapeHtml(title)}</div>
                </div>
              </div>
            </td>

            <td class="cell-price">${priceHtml}</td>

            <td class="cell-qty">
              <div class="qty-control" role="group" aria-label="Quantity">
                <button class="qty-btn" type="button" data-act="dec" aria-label="Decrease">−</button>
                <span class="qty-value" aria-live="polite">${qty}</span>
                <button class="qty-btn" type="button" data-act="inc" aria-label="Increase">+</button>
              </div>
            </td>

            <td class="cell-subtotal">
              <span class="subtotal-val">${formatMoney(subtotal)}</span>
            </td>

            <td class="cell-actions">
              <button class="btn-remove" type="button" data-act="remove">Remove</button>
            </td>
          </tr>
        `;
      })
      .join("");

    root.innerHTML = `
      <div class="cart-table-wrap">
        <table class="cart-table" aria-label="Cart table">
          <thead>
            <tr>
              <th class="th-book">Book</th>
              <th class="th-price">Price</th>
              <th class="th-qty">Qty</th>
              <th class="th-subtotal">Subtotal</th>
              <th class="th-actions"></th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="cart-total-row">
          <span class="cart-total-label">Total:</span>
          <span class="cart-total-val">${formatMoney(total)}</span>
        </div>
      </div>
    `;
  }

  // Делегирование событий — одинаково работает после любого ререндера
  root?.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    const row = e.target.closest(".cart-row");
    const id = row?.dataset?.id;

    if (!act || !id || !window.Cart) return;

    if (act === "inc") window.Cart.inc(id);
    if (act === "dec") window.Cart.dec(id);
    if (act === "remove") window.Cart.remove(id);

    // render() можно не вызывать, если CartStorage.save уже триггерит cart:updated,
    // но оставим "железобетонно"
    render();
  });

  btnClear?.addEventListener("click", () => {
    window.Cart?.clear();
    render();
  });

  btnCheckout?.addEventListener("click", () => {
    window.location.href = "checkout.html";
  });

  // Важно: пересчитываем при любых изменениях корзины или каталога
  window.addEventListener("cart:updated", render);
  document.addEventListener("books:updated", render);

  document.addEventListener("data:ready", render);

  document.addEventListener("bf:update-ui", render);
  document.addEventListener("bf:ended", render);

  render();
});
