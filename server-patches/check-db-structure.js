const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

// Check actual table structure
db.all("PRAGMA table_info(users)", (err, cols) => {
  console.log('Columns:', cols.map(c => c.name).join(', '));
  
  // Check all data
  db.all("SELECT * FROM users LIMIT 5", (err2, rows) => {
    if (rows && rows.length > 0) {
      console.log('\nFirst row:');
      console.log(JSON.stringify(rows[0], null, 2));
      console.log('\nTotal rows:', rows.length);
    } else {
      console.log('No data in table');
    }
    db.close();
  });
});
