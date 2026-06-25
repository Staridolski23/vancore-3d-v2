const fs = require('fs');
const serverPath = '/home/vancore/vancore-backend/server.js';
const content = fs.readFileSync(serverPath, 'utf8');

// Let me check if the server is actually running and loading the latest code
// by adding a console.log to the /api/client/me handler

const meIdx = content.indexOf("app.get('/api/client/me', clientAuth");
if (meIdx > 0) {
  // Find the opening { of the handler
  const braceIdx = content.indexOf('{', meIdx);
  // Insert a console.log right after the opening brace
  const insertPos = braceIdx + 1;
  const updated = content.substring(0, insertPos) + '\n    console.log(">>> /api/client/me HIT, client:", req.client);' + content.substring(insertPos);
  fs.writeFileSync(serverPath, updated);
  console.log('Added debug log to /api/client/me');
} else {
  console.log('Could not find /api/client/me');
}
