const fs = require('fs');
const server = fs.readFileSync('/home/vancore/vancore-backend/server.js', 'utf8');

const emailEndpoints = `

// EMAIL VERIFICATION
async function sendVerificationEmail(email, token, name) {
  const verifyUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + token;
  try {
    await transporter.sendMail({
      from: '"VANCORE" <hello@vancoresys.com>',
      to: email,
      subject: 'Verify your email - VANCORE',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome, ' + (name || 'User') + '!</h1><p>Please verify your email.</p><a href="' + verifyUrl + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></div>',
    });
  } catch(e) { console.error('Email error:', e.message); }
}

app.post('/api/client/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars.' });
    const hash = require('crypto').createHash('sha256').update(password).digest('hex');
    const id = require('crypto').randomUUID();
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 86400000).toISOString();
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM clients WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO clients (id, email, password_hash, name, company, created_at, email_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)',
        [id, email, hash, name || '', company || '', new Date().toISOString(), verificationToken, tokenExpires],
        (err) => err ? reject(err) : resolve(null));
    });
    await sendVerificationEmail(email, verificationToken, name);
    res.json({ success: true, message: 'Registered. Check your email to verify.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/client/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required.' });
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT id, name, email FROM clients WHERE verification_token = ? AND email_verified = 0", [token], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(400).json({ error: 'Invalid token.' });
    await new Promise((resolve, reject) => {
      db.run("UPDATE clients SET email_verified = 1, verification_token = NULL WHERE id = ?", [user.id], (err) => err ? reject(err) : resolve(null));
    });
    const jwtToken = signToken({ id: user.id, email: user.email });
    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name));
  } catch (e) { res.status(500).json({ error: 'Verification failed.' }); }
});

app.post('/api/client/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    db.get('SELECT * FROM clients WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Login error.' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
      if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });
      const hash = require('crypto').createHash('sha256').update(password).digest('hex');
      if (hash !== user.password_hash) return res.status(401).json({ error: 'Invalid credentials.' });
      const token = signToken({ id: user.id, email: user.email });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company } });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

`;

const marker = "app.get('/api/client/meetings'";
if (server.includes(marker)) {
  const updated = server.replace(marker, emailEndpoints + marker);
  fs.writeFileSync('/home/vancore/vancore-backend/server.js', updated);
  console.log('OK');
} else {
  console.log('ERROR');
}
