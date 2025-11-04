document.addEventListener('DOMContentLoaded', ()=>{
  const root = document.getElementById('cartSection');
  if (!root) return;

  function render() {
    const items = window.Cart.items;
    if (!items.length) {
      root.innerHTML = `
        <div class="text-center py-5">
          <h3 class="mb-3">Your cart is empty</h3>
          <p class="text-muted mb-4">Add some books to start building your library.</p>
          <a href="products.html" class="btn-back">← Back to Catalog</a>
        </div>`;
      return;
    }

    const rows = items.map(i => `
      <tr data-id="${i.id}">
        <td width="60">
          <img src="${i.cover}" alt="" style="width:48px;height:48px;object-fit:contain;border-radius:8px"/>
        </td>
        <td class="cart-item-title">${i.title}</td>
        <td class="price">${Currency.format(i.price)}</td>
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
    `).join('');

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

    root.querySelectorAll('tr[data-id]').forEach(tr=>{
      const id = tr.getAttribute('data-id');
      tr.querySelector('.btn-inc')?.addEventListener('click', ()=>{ window.Cart.inc(id); render(); });
      tr.querySelector('.btn-dec')?.addEventListener('click', ()=>{ window.Cart.dec(id); render(); });
      tr.querySelector('.btn-remove')?.addEventListener('click', ()=>{ window.Cart.remove(id); render(); });
      tr.querySelector('.qty-input')?.addEventListener('change', (e)=>{
        const val = Math.max(1, parseInt(e.target.value,10)||1);
        window.Cart.setQty(id, val); render();
      });
    });
  }

  render();

  document.getElementById('btnClearCart')?.addEventListener('click', ()=>{
    if (confirm('Clear the entire cart?')) { window.Cart.clear(); render(); }
  });

  document.getElementById('btnCheckout')?.addEventListener('click', ()=>{
    alert(`Checkout not implemented. Total: ${Currency.format(window.Cart.getTotalAmount())}`);
  });

  document.addEventListener('cart:updated', render);
});
