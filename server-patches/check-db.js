const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/vancore.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  console.log('Tables:', tables.map(t => t.name).join(', '));
  
  // Check users table structure
  db.all("PRAGMA table_info(users)", (err, cols) => {
    console.log('Users columns:', cols.map(c => c.name).join(', '));
    db.close();
  });
});
