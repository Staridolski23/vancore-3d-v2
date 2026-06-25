const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Step 1: Add safeSendMail after transporter
const tMarker = "  }\n});\n";
const tIdx = content.indexOf("  }\n});\n", content.indexOf("const transporter"));
if (tIdx > 0) {
  content = content.substring(0, tIdx + 5) + `
// Safe email sender with timeout
async function safeSendMail(mailOptions) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => { console.error('Email timeout'); resolve(false); }, 8000);
    transporter.sendMail(mailOptions)
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch((e) => { clearTimeout(timer); console.error('Email error:', e.message); resolve(false); });
  });
}
` + content.substring(tIdx + 5);
}

// Step 2: Replace register endpoint
const regStart = content.indexOf("app.post('/api/client/register', (req, res) => {");
const regEnd = content.indexOf("\napp.post('/api/client/login'", regStart);
const regClose = content.lastIndexOf("});", regEnd) + 3;

if (regStart > 0 && regClose > regStart) {
  const newReg = `app.post('/api/client/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars.' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email.' });
    const hash = require('crypto').createHash('sha256').update(password).digest('hex');
    const id = require('crypto').randomUUID();
    const created_at = new Date().toISOString();
    const vt = require('crypto').randomBytes(32).toString('hex');
    const ve = new Date(Date.now() + 86400000).toISOString();
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (id,email,password,company,created_at,email_verified,verification_token,verification_token_expires) VALUES (?,?,?,?,?,0,?,?)',
        [id, email, hash, company||'', created_at, vt, ve], (err) => err ? reject(err) : resolve(null));
    });
    safeSendMail({
      from: '"VANCORE" <hello@vancoresys.com>', to: email, subject: 'Verify your email - VANCORE',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome! Please verify your email.</h1><a href="https://www.vancoresys.com/api/client/verify-email?token=' + vt + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></div>',
    });
    res.json({ token: signToken({ id, email }), user: { id, email, name: name||'', company: company||'' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;
  content = content.substring(0, regStart) + newReg + content.substring(regClose);
}

// Step 3: Replace login endpoint
const logStart = content.indexOf("app.post('/api/client/login', (req, res) => {");
const logEnd = content.indexOf("\napp.get('/api/client/meetings'", logStart);
const logClose = content.lastIndexOf("});", logEnd) + 3;

if (logStart > 0 && logClose > logStart) {
  const newLog = `app.post('/api/client/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Login error.' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });
      const hash = require('crypto').createHash('sha256').update(password).digest('hex');
      if (hash !== user.password) return res.status(401).json({ error: 'Invalid credentials.' });
      res.json({ token: signToken({ id: user.id, email: user.email }), user: { id: user.id, email: user.email, name: user.name, company: user.company } });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;
  content = content.substring(0, logStart) + newLog + content.substring(logClose);
}

// Step 4: Add verify-email before meetings
const meetIdx = content.indexOf("app.get('/api/client/meetings'");
if (meetIdx > 0) {
  const verifyEndpoint = `app.get('/api/client/verify-email', async (req, res) => {
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
    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name));
  } catch (e) { res.status(500).json({ error: 'Verification failed.' }); }
});

`;
  content = content.substring(0, meetIdx) + verifyEndpoint + content.substring(meetIdx);
}

// Step 5: Add verify-db columns if not exists
content = content.replace(
  "db.run('PRAGMA journal_mode=DELETE');",
  "db.run('PRAGMA journal_mode=DELETE');\n  db.run('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0', (e) => {});\n  db.run('ALTER TABLE users ADD COLUMN verification_token TEXT', (e) => {});\n  db.run('ALTER TABLE users ADD COLUMN verification_token_expires TEXT', (e) => {});"
);

fs.writeFileSync(serverPath, content);
console.log('OK - all email verification added');
