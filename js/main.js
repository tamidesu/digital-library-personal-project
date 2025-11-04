document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".btn-buy");

  const searchInput = document.getElementById("searchInput");
  const genreSelect = document.getElementById("genreSelect");
  const priceRange = document.getElementById("priceRange");
  const priceValue = document.getElementById("priceValue");
  const products = document.querySelectorAll(".product");

  function filterProducts() {
    const search = searchInput.value.toLowerCase();
    const genre = genreSelect.value;
    const maxPrice = parseFloat(priceRange.value);

    products.forEach(p => {
      const title = p.querySelector(".card-title").textContent.toLowerCase();
      const itemGenre = p.dataset.genre;
      const price = parseFloat(p.dataset.price);

      const matchTitle = title.includes(search);
      const matchGenre = !genre || itemGenre === genre;
      const matchPrice = price <= maxPrice;

      if (matchTitle && matchGenre && matchPrice) {
        p.style.display = "";
      } else {
        p.style.display = "none";
      }
    });
  }

  priceRange.addEventListener("input", () => {
    priceValue.textContent = `$${priceRange.value}`;
    filterProducts();
  });

  searchInput.addEventListener("input", filterProducts);
  genreSelect.addEventListener("change", filterProducts);

  document.querySelectorAll('.product').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--y', `${e.clientY - rect.top}px`);
    });
  });

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const product = button.closest(".product");
      const title = product.querySelector(".card-title")?.textContent;
      const price = product.querySelector(".price")?.textContent;
      alert(`You have added "${title}" to your cart (${price})`);
    });
  });

  document.querySelectorAll('.product').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--y', `${e.clientY - rect.top}px`);
  });
});
});

