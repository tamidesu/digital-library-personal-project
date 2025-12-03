document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('cartSection');
  if (!root) return;

  function render() {
    const items = window.Cart.items;

    // EMPTY CART
    if (!items.length) {
      root.innerHTML = `
        <div class="text-center py-5">
          <h3 class="mb-3">Your cart is empty</h3>
          <p class="empty-sub">Add some books to start building your library.</p>
          <a href="products.html" class="btn-back">← Back to Catalog</a>
        </div>`;
      return;
    }

    // BUILD ROWS
    const rows = items.map(i => {
      const book = window.ProductRepository.byId(i.id);

      let oldPriceHTML = "";
      let bfLabelHTML = "";
      let newPrice = Currency.format(i.price);

      if (book && book.bfDeal) {
        const discount = Math.round(book.bfDiscount * 100);

        oldPriceHTML = `
          <span class="old-price me-1">$${book.price.toFixed(2)}</span>
        `;

        bfLabelHTML = `
          <span class="bf-small ms-1">-${discount}%</span>
        `;
      }

      return `
        <tr data-id="${i.id}">
          <td width="60">
            <img src="${i.cover}" alt="" style="width:48px;height:48px;object-fit:contain;border-radius:8px"/>
          </td>

          <td class="cart-item-title">${i.title}</td>

          <td class="price">
            ${oldPriceHTML}
            <span class="new-price">${newPrice}</span>
            ${bfLabelHTML}
          </td>

          <td>
            <div class="cart-qty">
              <button class="btn-dec" aria-label="Decrease">−</button>
              <input class="qty-input" type="number" min="1" value="${i.qty}" />
              <button class="btn-inc" aria-label="Increase">+</button>
            </div>
          </td>

          <td class="subtotal">${Currency.format(i.subtotal)}</td>

          <td>
            <button class="btn-danger-clear btn-remove" aria-label="Remove">Remove</button>
          </td>
        </tr>
      `;
    }).join('');

    // BUILD TABLE WRAPPER
    root.innerHTML = `
      <div class="table-responsive">
        <table class="cart-table">
          <thead>
            <tr>
              <th></th>
              <th>Book</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>

          <tbody>${rows}</tbody>

          <tfoot>
            <tr>
              <td colspan="6" class="total-row">
                Total: <span class="total-amount">${Currency.format(window.Cart.getTotalAmount())}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    // ATTACH EVENTS FOR EACH ROW
    root.querySelectorAll('tr[data-id]').forEach(tr => {
      const id = tr.getAttribute('data-id');

      tr.querySelector('.btn-inc')?.addEventListener('click', () => {
        window.Cart.inc(id);
        render();
      });

      tr.querySelector('.btn-dec')?.addEventListener('click', () => {
        window.Cart.dec(id);
        render();
      });

      tr.querySelector('.btn-remove')?.addEventListener('click', () => {
        window.Cart.remove(id);
        render();
      });

      tr.querySelector('.qty-input')?.addEventListener('change', e => {
        const val = Math.max(1, parseInt(e.target.value, 10) || 1);
        window.Cart.setQty(id, val);
        render();
      });
    });
  }

  render();

  // CLEAR CART BUTTON
  document.getElementById('btnClearCart')?.addEventListener('click', () => {
    if (confirm('Clear the entire cart?')) {
      window.Cart.clear();
      render();
    }
  });

  // CHECKOUT REDIRECT
  document.getElementById('btnCheckout')?.addEventListener('click', () => {
    location.href = 'checkout.html';
  });

  // UPDATE EVENT
  document.addEventListener('cart:updated', render);
});
