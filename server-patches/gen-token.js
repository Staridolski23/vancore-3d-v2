const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate admin token
const token = jwt.sign({ role: 'admin', email: 'admin@vancoresys.com' }, JWT_SECRET);
console.log('Admin token:', token);
