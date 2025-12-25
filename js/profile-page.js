// js/profile-page.js
(function (window, document) {
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function setError(name, msg) {
    const el = document.querySelector(`[data-error="${name}"]`);
    if (el) el.textContent = msg || "";
  }

  function clearErrors() {
    $all("[data-error]").forEach((e) => (e.textContent = ""));
  }

  function fmtDate(iso) {
    try {
      if (!iso) return "—";
      const d = new Date(iso);
      return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return "—";
    }
  }

  function initialsFrom(user) {
    const src = (user?.name || user?.email || "U").trim();
    return src.charAt(0).toUpperCase();
  }

  function renderUser(user) {
    $("#profileAvatar").textContent = initialsFrom(user);

    $("#badgeRole").textContent = `Role: ${user?.role || "user"}`;
    $("#badgeStatus").textContent = `Status: ${user?.status || "active"}`;

    $("#statCreatedAt").textContent = fmtDate(user?.createdAt);
    $("#statUpdatedAt").textContent = fmtDate(user?.updatedAt);

    $("#previewName").textContent = user?.name || "—";
    $("#previewEmail").textContent = user?.email || "—";
    $("#previewRole").textContent = user?.role || "—";
    $("#previewStatus").textContent = user?.status || "—";
  }

  async function waitForDataReady() {
    if (window.LIB_DATA && window.LIB_DATA.users) return;
    await new Promise((resolve) => {
      document.addEventListener("data:ready", resolve, { once: true });
    });
  }

  function requireAuth() {
    const user = window.Auth?.getCurrentUser?.();
    if (!user) {
      // если не залогинен — отправим на products (или можно на index)
      location.href = "products.html";
      return null;
    }
    return user;
  }

  function validate({ name, email, password, confirm }, currentUser) {
    let ok = true;

    const nm = name.trim();
    const em = email.trim();

    if (nm.length < 2) { setError("name", "Please enter at least 2 characters."); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError("email", "Please enter a valid email address."); ok = false; }

    // email uniqueness
    const users = window.LIB_DATA?.users || [];
    const lower = em.toLowerCase();
    const exists = users.some((u) => (u.email || "").toLowerCase() === lower && u.id !== currentUser.id);
    if (exists) { setError("email", "This email is already used by another account."); ok = false; }

    // password optional
    const pw = password.trim();
    const cf = confirm.trim();
    if (pw || cf) {
      if (pw.length < 4) { setError("password", "Password must be at least 4 characters."); ok = false; }
      if (pw !== cf) { setError("confirm", "Passwords do not match."); ok = false; }
    }

    return ok;
  }

  async function saveUserChanges(currentUser, { name, email, password }) {
    const users = window.LIB_DATA.users || [];
    const now = new Date().toISOString();

    const nextUsers = users.map((u) => {
      if (u.id !== currentUser.id) return u;

      const patch = {
        ...u,
        name: name.trim(),
        email: email.trim(),
        updatedAt: now,
      };

      // only update password if provided
      if (password.trim()) patch.password = password.trim();

      return patch;
    });

    // save to IndexedDB (and localStorage) via books-data.js
    await window.saveLibData({ users: nextUsers });

    // auth state uses userId so it's still valid; update header rendering
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: window.Auth.getCurrentUser() } }));
  }

  async function init() {
    await waitForDataReady();

    const currentUser = requireAuth();
    if (!currentUser) return;

    // refresh reference from LIB_DATA (in case)
    const users = window.LIB_DATA.users || [];
    const liveUser = users.find((u) => u.id === currentUser.id) || currentUser;

    renderUser(liveUser);

    const form = $("#profileForm");
    if (!form) return;

    // prefill
    form.name.value = liveUser.name || "";
    form.email.value = liveUser.email || "";
    form.password.value = "";
    form.confirm.value = "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      const payload = {
        name: form.name.value,
        email: form.email.value,
        password: form.password.value,
        confirm: form.confirm.value,
      };

      const saveState = $("#saveState");
      saveState.className = "save-state";
      saveState.textContent = "";

      // re-read latest user (avoid stale)
      const fresh = (window.LIB_DATA.users || []).find((u) => u.id === liveUser.id) || liveUser;

      if (!validate(payload, fresh)) return;

      // UX: disable button while saving
      const btn = $("#btnSaveProfile");
      btn.disabled = true;
      btn.textContent = "Saving...";

      try {
        await saveUserChanges(fresh, payload);

        // re-read & render
        const updated = (window.LIB_DATA.users || []).find((u) => u.id === fresh.id) || fresh;
        renderUser(updated);

        // clear password fields
        form.password.value = "";
        form.confirm.value = "";

        saveState.classList.add("ok");
        saveState.textContent = "Saved successfully.";
      } catch (err) {
        console.error(err);
        saveState.classList.add("err");
        saveState.textContent = "Failed to save changes. Please try again.";
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
    });
  }

  document.addEventListener("includes:loaded", init);
  document.addEventListener("DOMContentLoaded", () => {
    // на случай если includes не используется на странице
    if (document.querySelector("[data-include]")) return;
    init();
  });
})(window, document);
