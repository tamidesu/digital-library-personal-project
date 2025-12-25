async function persistOrderToIndexedDB(order, submitResult, customerEmail) {
  if (!window.LibraryDB) throw new Error("LibraryDB is not available");

  const db = window.LIB_DB || await window.LibraryDB.open();
  const nowIso = new Date().toISOString();

  const currentUser = window.Auth?.getCurrentUser?.();
  const userId = currentUser?.id ?? null;

  // ===== Orders record (store: "orders") =====
  const orderRecord = {
    id: submitResult.orderId,          // keyPath = "id"
    userId,                            // for index "by_user"
    status: "paid",                    // for index "by_status"
    createdAt: nowIso,                 // for index "by_created_at"
    updatedAt: nowIso,

    customer: {
      fullName: order?.customer?.fullName || "",
      email: customerEmail || order?.customer?.email || "",
      phone: order?.customer?.phone || "",
      address: order?.customer?.address || "",
      city: order?.customer?.city || "",
      zip: order?.customer?.zip || "",
    },

    totals: {
      subtotal: +order.subtotal.toFixed(2),
      shipping: +order.shipping.toFixed(2),
      tax: +order.tax.toFixed(2),
      total: +order.total.toFixed(2),
    },

    payment: {
      txId: submitResult.txId,
      provider: "PaymentGatewayMock",
    },
  };

  await window.LibraryDB.putOne(db, "orders", orderRecord);

  // ===== Order items records (store: "order_items") =====
  const itemRecords = (order.items || []).map((it, idx) => ({
    id: `${orderRecord.id}::${it.id}::${idx}`, // уникальный ключ
    orderId: orderRecord.id,                  // for index "by_order"
    bookId: it.id,                            // for index "by_book"
    title: it.title,
    price: +it.price,
    qty: +it.qty,
    subtotal: +it.subtotal.toFixed(2),
    createdAt: nowIso,
  }));

  if (itemRecords.length) {
    await window.LibraryDB.putMany(db, "order_items", itemRecords);
  }

  // optional: notify UI pieces if you want later (dropdown counts, purchases page)
  document.dispatchEvent(new CustomEvent("orders:updated", { detail: orderRecord }));

  // optional cross-tab sync
  if ("BroadcastChannel" in window) {
    const ch = new BroadcastChannel("dl_sync");
    ch.postMessage({ type: "orders:updated" });
    ch.close();
  }

  return orderRecord;
}

document.addEventListener('includes:loaded', ()=>{ 
  const items = (window.Cart?.items || []).map(i => new OrderItem({
    id: i.id, title: i.title, price: i.price, qty: i.qty
  }));
  const order = new Order(items);
 
  const itemsRoot = document.getElementById('orderItems');
  if (!items.length){
    itemsRoot.innerHTML = `<p class="text-muted">Your cart is empty.</p>`;
  } else {
    itemsRoot.innerHTML = items.map(i=>`
      <div class="line"><span>${i.title} × ${i.qty}</span><span>${Money.fmt(i.subtotal)}</span></div>
    `).join('');
  }
  document.getElementById('sumSubtotal').textContent = Money.fmt(order.subtotal);
  document.getElementById('sumShipping').textContent = Money.fmt(order.shipping);
  document.getElementById('sumTax').textContent = Money.fmt(order.tax);
  document.getElementById('sumTotal').textContent = Money.fmt(order.total);
 
  const form = document.getElementById('checkoutForm');
  const err = (name, msg)=>{
    const el = document.querySelector(`[data-error="${name}"]`);
    if (el) el.textContent = msg || '';
  };

  const get = n => form.elements[n]?.value?.trim() || '';

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); 
    ['fullName','email','phone','address','city','zip','card','expiry','cvc'].forEach(n=>err(n,''));

    const fullName = get('fullName');
    const email = get('email');
    const phone = get('phone');
    const address = get('address');
    const city = get('city');
    const zip = get('zip');
    const card = get('card');
    const expiry = get('expiry');
    const cvc = get('cvc');
 
    let ok = true;
    if (!Validator.required(fullName)) { err('fullName','Enter your name'); ok=false; }
    if (!Validator.email(email)) { err('email','Enter a valid email'); ok=false; }
    if (!Validator.phone(phone)) { err('phone','Enter a valid phone'); ok=false; }
    if (!Validator.required(address)) { err('address','Enter your address'); ok=false; }
    if (!Validator.required(city)) { err('city','Enter your city'); ok=false; }
    if (!Validator.zip(zip)) { err('zip','Enter a valid post code'); ok=false; }
    if (!Validator.cardNumber(card)) { err('card','16-19 digits or spaced'); ok=false; }
    if (!Validator.expiry(expiry)) { err('expiry','Format MM/YY'); ok=false; }
    if (!Validator.cvc(cvc)) { err('cvc','3-4 digits'); ok=false; }

    if (!ok) return;
 
    order.customer = new Customer({fullName,email,phone,address,city,zip});
 
    try{
      const res = await order.submit();

      // 1) Persist to IndexedDB (orders + order_items)
      await persistOrderToIndexedDB(order, res, email);

      // 2) Clear cart and redirect
      window.Cart?.clear();
      const q = new URLSearchParams({ orderId: res.orderId, email });
      location.href = `order-confirmed.html?${q.toString()}`;
    }catch(e){
      alert(`Payment error: ${e.message || e}`);
    }
  });
 
  const cc = form.elements['card'];
  const ex = form.elements['expiry'];
  const onlyDigits = s => (s||'').replace(/\D+/g,'');
  cc?.addEventListener('input', ()=>{
    const d = onlyDigits(cc.value).slice(0,16);
    cc.value = d.replace(/(\d{4})(?=\d)/g,'$1 ').trim();
  });
  ex?.addEventListener('input', ()=>{
    const d = onlyDigits(ex.value).slice(0,4);
    if (d.length <= 2) ex.value = d; else ex.value = `${d.slice(0,2)}/${d.slice(2)}`;
  });
});
