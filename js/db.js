// js/db.js
// Обёртка над IndexedDB для Digital Library

(function (window) {
    const DB_NAME = "digital_library_db";
    const DB_VERSION = 1;

    // Открытие БД (или создание, если нет)
    function openLibraryDB() {
        return new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                return reject(new Error("IndexedDB is not supported in this browser"));
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = request.result;

                // books
                if (!db.objectStoreNames.contains("books")) {
                    const store = db.createObjectStore("books", { keyPath: "id" });
                    store.createIndex("by_genre", "genre", { unique: false });
                    store.createIndex("by_title", "title", { unique: false });
                }

                // users
                if (!db.objectStoreNames.contains("users")) {
                    const store = db.createObjectStore("users", { keyPath: "id" });
                    store.createIndex("by_email", "email", { unique: true });
                    store.createIndex("by_role", "role", { unique: false });
                }

                // orders (на будущее)
                if (!db.objectStoreNames.contains("orders")) {
                    const store = db.createObjectStore("orders", { keyPath: "id" });
                    store.createIndex("by_user", "userId", { unique: false });
                    store.createIndex("by_status", "status", { unique: false });
                    store.createIndex("by_created_at", "createdAt", { unique: false });
                }

                // order_items (на будущее)
                if (!db.objectStoreNames.contains("order_items")) {
                    const store = db.createObjectStore("order_items", { keyPath: "id" });
                    store.createIndex("by_order", "orderId", { unique: false });
                    store.createIndex("by_book", "bookId", { unique: false });
                }

                // activity (лог изменений для админки)
                if (!db.objectStoreNames.contains("activity")) {
                    const store = db.createObjectStore("activity", { keyPath: "id", autoIncrement: true });
                    store.createIndex("by_entity_type", "entityType", { unique: false });
                    store.createIndex("by_created_at", "createdAt", { unique: false });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error || new Error("Failed to open IndexedDB"));
            };
        });
    }

    // ======= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =======

    function getAll(db, storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    function count(db, storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.count();
            req.onsuccess = () => resolve(req.result || 0);
            req.onerror = () => reject(req.error);
        });
    }

    function putMany(db, storeName, items) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            (items || []).forEach((item) => store.put(item));
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    function putOne(db, storeName, item) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.put(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function clearStore(db, storeName) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    function deleteOne(db, storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    window.LibraryDB = {
        open: openLibraryDB,
        getAll,
        count,
        putMany,
        putOne,
        clearStore,
        deleteOne,
    };
})(window);
