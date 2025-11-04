document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get("book");
  const section = document.getElementById("book-section");

  const book = (window.ProductRepository && window.ProductRepository.byId(bookId))
             || (window.BOOKS || []).find(b=>b.id===bookId);

  if (!book) {
    section.innerHTML = `
      <div class="text-center py-5">
        <h2 class="text-danger">Book not found</h2>
        <a href="products.html" class="btn-back mt-3">← Back to Catalog</a>
      </div>`;
    return;
  }

  section.innerHTML = `
    <div class="book-container">
      <div class="row g-5 align-items-center">
        <div class="col-md-5 text-center position-relative">
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
            <p class="price-tag">$${book.price.toFixed(2)}</p>
            <button class="btn-buy" id="addFromDetails">Add to Cart</button>
            <a href="products.html" class="btn-back">← Back to Catalog</a>
          </div>
        </div>
      </div>
    </div>
  `;


  document.getElementById('addFromDetails')?.addEventListener('click', ()=>{
    window.Cart.add(book, 1);
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = `Added: ${book.title}`;
    document.body.appendChild(toast);
    setTimeout(()=> toast.classList.add('show'),10);
    setTimeout(()=> { toast.classList.remove('show'); setTimeout(()=>toast.remove(),300); }, 2000);
  });
});
