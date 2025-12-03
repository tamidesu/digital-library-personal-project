// js/books-data.js
// Единый источник данных для всего сайта (frontend часть)

(function (window) {
  const STORAGE_KEY = "digital_library_data_v1";

  // 1) Стартовые книги
  // СЮДА просто вставь свой текущий массив объектов книг
  // (тот, что был в window.BOOKS) вместо примера ниже
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
      bfDiscount: 0.30 
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
      bfDiscount: 0.30 
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
        "Learn how to make data speak through storytelling and narrative visualization techniques that engage and inform."
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
        "Timeless practices for writing clean, efficient, and maintainable code from one of the masters of software engineering."
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
        "Explore how algorithms shape human thought and decision-making in a deeply philosophical journey."
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
      bfDiscount: 0.30 
    }
  ];

  const defaultAdminUser = {
    id: "admin-1",
    name: "Site Admin",
    email: "admin@library.local",
    role: "admin",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  function createInitialData() {
    return {
      products: DEFAULT_BOOKS,
      users: [defaultAdminUser],
      activity: [], // пригодится для Recent Activity в админке
    };
  }

  function initLibraryData() {
    const raw = localStorage.getItem(STORAGE_KEY);

    // Если ничего нет – создаём
    if (!raw) {
      const data = createInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    // Если что-то есть – аккуратно парсим и чиним структуру, если нужно
    try {
      const parsed = JSON.parse(raw) || {};
      if (!Array.isArray(parsed.products)) parsed.products = DEFAULT_BOOKS;
      if (!Array.isArray(parsed.users)) parsed.users = [];
      if (!Array.isArray(parsed.activity)) parsed.activity = [];

      // гарантируем, что есть хотя бы один admin
      if (!parsed.users.some((u) => u.role === "admin")) {
        parsed.users.push(defaultAdminUser);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch (err) {
      console.warn("Failed to parse digital_library_data_v1. Resetting…", err);
      const data = createInitialData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  }

  const LIB_DATA = initLibraryData();

  // Глобальные “ручки”, которыми будет пользоваться остальной сайт
  window.LIB_STORAGE_KEY = STORAGE_KEY;
  window.LIB_DATA = LIB_DATA;        // { products, users, activity }
  window.BOOKS = LIB_DATA.products;  // как раньше: массив книг

  // простая функция на будущее (будем использовать позже для регистрации и т.п.)
  window.saveLibData = function saveLibData(patch) {
    const data = {
      ...LIB_DATA,
      ...patch,
    };
    // обновляем ссылку LIB_DATA
    LIB_DATA.products = data.products;
    LIB_DATA.users = data.users;
    LIB_DATA.activity = data.activity;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };
})(window);

