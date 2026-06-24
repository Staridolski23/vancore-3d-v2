const sqlite3 = require('sqlite3').verbose();

// Open with enableWriteAheadLogging to avoid WAL issues
const db = new sqlite3.Database('/home/vancore/vancore-backend/vancore.db', (err) => {
  if (err) {
    console.log('DB open error:', err.message);
  }
});

// Check columns
db.all("PRAGMA table_info(users)", (err, cols) => {
  console.log('Current columns:', cols.map(c => c.name).join(', '));
  
  // Try to add column
  db.run("ALTER TABLE users ADD COLUMN test_col TEXT", (err2) => {
    if (err2) {
      console.log('Add test_col error:', err2.message);
    } else {
      console.log('test_col added successfully');
      db.run("PRAGMA table_info(users)", (err3, cols2) => {
        console.log('After add:', cols2.map(c => c.name).join(', '));
        db.close();
      });
    }
  });
});
