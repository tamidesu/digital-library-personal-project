document.addEventListener("DOMContentLoaded", async () => {
  const placeholders = document.querySelectorAll("[data-include]");

  await Promise.all(
    Array.from(placeholders).map(async (el) => {
      const file = el.getAttribute("data-include");
      try {
        const res = await fetch(file, { cache: "no-cache" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const html = await res.text();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();
        el.replaceWith(...wrapper.childNodes);
      } catch (err) {
        console.error("Include failed:", file, err);
      }
    })
  );

  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("header .menu a, header .btn-register").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (
      (current === "index.html" && (href === "#" || href.endsWith("index.html"))) ||
      (current !== "index.html" && href.endsWith(current))
    ) {
      a.classList.add("active");
    }
  });

  document.dispatchEvent(new Event("includes:loaded"));
});
