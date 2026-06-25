const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Add /api/client/me endpoint after verify-email
const verifyEndpoint = content.indexOf("res.redirect('/client-portal?verified=true'");
const insertIdx = content.indexOf('\n', verifyEndpoint) + 1;

const clientMeEndpoint = `
// Get current user profile
app.get('/api/client/me', clientAuth, (req, res) => {
  db.get('SELECT id, email, name, company, plan, credits, subscription_status, subscription_end, email_verified, created_at FROM users WHERE id = ?', [req.client.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });
});

// Update user profile
app.put('/api/client/me', clientAuth, (req, res) => {
  const { name, company } = req.body;
  db.run('UPDATE users SET name = COALESCE(?, name), company = COALESCE(?, company), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, company, req.client.id], function(err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ success: true });
    }
  );
});

`;

content = content.substring(0, insertIdx) + clientMeEndpoint + content.substring(insertIdx);
fs.writeFileSync(serverPath, content);
console.log('OK - /api/client/me endpoint added');
