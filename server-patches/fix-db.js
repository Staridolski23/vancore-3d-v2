const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/vancore.db');

const queries = [
  "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN verification_token TEXT",
  "ALTER TABLE users ADD COLUMN verification_token_expires TEXT"
];

let i = 0;
function runNext() {
  if (i >= queries.length) {
    console.log('DB OK - columns added');
    db.close();
    return;
  }
  db.run(queries[i], (err) => {
    if (err) {
      console.log('Note:', err.message.substring(0, 60));
    } else {
      console.log('OK:', queries[i].substring(0, 40));
    }
    i++;
    runNext();
  });
}

runNext();
