const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const content = fs.readFileSync(serverPath, 'utf8');

// Add PRAGMA statements after the database connection
const marker = "console.log('Connected to SQLite database')";
const pragmaCode = `console.log('Connected to SQLite database');

  // Configure database
  db.run('PRAGMA journal_mode=DELETE');
  db.run('PRAGMA foreign_keys=ON');`;

if (content.includes(marker)) {
  const updated = content.replace(marker, pragmaCode);
  fs.writeFileSync(serverPath, updated);
  console.log('OK - database pragmas added');
} else {
  console.log('ERROR - marker not found');
}
