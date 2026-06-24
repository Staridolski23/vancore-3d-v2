const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

db.all("PRAGMA table_info(users)", (err, cols) => {
  console.log('Columns:', cols.map(c => c.name).join(', '));
  db.close();
});
