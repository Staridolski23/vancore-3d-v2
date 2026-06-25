const fs = require('fs');
const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

// Find the duplicate at line 5 and remove it
// Line 5 is index 4
if (lines[4].includes("app.get('/api/client/me', clientAuth")) {
  // Find end of this block
  let endIdx = 5;
  while (endIdx < lines.length) {
    if (lines[endIdx].trim() === '' || lines[endIdx].startsWith('//') || lines[endIdx].startsWith('app.')) break;
    endIdx++;
  }
  
  console.log('Removing duplicate at lines 5-' + endIdx + ':');
  console.log(lines.slice(4, endIdx).join('\n'));
  
  lines.splice(4, endIdx - 4);
}

// Also remove the extra blank line at start if needed
content = lines.join('\n');
content = content.replace(/^\n+/, '\n');

fs.writeFileSync(serverPath, content);
console.log('\nOK - removed duplicate, cleaned up');
console.log('Total lines:', content.split('\n').length);
