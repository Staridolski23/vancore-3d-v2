const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

db.all("PRAGMA table_info(users)", (err, cols) => {
  console.log('Columns:', cols.map(c => c.name).join(', '));
  db.all("SELECT * FROM users", (err2, rows) => {
    console.log('Total users:', rows.length);
    if (rows.length > 0) {
      console.log('Sample:', JSON.stringify(rows[0]));
    }
    db.close();
  });
});
