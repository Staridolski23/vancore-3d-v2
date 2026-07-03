const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/vancore.db');
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'", (e, r) => {
  console.log(r[0]?.sql || 'NO_TABLE');
  db.close();
});
