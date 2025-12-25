// js/auth-core.js
(function (window) {
  const AUTH_KEY = "digital_library_auth_v1";

  function loadAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY)) || { currentUserId: null };
    } catch {
      return { currentUserId: null };
    }
  }

  function saveAuth(state) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  }

  function getUsers() {
    return (window.LIB_DATA && window.LIB_DATA.users) || [];
  }

  function normStatus(s) {
    const x = String(s || "active").trim().toLowerCase();
    return x === "inactive" ? "inactive" : "active";
  }

  function isActiveUser(user) {
    return user && normStatus(user.status) === "active";
  }

  function findUserByEmail(email) {
    const users = getUsers();
    const lower = String(email || "").toLowerCase().trim();
    return users.find((u) => String(u.email || "").toLowerCase() === lower);
  }

  function safeLogout(reason = "logout") {
    saveAuth({ currentUserId: null });
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user: null, reason } }));
  }

  function getCurrentUser() {
    const auth = loadAuth();
    if (!auth.currentUserId) return null;

    const user = getUsers().find((u) => u.id === auth.currentUserId) || null;
    if (!user) {
      safeLogout("user_missing");
      return null;
    }

    // ВАЖНО: если админ деактивировал — разлогиниваем автоматически
    if (!isActiveUser(user)) {
      safeLogout("user_inactive");
      return null;
    }

    return user;
  }

  function register({ name, email, password }) {
    const users = getUsers();
    if (!window.saveLibData || !window.LIB_DATA) {
      throw new Error("Data layer is not initialized");
    }

    const cleanEmail = String(email || "").trim();
    const cleanName = String(name || "").trim();

    if (!cleanName) throw new Error("Name is required");
    if (!cleanEmail) throw new Error("Email is required");
    if (!password) throw new Error("Password is required");

    if (findUserByEmail(cleanEmail)) {
      throw new Error("User with this email already exists");
    }

    const now = new Date().toISOString();
    const newUser = {
      id: "u-" + Date.now(),
      name: cleanName,
      email: cleanEmail,
      password,
      role: "user",
      status: "active", // регистрация всегда активная
      createdAt: now,
      updatedAt: now,
    };

    const updatedUsers = [...users, newUser];
    window.saveLibData({ users: updatedUsers });

    return newUser;
  }

  function login(email, password) {
    const user = findUserByEmail(email);

    // сначала проверяем статус
    if (!user) {
      throw new Error("Invalid email or password");
    }
    if (!isActiveUser(user)) {
      throw new Error("This account is inactive");
    }
    if (user.password !== password) {
      throw new Error("Invalid email or password");
    }

    saveAuth({ currentUserId: user.id });
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: { user, reason: "login" } }));
    return user;
  }

  function logout() {
    safeLogout("manual_logout");
  }

  // Можно дергать из UI/роутера, чтобы проверять что юзер не стал inactive
  function ensureActiveSession() {
    return getCurrentUser();
  }

  window.Auth = {
    getCurrentUser,
    ensureActiveSession,
    register,
    login,
    logout,
    loadAuthState: loadAuth,
    isActiveUser,
  };
})(window);
