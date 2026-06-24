const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const verificationPath = '/home/vancore/vancore-backend/server-email-verification.js';

const server = fs.readFileSync(serverPath, 'utf8');
const verification = fs.readFileSync(verificationPath, 'utf8');

// Insert verification endpoints before the client meetings endpoint
const marker = "app.get('/api/client/meetings'";
if (server.includes(marker)) {
  const updated = server.replace(marker, verification + '\n' + marker);
  fs.writeFileSync(serverPath, updated);
  console.log('OK - email verification endpoints added');
} else {
  console.log('ERROR - marker not found');
}
