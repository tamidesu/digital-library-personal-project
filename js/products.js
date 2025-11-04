document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const genreSelect = document.getElementById("genreSelect");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const products = document.querySelectorAll(".product");

  if (priceValue && priceRange) priceValue.textContent = `$${priceRange.value}`;

  function filterProducts() {
    const search = (searchInput?.value || "").toLowerCase().trim();
    const genre = genreSelect?.value || "";
    const maxPrice = parseFloat(priceRange?.value || "999");

    products.forEach(p => {
      const title = p.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const itemGenre = p.dataset.genre || "";
      const price = parseFloat(p.dataset.price || "0");

      const matchTitle = title.includes(search);
      const matchGenre = !genre || itemGenre === genre;
      const matchPrice = price <= maxPrice;

      p.style.display = (matchTitle && matchGenre && matchPrice) ? "" : "none";
    });
  }

  searchInput?.addEventListener("input", filterProducts);
  genreSelect?.addEventListener("change", filterProducts);
  priceRange?.addEventListener("input", () => { priceValue.textContent = `$${priceRange.value}`; filterProducts(); });
  filterProducts();

  document.querySelectorAll(".product").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--y", `${e.clientY - rect.top}px`);
    });
  });


  document.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-add");
      const product = (window.ProductRepository && window.ProductRepository.byId(id)) ||
                      (window.BOOKS || []).find(b=>b.id===id);
      if (!product) return alert("Product not found");
      window.Cart.add(product, 1);
  
      const title = product.title;
      const toast = document.createElement('div');
      toast.className = 'cart-toast';
      toast.textContent = `Added: ${title}`;
      document.body.appendChild(toast);
      setTimeout(()=> toast.classList.add('show'),10);
      setTimeout(()=> { toast.classList.remove('show'); setTimeout(()=>toast.remove(),300); }, 2000);
    });
  });

  if (window.Cart) {
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }
});
