;(function(global){

  class Money {
    static fmt(n){ return `$${(+n).toFixed(2)}`; }
  }

  class OrderItem {
    constructor({id, title, price, qty}){
      this.id = id; this.title = title; this.price = +price; this.qty = +qty || 1;
    }
    get subtotal(){ return this.price * this.qty; }
  }

  class Customer {
    constructor({fullName, email, phone, address, city, zip}){
      this.fullName = fullName; this.email = email; this.phone = phone;
      this.address = address; this.city = city; this.zip = zip;
    }
  }

  class Validator {
    static required(v){ return v && String(v).trim().length>1; }
    static email(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v||''); }
    static phone(v){ return /^[+\d][\d\s()-]{6,}$/.test(v||''); }
    static zip(v){ return /^[A-Za-z0-9\- ]{3,10}$/.test(v||''); }
    static cardNumber(v){ return /^[\d ]{16,19}$/.test(v||''); }
    static expiry(v){ return /^(0[1-9]|1[0-2])\/\d{2}$/.test(v||''); }
    static cvc(v){ return /^\d{3,4}$/.test(v||''); }
  }

  class PaymentGatewayMock {
    static async pay({amount}){ 
      await new Promise(r=>setTimeout(r, 600));
      if (amount <= 0) throw new Error('Invalid amount');
 
      if (Math.random() < 0.02) throw new Error('Payment declined');
      return { txId: `TX${Date.now()}` };
    }
  }

  class Order {
    constructor(items = [], customer = null){
      this.items = items.map(i=> i instanceof OrderItem ? i : new OrderItem(i));
      this.customer = customer;
      this.shipping = 0;  
      this.taxRate = 0.0; 
      this.createdAt = new Date();
      this.id = `DL-${this.createdAt.getTime().toString(36).toUpperCase()}`;
    }
    get subtotal(){ return this.items.reduce((s,i)=> s + i.subtotal, 0); }
    get tax(){ return +(this.subtotal * this.taxRate).toFixed(2); }
    get total(){ return this.subtotal + this.shipping + this.tax; }

    async submit(){
      const payRes = await PaymentGatewayMock.pay({amount: this.total});
      return { orderId: this.id, txId: payRes.txId, total: this.total };
    }
  }

  global.Money = Money;
  global.Order = Order;
  global.OrderItem = OrderItem;
  global.Customer = Customer;
  global.Validator = Validator;
})(window);
