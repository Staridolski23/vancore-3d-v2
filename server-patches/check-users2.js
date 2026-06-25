const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

db.all("SELECT id, email, company, plan, subscription_status FROM users", (err, rows) => {
  if (err) console.log('ERR:', err.message);
  else {
    console.log('Total users:', rows.length);
    rows.forEach(r => console.log(`  ${r.email} | ${r.company} | ${r.plan} | ${r.subscription_status}`));
  }
  db.close();
});
