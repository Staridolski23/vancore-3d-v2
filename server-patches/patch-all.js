const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add safeSendMail helper after transporter creation
const transporterEnd = "  }\n});\n";
const transporterIdx = content.indexOf(transporterEnd);
if (transporterIdx > 0) {
  const safeMailCode = `

// Safe email sender with timeout
async function safeSendMail(mailOptions) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error('Email timeout');
      resolve(false);
    }, 8000);
    transporter.sendMail(mailOptions)
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch((e) => { clearTimeout(timer); console.error('Email error:', e.message); resolve(false); });
  });
}

`;
  content = content.substring(0, transporterIdx + transporterEnd.length) + safeMailCode + content.substring(transporterIdx + transporterEnd.length);
}

// 2. Replace old register endpoint with email verification version
const oldRegister = "app.post('/api/client/register', (req, res) => {";
const registerIdx = content.indexOf(oldRegister);
if (registerIdx > 0) {
  // Find the end of this endpoint (next app.post or app.get)
  const nextEndpoint = content.indexOf("\napp.post('/api/client/login'", registerIdx);
  const endIdx = content.lastIndexOf("});", nextEndpoint) + 3;
  
  const newRegister = `app.post('/api/client/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars.' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email.' });
    const hash = require('crypto').createHash('sha256').update(password).digest('hex');
    const id = require('crypto').randomUUID();
    const created_at = new Date().toISOString();
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 86400000).toISOString();
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (id, email, password, company, created_at, email_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
        [id, email, hash, company || '', created_at, verificationToken, tokenExpires],
        (err) => err ? reject(err) : resolve(null));
    });
    const verifyUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + verificationToken;
    safeSendMail({
      from: '"VANCORE" <hello@vancoresys.com>',
      to: email,
      subject: 'Verify your email - VANCORE',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome, ' + (name || 'User') + '!</h1><p>Please verify your email to start using VANCORE.</p><a href="' + verifyUrl + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a><p style="font-size:12px;color:#666;margin-top:15px">Link expires in 24h.</p></div>',
    });
    const token = signToken({ id, email });
    res.json({ token, user: { id, email, name: name || '', company: company || '' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

  content = content.substring(0, registerIdx) + newRegister + content.substring(endIdx);
}

// 3. Replace old login endpoint with email verification check
const oldLogin = "app.post('/api/client/login', (req, res) => {";
const loginIdx = content.indexOf(oldLogin);
if (loginIdx > 0) {
  const nextAfterLogin = content.indexOf("\napp.get('/api/client/meetings'", loginIdx);
  const loginEndIdx = content.lastIndexOf("});", nextAfterLogin) + 3;
  
  const newLogin = `app.post('/api/client/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Login error.' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });
      const hash = require('crypto').createHash('sha256').update(password).digest('hex');
      if (hash !== user.password) return res.status(401).json({ error: 'Invalid credentials.' });
      const token = signToken({ id: user.id, email: user.email });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company } });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

  content = content.substring(0, loginIdx) + newLogin + content.substring(loginEndIdx);
}

// 4. Add verify-email endpoint before meetings
const meetingsMarker = "app.get('/api/client/meetings'";
const meetingsIdx = content.indexOf(meetingsMarker);
if (meetingsIdx > 0) {
  const verifyEndpoint = `app.get('/api/client/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required.' });
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT id, name, email FROM users WHERE verification_token = ? AND email_verified = 0", [token], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });
    await new Promise((resolve, reject) => {
      db.run("UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?", [user.id], (err) => err ? reject(err) : resolve(null));
    });
    const jwtToken = signToken({ id: user.id, email: user.email });
    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name));
  } catch (e) { res.status(500).json({ error: 'Verification failed.' }); }
});

`;
  content = content.substring(0, meetingsIdx) + verifyEndpoint + content.substring(meetingsIdx);
}

fs.writeFileSync(serverPath, content);
console.log('OK - email verification endpoints added');
