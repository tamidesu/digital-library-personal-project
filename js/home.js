document.addEventListener("DOMContentLoaded", () => {
  /* === CURSOR LIGHT TRACKING === */
  document.addEventListener("mousemove", (e) => {
    document.body.style.setProperty("--x", e.clientX + "px");
    document.body.style.setProperty("--y", e.clientY + "px");
  });

  const hero = document.querySelector(".hero-modern");
  const content = document.querySelector(".hero-content");

  /* === BACKGROUND PARTICLES === */
  const canvas = document.createElement("canvas");
  canvas.id = "stars-bg";
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let w, h;
  let particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    particles = [];
    const count = 90;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.5,
        dx: (Math.random() - 0.5) * 1.0,
        dy: (Math.random() - 0.5) * 1.0,
        color: Math.random() > 0.5 ? "#3b82f6" : "#a855f7",
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "lighter";
    particles.forEach((p, i) => {
      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;

      const t = Date.now() * 0.001;
      const pulse = 0.8 + Math.sin(t + i) * 0.2;
      ctx.globalAlpha = pulse;

      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.restore();
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();

  /* === REVEAL ANIMATION === */
  setTimeout(() => content.classList.add("reveal"), 300);

  /* === PARALLAX === */
  let targetX = 0,
    targetY = 0,
    currentX = 0,
    currentY = 0;

  document.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 30;
    targetY = (e.clientY / window.innerHeight - 0.5) * 15;
  });

  function animate() {
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;
    content.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(animate);
  }
  animate();

  /* === CURSOR LIGHT === */
  hero.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    hero.style.setProperty("--x", `${x}%`);
    hero.style.setProperty("--y", `${y}%`);
  });

  /* === Reveal on scroll === */
  const reveals = document.querySelectorAll(".reveal");
  const observerReveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observerReveal.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  reveals.forEach((el) => observerReveal.observe(el));
});

/* === Animated counters === */
const counters = document.querySelectorAll(".count");
const options = { threshold: 0.5 };

const startCount = (entry) => {
  if (entry.isIntersecting) {
    const el = entry.target;
    const target = +el.dataset.target;
    let count = 0;
    const speed = target / 100;

    const update = () => {
      count += speed;
      if (count < target) {
        el.textContent = Math.floor(count);
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    };
    update();
  }
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(startCount);
}, options);

counters.forEach((el) => observer.observe(el));

/* === Horizontal Scroll Testimonials === */
/* === Horizontal Scroll Testimonials (centered start & end) === */
(() => {
  const section = document.querySelector('.testimonials-section');
  const scrollContainer = section.querySelector('.horizontal-scroll');

  let scrollWidth, cardWidth, offsetStart, offsetEnd;

  const updateWidth = () => {
    const cards = scrollContainer.querySelectorAll('.testimonial-card');
    if (!cards.length) return;

    cardWidth = cards[0].offsetWidth;
    const lastCard = cards[cards.length - 1];

    // Центрирование первой и последней карточек
    offsetStart = window.innerWidth / 2 - cardWidth / 2;

    const containerRect = scrollContainer.getBoundingClientRect();
    const lastRect = lastCard.getBoundingClientRect();

    // Расстояние до последней карточки (с поправкой на центр)
    const distanceToLast =
      lastCard.offsetLeft + cardWidth / 2 - window.innerWidth / 2;

    scrollWidth = distanceToLast + offsetStart;
  };

  updateWidth();
  window.addEventListener('resize', updateWidth);

  window.addEventListener('scroll', () => {
    const rect = section.getBoundingClientRect();
    const totalScroll = rect.height + window.innerHeight;
    const progress = Math.min(
      Math.max((window.innerHeight - rect.top) / totalScroll, 0),
      1
    );

    scrollContainer.style.transform = `translateX(${offsetStart - progress * scrollWidth}px)`;
  });
})();

/* === Gentle Dust Particles (ОТДЕЛЬНО!) === */
(function () {
  const canvas = document.getElementById("dust-layer");
  const ctx = canvas.getContext("2d");

  let w, h;
  const particles = [];
  const count = 30;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    particles.length = 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.3,
        speedY: 0.15 + Math.random() * 0.3,
        speedX: (Math.random() - 0.5) * 0.1,
        color: Math.random() > 0.5 ? "#60a5fa" : "#a855f7",
        opacity: 0.25 + Math.random() * 0.5,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y > h) p.y = -5;
      if (p.x < 0 || p.x > w) p.x = Math.random() * w;

      ctx.beginPath();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

/* === Card Glow + Tilt === */
const cards = document.querySelectorAll(".feature-card");

cards.forEach((card) => {
  const glow = document.createElement("div");
  glow.className = "card-glow";
  card.appendChild(glow);

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * -6;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(59,130,246,0.25), transparent 60%)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
    glow.style.background = "none";
  });
});

document.addEventListener("bf:tick", (e) => {
    const t = e.detail;
    const box = document.querySelector(".bfv-timer");

    if (!box) return;

    document.querySelector("[data-home-days]").textContent = t.days;
    document.querySelector("[data-home-hours]").textContent = t.hours;
    document.querySelector("[data-home-minutes]").textContent = t.minutes;
    document.querySelector("[data-home-seconds]").textContent = t.seconds;

    if (t.ended) {
        document.querySelector(".bfv-ended")?.classList.add("show");
    }
});

document.addEventListener("bf:ended", () => {
    document.querySelector(".home-bf-ended")?.classList.remove("hidden");

    const timer = document.querySelector(".bfv-timer");
    if (timer) timer.style.display = "none";
});