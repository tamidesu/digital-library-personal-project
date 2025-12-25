// js/auth-ui.js
(function (window, document) {
  let started = false;

  const MENU_ANIM_MS = 180;

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatShortDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }


  function readFirstJsonFromLocalStorage(keys) {
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        return { key: k, data: parsed };
      } catch (_) {}
    }
    return null;
  }

  function getCartCountFallback() {
    const hit = readFirstJsonFromLocalStorage(["LIB_CART", "DL_CART", "cart", "dlCart", "libCart"]);
    const data = hit?.data;
    if (Array.isArray(data)) return data.reduce((acc, it) => acc + (Number(it?.qty ?? 1) || 1), 0);
    if (data && typeof data === "object") {
      // иногда корзина хранится как {items: [...]}
      if (Array.isArray(data.items)) return data.items.reduce((acc, it) => acc + (Number(it?.qty ?? 1) || 1), 0);
    }
    return null;
  }

  function getOrdersCountFallback(user) {
    const hit = readFirstJsonFromLocalStorage(["LIB_ORDERS", "DL_ORDERS", "orders", "dlOrders", "libOrders"]);
    const data = hit?.data;
    if (!Array.isArray(data)) return null;

    const email = (user?.email || "").toLowerCase();
    const id = user?.id;

    // фильтр максимально “терпимый” к структурам
    const mine = data.filter((o) => {
      const oEmail = String(o?.email || o?.customerEmail || "").toLowerCase();
      const oUserId = o?.userId ?? o?.customerId ?? o?.uid;
      return (id != null && oUserId != null && String(oUserId) === String(id)) || (email && oEmail === email);
    });

    return mine.length;
  }

  function closeMenu(popup, btn) {
    if (!popup || popup.hidden) return;
    popup.classList.remove("is-open");
    btn?.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      popup.hidden = true;
    }, MENU_ANIM_MS);
  }

  function closeAnyOpenMenus() {
    document.querySelectorAll("[data-user-menu-popup].is-open").forEach((popup) => {
      const wrap = popup.closest("[data-user-menu]");
      const btn = wrap?.querySelector("[data-user-menu-btn]");
      closeMenu(popup, btn);
    });
  }

  function toggleMenuFor(btn) {
    const wrap = btn?.closest("[data-user-menu]");
    const popup = wrap?.querySelector("[data-user-menu-popup]");
    if (!popup) return;

    const isOpen = popup.classList.contains("is-open") && !popup.hidden;
    if (isOpen) {
      closeMenu(popup, btn);
      return;
    }

    closeAnyOpenMenus();
    popup.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => popup.classList.add("is-open"));
  }

  function installGlobalMenuHandlersOnce() {
    if (window.__dl_userMenuHandlersInstalled) return;
    window.__dl_userMenuHandlersInstalled = true;

    document.addEventListener("click", (e) => {
      const inside = e.target.closest?.("[data-user-menu]");
      if (!inside) closeAnyOpenMenus();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAnyOpenMenus();
    });

    window.addEventListener("resize", () => closeAnyOpenMenus());
    window.addEventListener("scroll", () => closeAnyOpenMenus(), { passive: true });
  }


  function startAuth() {
    if (started) return;
    if (!window.Auth) return;

    const headerAuth =
        document.getElementById("headerAuth") ||
        document.querySelector(".header-auth");
    if (!headerAuth) return; // на этой странице нет хедера

    started = true;
    installGlobalMenuHandlersOnce();

    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    function openModal(modal) {
      if (!modal) return;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("show"));
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove("show");
      setTimeout(() => {
        modal.hidden = true;
      }, 200);
    }

    function attachHeaderEvents() {
      document
          .getElementById("btnOpenLogin")
          ?.addEventListener("click", () => openModal(loginModal));

      document
          .getElementById("btnOpenRegister")
          ?.addEventListener("click", () => openModal(registerModal));

      document.getElementById("btnLogout")?.addEventListener("click", () => {
        window.Auth.logout();
        renderHeaderAuth();
      });
    }

    function renderHeaderAuth() {
      const user = window.Auth.getCurrentUser();

      if (!user) {
        headerAuth.innerHTML = `
          <button class="header-login-link" id="btnOpenLogin">Login</button>
          <button class="btn-register" id="btnOpenRegister">Register</button>
        `;
      } else {
        const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
        const safeName = escapeHtml(user.name || "User");
        const safeEmail = escapeHtml(user.email || "");
        const safeRole = escapeHtml(user.role || "user");

        const memberSince = formatShortDate(user.createdAt);
        const lastUpdated = formatShortDate(user.updatedAt);
        const safeMemberSince = escapeHtml(memberSince);
        const safeLastUpdated = escapeHtml(lastUpdated);


        headerAuth.innerHTML = `
          <div class="user-menu" data-user-menu>
            <button
              type="button"
              class="user-profile-badge user-menu-trigger"
              data-user-menu-btn
              aria-haspopup="menu"
              aria-expanded="false"
              title="Open profile menu"
            >
              <div class="user-text-info">
                <span class="greeting-text">Hello,</span>
                <span class="username-text">${safeName}</span>
              </div>

              <span class="user-person-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>

              <span class="user-chevron" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>

            <div class="user-dropdown" data-user-menu-popup role="menu" hidden>
              <div class="user-dropdown__header">
                <div class="user-dropdown__avatar">${initial}</div>
                <div class="user-dropdown__meta">
                  <div class="user-dropdown__name">${safeName}</div>
                  <div class="user-dropdown__email">${safeEmail || "—"}</div>
                  <div class="user-dropdown__role">Role: <span>${safeRole}</span></div>
                </div>
              </div>

              <div class="user-dropdown__facts">
                <div class="ud-fact">
                  <span class="ud-fact__label">Member since</span>
                  <span class="ud-fact__value">${safeMemberSince}</span>
                </div>

                <div class="ud-fact">
                  <span class="ud-fact__label">Last updated</span>
                  <span class="ud-fact__value">${safeLastUpdated}</span>
                </div>
              </div>

              <div class="user-dropdown__actions" role="none">
                <a class="ud-item" role="menuitem" href="profile.html">
                  Profile information
                  <span class="ud-hint">Name, email, settings</span>
                </a>
                <a class="ud-item" role="menuitem" href="purchases.html">
                  Purchase history
                  <span class="ud-hint">Orders, totals, timeline</span>
                </a>
              </div>
            </div>
          </div>

          ${
            user.role === "admin"
              ? `<a class="header-login-link" href="/admin/#/admin/dashboard">Admin Panel</a>`
              : ""
          }

          <button class="btn-logout" id="btnLogout" title="Logout" aria-label="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        `;

        // кнопка меню (после перерендера)
        headerAuth.querySelector("[data-user-menu-btn]")?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMenuFor(e.currentTarget);
        });
      }


      attachHeaderEvents();
    }

    // закрытие модалок по кнопке "Cancel"
    document.querySelectorAll(".auth-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeModal(loginModal);
        closeModal(registerModal);
      });
    });

    // login
    loginForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      try {
        window.Auth.login(email, password);
        if (loginError) loginError.textContent = "";
        closeModal(loginModal);
        renderHeaderAuth();
      } catch (err) {
        if (loginError) loginError.textContent = err.message || "Login failed";
      }
    });

    // register
    registerForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = registerForm.name.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;

      if (!name || !email || !password) {
        if (registerError)
          registerError.textContent = "Please fill in all fields";
        return;
      }

      try {
        const newUser = window.Auth.register({ name, email, password });
        window.Auth.login(newUser.email, password); // авто-логин
        if (registerError) registerError.textContent = "";
        closeModal(registerModal);
        renderHeaderAuth();
      } catch (err) {
        if (registerError)
          registerError.textContent = err.message || "Registration failed";
      }
    });

    // если auth изменился в другой вкладке/скрипте
    window.addEventListener("auth:changed", () => {
      renderHeaderAuth();
    });

    renderHeaderAuth();
  }

  // helper: запускаем startAuth, когда есть и хедер, и данные
  function initWhenDataReady() {
    if (window.LIB_DATA && window.LIB_DATA.users) {
      startAuth();
    } else {
      document.addEventListener(
          "data:ready",
          () => {
            startAuth();
          },
          { once: true }
      );
    }
  }

  // 1) для страниц с header.html через includes.js
  document.addEventListener("header:loaded", () => {
    initWhenDataReady();
  });

  // 2) на случай, если какая-то страница вставляет хедер прямо в HTML
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("headerAuth")) {
      initWhenDataReady();
    }
  });
})(window, document);
