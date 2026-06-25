const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

const queries = [
  "ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'starter'",
  "ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 5",
  "ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free'",
  "ALTER TABLE users ADD COLUMN subscription_end TEXT",
  "ALTER TABLE users ADD COLUMN industry TEXT",
  "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client'"
];

let i = 0;
function runNext() {
  if (i >= queries.length) {
    console.log('DB OK - all columns added');
    // Verify
    db.all("PRAGMA table_info(users)", (err, cols) => {
      console.log('Final columns:', cols.map(c => c.name).join(', '));
      db.all("SELECT COUNT(*) as count FROM users", (err2, r) => {
        console.log('Total users:', r[0].count);
        db.close();
      });
    });
    return;
  }
  db.run(queries[i], (err) => {
    if (err) console.log('Note:', err.message.substring(0, 50));
    else console.log('OK:', queries[i].substring(0, 40));
    i++;
    runNext();
  });
}

runNext();
