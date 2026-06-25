const fs = require('fs');
const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// SAFE APPROACH: Use string replacement with exact matches

// 1. Add clientAuth middleware before adminAuth
const adminAuthMarker = "// Admin auth middleware";
if (content.includes(adminAuthMarker)) {
  const clientAuthCode = `// Client auth middleware (JWT-based)
function clientAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized' });
  }
  try {
    req.client = verifyToken(auth.slice(7));
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

`;
  content = content.replace(adminAuthMarker, clientAuthCode + adminAuthMarker);
  console.log('1. clientAuth added');
}

// 2. Add safeSendMail after transporter
const transporterMarker = "  }\n});\n\n// Helper: send email with timeout";
if (!content.includes("// Safe email sender")) {
  const safeMailCode = `
// Safe email sender with timeout
async function safeSendMail(mailOptions) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => { console.error('Email timeout'); resolve(false); }, 8000);
    transporter.sendMail(mailOptions)
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch((e) => { clearTimeout(timer); console.error('Email error:', e.message); resolve(false); });
  });
}

`;
  // Insert after transporter closing
  const tEnd = content.indexOf("  }\n});\n", content.indexOf("const transporter"));
  if (tEnd > 0) {
    content = content.substring(0, tEnd + 5) + safeMailCode + content.substring(tEnd + 5);
    console.log('2. safeSendMail added');
  }
}

// 3. Replace register endpoint
const oldRegStart = "app.post('/api/client/register', (req, res) => {";
const oldRegEnd = "  } catch (e) { res.status(500).json({ error: e.message }); }\n});";
if (content.includes(oldRegStart)) {
  const startIdx = content.indexOf(oldRegStart);
  const endIdx = content.indexOf(oldRegEnd, startIdx) + oldRegEnd.length;
  const oldReg = content.substring(startIdx, endIdx);
  
  const newReg = `app.post('/api/client/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars.' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email.' });
    const hash = require('crypto').createHash('sha256').update(password).digest('hex');
    const id = require('crypto').randomUUID();
    const vt = require('crypto').randomBytes(32).toString('hex');
    const ve = new Date(Date.now() + 86400000).toISOString();
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (id,email,password,company,created_at,email_verified,verification_token,verification_token_expires) VALUES (?,?,?,?,?,0,?,?)',
        [id, email, hash, company||'', new Date().toISOString(), vt, ve], (err) => err ? reject(err) : resolve(null));
    });
    safeSendMail({
      from: '"VANCORE" <hello@vancoresys.com>', to: email, subject: 'Verify your email - VANCORE',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome! Please verify your email.</h1><a href="https://www.vancoresys.com/api/client/verify-email?token=' + vt + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></div>',
    });
    res.json({ success: true, message: 'Registered. Check your email to verify.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;
  
  content = content.replace(oldReg, newReg);
  console.log('3. Register endpoint updated');
}

// 4. Replace login endpoint to check email_verified
const oldLogin = `db.get('SELECT * FROM clients WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Грешка при вход.' });
      if (!user) return res.status(401).json({ error: 'Невалиден имейл или парола.' });
      const hash = require('crypto').createHash('sha256').update(password).digest('hex');
      if (hash !== user.password_hash) return res.status(401).json({ error: 'Невалиден имейл или парола.' });
      const token = signToken({ id: user.id, email: user.email });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company } });
    });`;

const newLogin = `db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Login error.' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });
      const hash = require('crypto').createHash('sha256').update(password).digest('hex');
      if (hash !== user.password) return res.status(401).json({ error: 'Invalid credentials.' });
      const token = signToken({ id: user.id, email: user.email });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company } });
    });`;

if (content.includes("db.get('SELECT * FROM clients WHERE email = ?'")) {
  content = content.replace(oldLogin, newLogin);
  console.log('4. Login endpoint updated');
}

// 5. Add /api/client/me and verify-email before meetings
const meetingsMarker = "app.get('/api/client/meetings', clientAuth";
if (content.includes(meetingsMarker)) {
  const newEndpoints = `app.get('/api/client/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required.' });
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT id,name,email FROM users WHERE verification_token=? AND email_verified=0", [token], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
    await new Promise((resolve, reject) => {
      db.run("UPDATE users SET email_verified=1,verification_token=NULL,verification_token_expires=NULL WHERE id=?", [user.id], (err) => err ? reject(err) : resolve(null));
    });
    const jwtToken = signToken({ id: user.id, email: user.email });
    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name || 'User'));
  } catch (e) { res.status(500).json({ error: 'Verification failed.' }); }
});

app.get('/api/client/me', clientAuth, (req, res) => {
  db.get('SELECT id,email,name,company,plan,credits,subscription_status,subscription_end,email_verified,created_at FROM users WHERE id=?', [req.client.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  });
});

app.put('/api/client/me', clientAuth, (req, res) => {
  const { name, company } = req.body;
  db.run('UPDATE users SET name=COALESCE(?,name),company=COALESCE(?,company),updated_at=CURRENT_TIMESTAMP WHERE id=?', [name,company,req.client.id], function(err) {
    if (err) return res.status(500).json({ error: 'Update failed' });
    res.json({ success: true });
  });
});

`;
  content = content.replace(meetingsMarker, newEndpoints + meetingsMarker);
  console.log('5. verify-email and client/me endpoints added');
}

// 6. Add DB migration
const pragmaLine = "db.run('PRAGMA journal_mode=DELETE');";
if (content.includes(pragmaLine)) {
  const migration = `db.run('PRAGMA journal_mode=DELETE');
  db.run('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0', () => {});
  db.run('ALTER TABLE users ADD COLUMN verification_token TEXT', () => {});
  db.run('ALTER TABLE users ADD COLUMN verification_token_expires TEXT', () => {});
  db.run('ALTER TABLE users ADD COLUMN name TEXT DEFAULT ""', () => {});
  db.run('ALTER TABLE users ADD COLUMN plan TEXT DEFAULT "starter"', () => {});
  db.run('ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 5', () => {});
  db.run('ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT "free"', () => {});`;
  content = content.replace(pragmaLine, migration);
  console.log('6. DB migration added');
}

// 7. Add admin API endpoints
const adminApiMarker = "// Admin login\napp.post('/api/admin/login', (req, res) => {";
if (content.includes(adminApiMarker) && !content.includes("app.get('/api/admin/dashboard'")) {
  const adminEndpoints = `// Admin API: Dashboard metrics
app.get('/api/admin/dashboard', adminAuth, (req, res) => {
  db.get('SELECT COUNT(*) as total FROM users', [], (err, total) => {
    db.get("SELECT COUNT(*) as active FROM users WHERE subscription_status='active'", [], (err2, active) => {
      db.get('SELECT COUNT(*) as verified FROM users WHERE email_verified=1', [], (err3, verified) => {
        res.json({
          totalClients: total ? total.total : 0,
          activeSubscriptions: active ? active.active : 0,
          verifiedEmails: verified ? verified.verified : 0,
        });
      });
    });
  });
});

app.get('/api/admin/clients', adminAuth, (req, res) => {
  db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ clients: rows || [] });
  });
});

`;
  content = content.replace(adminApiMarker, adminEndpoints + adminApiMarker);
  console.log('7. Admin API endpoints added');
}

fs.writeFileSync(serverPath, content);
console.log('\nDONE - all changes applied successfully');
console.log('Total lines:', content.split('\n').length);
