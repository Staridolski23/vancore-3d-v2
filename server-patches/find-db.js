const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Find all .db files
const fs = require('fs');
const files = fs.readdirSync('/home/vancore/vancore-backend/').filter(f => f.endsWith('.db'));
console.log('DB files found:', files);

// Check each one
files.forEach(file => {
  const db = new sqlite3.Database('/home/vancore/vancore-backend/' + file);
  db.all("PRAGMA table_info(users)", (err, cols) => {
    console.log(file + ':', cols ? cols.map(c => c.name).join(', ') : 'no users table');
    db.close();
  });
});
