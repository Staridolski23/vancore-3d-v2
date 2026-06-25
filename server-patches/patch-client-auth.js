const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Add clientAuth middleware after adminAuth
const adminAuthEnd = content.indexOf('// Admin login');
const insertIdx = adminAuthEnd;

const clientAuthMiddleware = `
// Client auth middleware (JWT-based)
function clientAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.client = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

`;

content = content.substring(0, insertIdx) + clientAuthMiddleware + content.substring(insertIdx);
fs.writeFileSync(serverPath, content);
console.log('OK - clientAuth middleware added');
