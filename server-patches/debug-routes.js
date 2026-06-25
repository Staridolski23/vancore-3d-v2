const fs = require('fs');
const serverPath = '/home/vancore/vancore-backend/server.js';
const content = fs.readFileSync(serverPath, 'utf8');

// Check if there's a route that catches /api/client/me before it reaches the handler
const lines = content.split('\n');

// Find all routes that start with /api/client
const clientRoutes = [];
lines.forEach((line, i) => {
  if (line.match(/app\.(get|put|post|delete|patch)\(['"]\/api\/client/)) {
    clientRoutes.push({ line: i + 1, content: line.trim() });
  }
});

console.log('All /api/client routes in order:');
clientRoutes.forEach(r => console.log(`  Line ${r.line}: ${r.content}`));

// Check if there's a /api/client/:id route that would catch /me
const paramRoutes = clientRoutes.filter(r => r.content.includes(':id') || r.content.includes(':'));
console.log('\nRoutes with params:');
paramRoutes.forEach(r => console.log(`  Line ${r.line}: ${r.content}`));
