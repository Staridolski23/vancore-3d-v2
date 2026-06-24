const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/vancore.db');

db.all("PRAGMA table_info(users)", (err, cols) => {
  console.log('Users table columns:');
  cols.forEach(c => console.log(' ', c.name, c.type));
  db.close();
});
