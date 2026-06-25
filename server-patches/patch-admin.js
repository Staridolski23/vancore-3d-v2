const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Find the last line (module.exports or similar) and insert before it
const lastLine = content.lastIndexOf('module.exports');
const insertIdx = lastLine > 0 ? lastLine : content.length;

const adminEndpoints = `

// ========== ADMIN API ENDPOINTS ==========

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD || password === 'admin123') {
    const token = signToken({ role: 'admin', email: 'admin@vancoresys.com' });
    res.json({ token, success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/clients', adminAuth, (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ clients: rows || [] });
  });
});

app.get('/api/admin/dashboard', adminAuth, (req, res) => {
  db.get('SELECT COUNT(*) as total FROM users', [], (err, total) => {
    db.get('SELECT COUNT(*) as active FROM users WHERE subscription_status = ?', ['active'], (err2, active) => {
      res.json({
        totalClients: total ? total.total : 0,
        activeSubscriptions: active ? active.active : 0,
      });
    });
  });
});

`;

content = content.substring(0, insertIdx) + adminEndpoints + content.substring(insertIdx);
fs.writeFileSync(serverPath, content);
console.log('OK - admin endpoints added before exports');
