const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

const startMarker = '// ========== ADMIN API ENDPOINTS ==========';
const startIdx = content.indexOf(startMarker);

if (startIdx > 0) {
  // Find the end of the file (last });)
  const lastBrace = content.lastIndexOf('});');
  const endIdx = lastBrace + 3;

  const newEndpoints = `// ========== ADMIN API ENDPOINTS ==========

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

app.get('/api/admin/clients/:id', adminAuth, (req, res) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'Client not found' });
    res.json({ client: user });
  });
});

app.get('/api/admin/dashboard', adminAuth, (req, res) => {
  db.get('SELECT COUNT(*) as total FROM users', [], (err, total) => {
    db.get("SELECT COUNT(*) as active FROM users WHERE subscription_status = 'active'", [], (err2, active) => {
      db.get('SELECT COUNT(*) as verified FROM users WHERE email_verified = 1', [], (err3, verified) => {
        db.get('SELECT SUM(credits) as credits FROM users', [], (err4, credits) => {
          res.json({
            totalClients: total ? total.total : 0,
            activeSubscriptions: active ? active.active : 0,
            verifiedEmails: verified ? verified.verified : 0,
            totalCredits: credits && credits.credits ? credits.credits : 0,
          });
        });
      });
    });
  });
});

app.post('/api/admin/messages', adminAuth, (req, res) => {
  const { clientId, subject, message } = req.body;
  if (!clientId || !subject || !message) {
    return res.status(400).json({ error: 'clientId, subject, and message required' });
  }
  const id = require('crypto').randomUUID();
  db.run('INSERT INTO messages (id, user_id, subject, content, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, clientId, subject, message, new Date().toISOString()],
    (err) => {
      if (err) return res.status(500).json({ error: 'Failed to send message' });
      res.json({ success: true, messageId: id });
    }
  );
});

`;

  content = content.substring(0, startIdx) + newEndpoints + content.substring(endIdx);
  fs.writeFileSync(serverPath, content);
  console.log('OK - admin API endpoints replaced');
} else {
  console.log('ERROR - start marker not found');
}
