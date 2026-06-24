const fs = require('fs');

const server = fs.readFileSync('/home/vancore/vancore-backend/server.js', 'utf8');
const lines = server.split('\n');

// Find and remove old register endpoint (lines 902-924)
// Find and remove old login endpoint (lines 928-943)
let newLines = [];
let skipUntil = -1;

for (let i = 0; i < lines.length; i++) {
  if (i >= 901 && i <= 924) continue; // Skip old register
  if (i >= 927 && i <= 943) continue; // Skip old login
  newLines.push(lines[i]);
}

fs.writeFileSync('/home/vancore/vancore-backend/server.js', newLines.join('\n'));
console.log('OK - removed duplicate endpoints');
console.log('Total lines:', newLines.length);
