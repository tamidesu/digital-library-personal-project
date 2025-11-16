document.addEventListener("includes:loaded", () => {
  const el = document.getElementById("floatingCart");
  const countEl = document.getElementById("floatingCartCount");
  if (!el || !countEl) return;

  const updateCount = () => {
    if (!window.Cart) return;
    const total = window.Cart.getTotalItems();
    countEl.textContent = total;
  };

  const bounce = () => {
    updateCount();
    el.classList.add("bounce");
    setTimeout(() => el.classList.remove("bounce"), 400);
  };

  window.addEventListener("cart:updated", bounce);
  document.addEventListener("cart:updated", bounce);

  el.addEventListener("click", (e) => {
    if (window.MiniCart && document.getElementById("mcDrawer")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.MiniCart.open();
    } else {
      window.location.href = "cart.html";
    }
  });

  updateCount();
});