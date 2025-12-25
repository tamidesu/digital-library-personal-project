(function () {
  const $ = (s) => document.querySelector(s);

  function money(n){
    const v = Number(n || 0);
    return `$${v.toFixed(2)}`;
  }

  function titleCase(s){
    return String(s || "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  function buildGenreModel(books){
    const map = new Map();

    (books || []).forEach(b => {
      const g = (b.genre || "other").toLowerCase().trim();
      if (!map.has(g)) map.set(g, { key: g, count: 0, sum: 0, samples: [] });
      const it = map.get(g);
      it.count += 1;
      it.sum += Number(b.price || 0);
      if (it.samples.length < 3 && b.title) it.samples.push(b.title);
    });

    return Array.from(map.values()).map(x => ({
      ...x,
      avg: x.count ? x.sum / x.count : 0
    }));
  }

  function sortGenres(list, mode){
    const arr = [...list];
    switch(mode){
      case "count_asc":  return arr.sort((a,b)=>a.count-b.count);
      case "name_desc":  return arr.sort((a,b)=>b.key.localeCompare(a.key));
      case "name_asc":   return arr.sort((a,b)=>a.key.localeCompare(b.key));
      default:           return arr.sort((a,b)=>b.count-a.count);
    }
  }

  function render(genres){
    const grid = $("#genresGrid");
    const empty = $("#genresEmpty");
    if (!grid) return;

    if (!genres.length){
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    grid.innerHTML = genres.map(g => {
      const exploreHref = `products.html?genre=${encodeURIComponent(g.key)}&max=50`;
      const chips = (g.samples || []).map(t => `<span class="sample-chip">${escapeHtml(t)}</span>`).join("");
      return `
        <article class="genre-card" style="--gx:50%;--gy:30%">
          <div class="genre-top">
            <div class="genre-name">${titleCase(g.key)}</div>
            <div class="genre-pill">${g.count} book${g.count === 1 ? "" : "s"}</div>
          </div>

          <div class="genre-meta">
            Average price: <strong>${money(g.avg)}</strong>
          </div>

          <div class="genre-sample">
            ${chips || `<span class="sample-chip">No samples</span>`}
          </div>

          <div class="genre-actions">
            <a class="btn-primary-mini" href="${exploreHref}">Explore</a>
            <a class="btn-outline" href="products.html">All products</a>
          </div>
        </article>
      `;
    }).join("");

    const cards = Array.from(document.querySelectorAll(".genre-card"));
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty("--gx", `${x}%`);
        card.style.setProperty("--gy", `${y}%`);
      });
    });

    // reveal animation
    if ("IntersectionObserver" in window){
      const io = new IntersectionObserver((entries)=>{
        entries.forEach(en=>{
          if(en.isIntersecting){
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      }, { threshold: .12 });
      cards.forEach(c => io.observe(c));
    } else {
      cards.forEach(c => c.classList.add("in"));
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function init(){
    const books = window.BOOKS || [];
    const statGenres = $("#statGenres");
    const statBooks = $("#statBooks");
    const statAvg = $("#statAvg");

    const model = buildGenreModel(books);
    const totalBooks = books.length;
    const avg = totalBooks ? books.reduce((s,b)=> s + Number(b.price||0), 0) / totalBooks : 0;

    if (statGenres) statGenres.textContent = String(model.length);
    if (statBooks) statBooks.textContent = String(totalBooks);
    if (statAvg) statAvg.textContent = money(avg);

    const search = $("#genreSearch");
    const sort = $("#genreSort");

    function apply(){
      const q = (search?.value || "").trim().toLowerCase();
      const mode = sort?.value || "count_desc";
      const filtered = model.filter(g => titleCase(g.key).toLowerCase().includes(q) || g.key.includes(q));
      render(sortGenres(filtered, mode));
    }

    search?.addEventListener("input", apply);
    sort?.addEventListener("change", apply);

    apply();
  }

  // ждём данные из IndexedDB слоя
  document.addEventListener("DOMContentLoaded", () => {
    if (window.BOOKS && window.BOOKS.length) init();
    else document.addEventListener("data:ready", init, { once: true });
  });
})();
