const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

db.all('SELECT id,name,email,company,plan,subscription_status,created_at FROM users ORDER BY created_at DESC LIMIT 10', (err, rows) => {
  if (err) console.log('ERR:', err.message);
  else console.log(JSON.stringify(rows, null, 2));
  db.close();
});
