// js/books-data.js
// Централизованное хранилище данных сайта + IndexedDB

(function (window) {
  const STORAGE_KEY = "digital_library_data_v1";

  const DEFAULT_BOOKS = [
    {
      id: "the-great-library",
      title: "The Great Library",
      author: "Rachel Caine",
      genre: "fiction",
      price: 14.99,
      cover: "assets/images/book-1.png",
      format: "Paperback",
      pages: 320,
      isbn: "978-1-2345-6789-0",
      description:
        "In a world where knowledge is the ultimate power, the Great Library controls all written words. A story of rebellion, forbidden books, and the thirst for truth — a timeless modern classic.",
      bfDeal: false,
      bfDiscount: 0.3,
    },
    {
      id: "designing-uis",
      title: "Designing UIs",
      author: "Dole & Gordon",
      genre: "design",
      price: 24.0,
      cover: "assets/images/book-2.png",
      format: "Hardcover",
      pages: 280,
      isbn: "978-1-1111-2222-3",
      description:
        "Practical design patterns for creating better, more accessible user interfaces with timeless usability principles.",
      bfDeal: true,
      bfDiscount: 0.3,
    },
    {
      id: "data-stories",
      title: "Data Stories",
      author: "Cole N. Knaflic",
      genre: "data",
      price: 18.5,
      cover: "assets/images/book-3.png",
      format: "Paperback",
      pages: 256,
      isbn: "978-9-8765-4321-0",
      description:
        "Learn how to make data speak through storytelling and narrative visualization techniques that engage and inform.",
    },
    {
      id: "clean-code",
      title: "Clean Code",
      author: "Robert C. Martin",
      genre: "programming",
      price: 29.99,
      cover: "assets/images/book-4.png",
      format: "Paperback",
      pages: 464,
      isbn: "978-0-13-235088-4",
      description:
        "Timeless practices for writing clean, efficient, and maintainable code from one of the masters of software engineering.",
    },
    {
      id: "the-algorithmic-mind",
      title: "The Algorithmic Mind",
      author: "Thomas Smith",
      genre: "philosophy",
      price: 17.0,
      cover: "assets/images/book-5.png",
      format: "Paperback",
      pages: 300,
      isbn: "978-0-12-345678-9",
      description:
        "Explore how algorithms shape human thought and decision-making in a deeply philosophical journey.",
    },
    {
      id: "minimal-design",
      title: "Minimal Design",
      author: "Lisa Frank",
      genre: "design",
      price: 21.0,
      cover: "assets/images/book-6.png",
      format: "Hardcover",
      pages: 240,
      isbn: "978-3-16-148410-0",
      description:
        "Less, but better — timeless lessons in design thinking and the art of simplicity.",
      bfDeal: true,
      bfDiscount: 0.3,
    },
  ];

  // ---- Админ по умолчанию (добавили password) ----
  const defaultAdminUser = {
    id: "admin-1",
    name: "Site Admin",
    email: "admin@library.local",
    password: "admin123",          // <– добавили для логина
    role: "admin",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let LIB_DATA = {
    products: [],
    users: [],
    activity: [],
  };

  function dispatchReady() {
    document.dispatchEvent(new CustomEvent("data:ready", { detail: LIB_DATA }));
  }

  // ---- Нормализация пользователей (роль, статус, пароль, даты) ----
  function normalizeUsers(users) {
    const now = new Date().toISOString();
    return (users || []).map((u, idx) => {
      const copy = { ...u };
      if (!copy.id) {
        copy.id = "u-" + (copy.email || idx) + "-" + Date.now();
      }
      if (!copy.role) {
        // если это наш дефолтный админ по email – роль admin
        if ((copy.email || "").toLowerCase() === "admin@library.local") {
          copy.role = "admin";
        } else {
          copy.role = "user";
        }
      }
      if (!copy.status) {
        copy.status = "active";
      }
      if (!copy.createdAt) {
        copy.createdAt = now;
      }
      if (!copy.updatedAt) {
        copy.updatedAt = now;
      }
      if (!copy.password) {
        // простейший дефолт для старых записей
        copy.password = "password";
      }
      return copy;
    });
  }

  function normalizeBooks(books) {
    const now = new Date().toISOString();
    return (books || []).map((b) => ({
      ...b,
      status: b.status || "active",
      createdAt: b.createdAt || now,
      updatedAt: b.updatedAt || now,
    }));
  }

  function onlyActiveBooks(books) {
    return (books || []).filter((b) => String(b?.status ?? "active") === "active");
  }

  // ---- fallback: localStorage (если IndexedDB недоступен/сломался) ----
  function initLocalFallback() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) || {};
        LIB_DATA.products = Array.isArray(parsed.products) ? parsed.products : DEFAULT_BOOKS;
        LIB_DATA.users =
          Array.isArray(parsed.users) && parsed.users.length
            ? parsed.users
            : [defaultAdminUser];
        LIB_DATA.activity = Array.isArray(parsed.activity) ? parsed.activity : [];
      } else {
        LIB_DATA = {
          products: DEFAULT_BOOKS,
          users: [defaultAdminUser],
          activity: [],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(LIB_DATA));
      }
    } catch (err) {
      console.warn("Local fallback init failed, resetting", err);
      LIB_DATA = {
        products: DEFAULT_BOOKS,
        users: [defaultAdminUser],
        activity: [],
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(LIB_DATA));
      } catch (_) {}
    }

    // нормализуем пользователей и гарантируем наличие админа
    LIB_DATA.users = normalizeUsers(LIB_DATA.users);
    if (!LIB_DATA.users.some((u) => u.role === "admin")) {
      LIB_DATA.users.push(defaultAdminUser);
    }

    window.LIB_DATA = LIB_DATA;
    LIB_DATA.products = normalizeBooks(LIB_DATA.products);
    window.BOOKS = onlyActiveBooks(LIB_DATA.products);
    window.LIB_USERS = LIB_DATA.users;

    dispatchReady();
  }

  // ---- основной путь: IndexedDB ----
  async function initIndexedDB() {
    try {
      const db = await window.LibraryDB.open();

      let books = await window.LibraryDB.getAll(db, "books");
      if (!books || !books.length) {
        const now = new Date().toISOString();
        books = DEFAULT_BOOKS.map((b) => ({
          ...b,
          createdAt: now,
          updatedAt: now,
        }));
        await window.LibraryDB.putMany(db, "books", books);
      }

      let users = await window.LibraryDB.getAll(db, "users");

      if (!users || !users.length) {
        // если вообще пусто – кладём дефолтного админа
        users = normalizeUsers([defaultAdminUser]);
        await window.LibraryDB.putMany(db, "users", users);
      } else {
        // нормализуем, чтобы были пароль/роль/даты
        users = normalizeUsers(users);

        // если нет ни одного админа – добавляем
        if (!users.some((u) => u.role === "admin")) {
          users.push(defaultAdminUser);
          users = normalizeUsers(users); // чтобы у добавленного точно всё было
          await window.LibraryDB.putMany(db, "users", users);
        }
      }

      let activity = [];
      try {
        activity = await window.LibraryDB.getAll(db, "activity");
      } catch (_) {
        activity = [];
      }

      LIB_DATA = {
        products: books,
        users,
        activity,
      };

      window.LIB_DATA = LIB_DATA;
      window.BOOKS = books;
      window.LIB_USERS = users;
      window.LIB_DB = db;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(LIB_DATA));
      } catch (_) {}

      dispatchReady();
    } catch (err) {
      console.warn("IndexedDB init failed, falling back to localStorage", err);
      initLocalFallback();
    }
  }

  // ---- сохранение (и в localStorage, и в IndexedDB) ----
  window.saveLibData = async function saveLibData(patch) {
    const next = { ...LIB_DATA, ...patch };

    // если из patch прилетают users – нормализуем
    if (patch.users) {
      next.users = normalizeUsers(patch.users);
      // гарантируем админа
      if (!next.users.some((u) => u.role === "admin")) {
        next.users.push(defaultAdminUser);
        next.users = normalizeUsers(next.users);
      }
    }

    LIB_DATA = next;
    window.LIB_DATA = LIB_DATA;
    LIB_DATA.products = normalizeBooks(LIB_DATA.products);
    window.BOOKS = onlyActiveBooks(LIB_DATA.products);
    window.LIB_USERS = LIB_DATA.users;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(LIB_DATA));
    } catch (_) {}

    if (window.LIB_DB && window.LibraryDB) {
      const db = window.LIB_DB;
      try {
        if (patch.products) {
          await window.LibraryDB.clearStore(db, "books");
          await window.LibraryDB.putMany(db, "books", patch.products);
        }
        if (patch.users) {
          await window.LibraryDB.clearStore(db, "users");
          await window.LibraryDB.putMany(db, "users", LIB_DATA.users);
        }
        if (patch.activity) {
          await window.LibraryDB.clearStore(db, "activity");
          await window.LibraryDB.putMany(db, "activity", patch.activity);
        }
      } catch (e) {
        console.warn("Failed to sync changes to IndexedDB", e);
      }
    }
  };

  if ("indexedDB" in window && window.LibraryDB) {
    initIndexedDB();
  } else {
    initLocalFallback();
  }
})(window);

(() => {
  if (!("BroadcastChannel" in window)) return;
  const ch = new BroadcastChannel("dl_sync");

  ch.onmessage = async (e) => {
    const msg = e.data || {};
    if (msg.type === "books:updated") {
      try {
        const db = window.LIB_DB || await window.LibraryDB.open();
        const books = await window.LibraryDB.getAll(db, "books");
        window.LIB_DATA.products = books;
        books = normalizeBooks(books);

        window.LIB_DATA.products = books;        
        window.BOOKS = onlyActiveBooks(books);     

        document.dispatchEvent(new CustomEvent("books:updated", { detail: window.BOOKS }));

        document.dispatchEvent(new CustomEvent("books:updated", { detail: books }));
      } catch (err) {
        console.warn("Failed to refresh books from IndexedDB", err);
      }
    }

    if (msg.type === "users:updated") {
      try {
        const db = window.LIB_DB || await window.LibraryDB.open();
        const users = await window.LibraryDB.getAll(db, "users");
        window.LIB_DATA.users = users;
        window.LIB_USERS = users;

        document.dispatchEvent(new CustomEvent("users:updated", { detail: users }));
      } catch (err) {
        console.warn("Failed to refresh users from IndexedDB", err);
      }
    }
  };
})();
