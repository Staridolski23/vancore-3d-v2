const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/vancore.db');

// Disable WAL mode
db.run("PRAGMA journal_mode=DELETE", (err) => {
  if (err) console.log('WAL error:', err.message);
  else console.log('Journal mode set to DELETE');
  
  // Verify columns
  db.all("PRAGMA table_info(users)", (err, cols) => {
    console.log('Columns:', cols.map(c => c.name).join(', '));
    
    // Test insert
    db.run("INSERT INTO users (id, email, password, email_verified) VALUES (?, ?, ?, 0)",
      ['test-id', 'test@test.com', 'hash123'],
      function(err2) {
        if (err2) console.log('Insert error:', err2.message);
        else console.log('Insert OK, rowid:', this.lastID);
        db.close();
      }
    );
  });
});
