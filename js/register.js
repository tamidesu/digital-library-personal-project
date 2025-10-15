document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submitBtn");

  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      // На этом этапе просто показываем сообщение (валидация будет в следующем лабе)
      alert("Registration form submitted successfully!");
    });
  }
});
