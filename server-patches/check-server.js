const fs = require('fs');
const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// The file got corrupted - the beginning is missing. Let's restore from backup
// and apply only the necessary changes

// First, let's see what the first 10 lines look like
const lines = content.split('\n');
console.log('First 10 lines:');
lines.slice(0, 10).forEach((l, i) => console.log(`  ${i + 1}: ${l}`));

// Check if it starts with app.post
if (lines[0].includes("app.post")) {
  console.log('\nPROBLEM: File starts with app.post - missing express setup!');
  console.log('Need to restore from backup and carefully apply changes.');
}
