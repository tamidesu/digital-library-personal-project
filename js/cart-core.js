;(function(global){
  class Currency {
    static format(n){ return `$${(+n).toFixed(2)}`; }
  }

  class CartItem {
    constructor({id, title, price, cover, qty = 1}) {
      this.id = id;
      this.title = title;
      this.price = +price;
      this.cover = cover;
      this.qty = Math.max(1, +qty);
    }
    get subtotal(){ return this.price * this.qty; }
  }

  class CartStorage {
    static KEY = 'digital_library_cart_v1';
    static load(){
      try {
        const json = localStorage.getItem(CartStorage.KEY);
        return json ? JSON.parse(json) : [];
      } catch(_) { return []; }
    }
    static save(items){
        localStorage.setItem(CartStorage.KEY, JSON.stringify(items));
    
        window.dispatchEvent(new CustomEvent('cart:updated'));
        document.dispatchEvent(new CustomEvent('cart:updated'));
    }
    static clear(){ localStorage.removeItem(CartStorage.KEY); document.dispatchEvent(new CustomEvent('cart:updated')); }
  }

  class Cart {
    constructor(){
      this.items = CartStorage.load().map(i=>new CartItem(i));
    }
    persist(){ CartStorage.save(this.items); }
    clear(){ this.items = []; CartStorage.clear(); }
    getTotalItems(){ return this.items.reduce((s,i)=>s+i.qty,0); }
    getTotalAmount(){ return this.items.reduce((s,i)=>s+i.subtotal,0); }
    find(id){ return this.items.find(i=>i.id===id); }

    add(product, qty=1){
      const existing = this.find(product.id);
      if (existing) existing.qty += qty;
      else {
        const finalPrice = product.bfDeal ? product.price * (1 - product.bfDiscount) : product.price;
        this.items.push(new CartItem({ id: product.id, title: product.title, price: finalPrice, cover: product.cover, qty }));
      }
      this.persist();
    }

    setQty(id, qty){
      const it = this.find(id);
      if (!it) return;
      it.qty = Math.max(1, +qty||1);
      this.persist();
    }

    inc(id){ const it = this.find(id); if(it){ it.qty++; this.persist(); } }
    dec(id){
      const it = this.find(id);
      if(it){ it.qty = Math.max(1, it.qty-1); this.persist(); }
    }

    remove(id){
      this.items = this.items.filter(i=>i.id!==id);
      this.persist();
    }
  }

  class ProductRepository {
    static byId(id){ return (global.BOOKS||[]).find(b=>b.id===id); }
    static byIds(ids){ return (global.BOOKS||[]).filter(b=>ids.includes(b.id)); }
  }

  global.Currency = Currency;
  global.Cart = new Cart();
  global.ProductRepository = ProductRepository;

})(window);
