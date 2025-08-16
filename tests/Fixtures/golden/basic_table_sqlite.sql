-- Input: CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price DECIMAL(10,2), created_at DATETIME);
-- Golden file: Basic table conversion from MySQL to SQLite

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price NUMERIC,
    created_at TEXT
);