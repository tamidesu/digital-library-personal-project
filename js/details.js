function renderBookDetails() {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("book");
    const section = document.getElementById("book-section");
    if (!section) return;

    const book =
        (window.ProductRepository && window.ProductRepository.byId(bookId)) ||
        (window.BOOKS || []).find((b) => b.id === bookId);

    if (!book) {
        section.innerHTML = `
      <div class="text-center py-5">
        <h2 class="text-danger">Book not found</h2>
        <a href="products.html" class="btn-back mt-3">← Back to Catalog</a>
      </div>`;
        return;
    }

    // ===== BLACK FRIDAY PRICE LOGIC (оставляем как был) =====
    let priceHTML = `<p class="price-tag">$${book.price.toFixed(2)}</p>`;
    let bfRibbon = "";

    if (book.bfDeal) {
        const discount = Math.round(book.bfDiscount * 100);
        const newPrice = (book.price * (1 - book.bfDiscount)).toFixed(2);

        priceHTML = `
      <div class="bf-price-box">
        <span class="old-price">$${book.price.toFixed(2)}</span>
        <span class="new-price">$${newPrice}</span>
      </div>
    `;

        bfRibbon = `
      <div class="bf-sticker-details">
        Black Friday -${discount}%
      </div>
    `;
    }

    section.innerHTML = `
    <div class="book-container">
      <div class="row g-5 align-items-center">

        <div class="col-md-5 text-center position-relative">
          ${bfRibbon}
          <img src="${book.cover}" alt="${book.title} — cover"
               class="book-cover img-fluid rounded shadow-lg"
               loading="lazy" decoding="async">
        </div>

        <div class="col-md-7">
          <h1 class="gradient-text">${book.title}</h1>
          <p class="book-author">by ${book.author}</p>

          <p class="book-description">${book.description}</p>

          <ul class="book-meta list-unstyled">
            <li><strong>Genre:</strong> ${book.genre}</li>
            <li><strong>Format:</strong> ${book.format}</li>
            <li><strong>Pages:</strong> ${book.pages}</li>
            <li><strong>ISBN:</strong> ${book.isbn}</li>
          </ul>

          <div class="price-section mt-4">
            ${priceHTML}
            <button class="btn-buy" id="addFromDetails">Add to Cart</button>
            <a href="products.html" class="btn-back">← Back to Catalog</a>
          </div>
        </div>
      </div>
    </div>
  `;

    document.getElementById("addFromDetails")?.addEventListener("click", () => {
        window.Cart.add(book, 1);
        const toast = document.createElement("div");
        toast.className = "cart-toast";
        toast.textContent = `Added: ${book.title}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    });
}

// 1) пробуем отрендерить, когда DOM готов
document.addEventListener("DOMContentLoaded", () => {
    if (window.BOOKS && window.BOOKS.length) {
        renderBookDetails();
    }
});

// 2) если данные из БД придут позже – дождёмся события
document.addEventListener("data:ready", () => {
    renderBookDetails();
});
