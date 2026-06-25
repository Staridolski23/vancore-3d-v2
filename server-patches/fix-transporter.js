const fs = require('fs');
const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Remove the stray ); on line 306
content = content.replace('}\n\n);\n\napp.get(\'/api/health\'', '}\n\napp.get(\'/api/health\'');

fs.writeFileSync(serverPath, content);
console.log('OK - removed stray );');
