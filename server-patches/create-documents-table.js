const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/vancore.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT DEFAULT '',
    client_email TEXT DEFAULT '',
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

db.close();
