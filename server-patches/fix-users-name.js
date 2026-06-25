const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');

// Add name column and update existing users
db.run("ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''", (err) => {
  if (err) console.log('Add name column:', err.message);
  else console.log('name column added');
  
  // Update existing users with placeholder names
  db.run("UPDATE users SET name = SUBSTR(email, 1, INSTR(email, '@') - 1) WHERE name = '' OR name IS NULL", (err2) => {
    if (err2) console.log('Update error:', err2.message);
    else console.log('Updated existing users');
    
    // Verify
    db.all("SELECT id, name, email, company, plan, subscription_status FROM users", (err3, rows) => {
      console.log('\nAll users:');
      rows.forEach(r => console.log(`  ${r.name} | ${r.email} | ${r.company} | ${r.plan} | ${r.subscription_status}`));
      db.close();
    });
  });
});
