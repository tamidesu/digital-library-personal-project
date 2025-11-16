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
