document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".btn-buy");

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
