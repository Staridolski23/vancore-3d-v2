const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const endpointsPath = '/home/vancore/vancore-backend/subscription-endpoints.js';

const server = fs.readFileSync(serverPath, 'utf8');
const endpoints = fs.readFileSync(endpointsPath, 'utf8');

const marker = "console.log('Client portal auth endpoints loaded (SQLite)')";
if (server.includes(marker)) {
  const updated = server.replace(marker, endpoints + '\n' + marker);
  fs.writeFileSync(serverPath, updated);
  console.log('OK - subscription endpoints added at line 1003');
} else {
  console.log('ERROR - marker not found');
  // Try to find similar
  const lines = server.split('\n');
  for (let i = 995; i <= 1010 && i < lines.length; i++) {
    console.log(`Line ${i}: ${lines[i]}`);
  }
}
