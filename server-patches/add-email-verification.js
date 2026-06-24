const fs = require('fs');

const server = fs.readFileSync('/home/vancore/vancore-backend/server.js', 'utf8');

// Email verification code to insert
const emailVerification = `

// ========== EMAIL VERIFICATION ==========

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'postmaster@mg.vancoresys.com',
    pass: process.env.SMTP_PASS || 'your-smtp-password',
  },
});

function generateVerificationToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

async function sendVerificationEmail(email, token, name) {
  const verificationUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + token;
  const mailOptions = {
    from: '"VANCORE" <hello@vancoresys.com>',
    to: email,
    subject: 'Verify your email — VANCORE AI Business Analyst',
    html: '<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px"><div style="background:#fff;border-radius:16px;padding:48px"><h1 style="color:#111">Welcome, ' + name + '!</h1><p>Please verify your email to start using VANCORE.</p><a href="' + verificationUrl + '" style="display:inline-block;padding:14px 32px;background:#991930;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Verify Email</a><p style="margin-top:20px;font-size:13px;color:#666">Link expires in 24h.</p></div></div>',
  };
  await transporter.sendMail(mailOptions);
}

// Register with email verification
app.post('/api/client/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });
    
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = require('crypto').randomUUID();
    const verificationToken = generateVerificationToken();
    const now = new Date().toISOString();
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, name, email, password, company, email_verified, verification_token, verification_token_expires, created_at, plan, credits, subscription_status) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, \'starter\', 5, \'free\')',
        [id, name, email, hashedPassword, company || '', verificationToken, new Date(Date.now() + 86400000).toISOString(), now],
        (err) => err ? reject(err) : resolve(null)
      );
    });
    
    try { await sendVerificationEmail(email, verificationToken, name); } catch(e) { console.error('Email error:', e.message); }
    res.json({ success: true, message: 'Registration successful. Please check your email to verify.', userId: id });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Verify email
app.get('/api/client/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required.' });
    
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, verification_token_expires FROM users WHERE verification_token = ? AND email_verified = 0', [token], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(400).json({ error: 'Invalid token.' });
    if (new Date(user.verification_token_expires) < new Date()) return res.status(400).json({ error: 'Token expired.' });
    
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?', [user.id], (err) => err ? reject(err) : resolve(null));
    });
    
    const jwtToken = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name));
  } catch (e) {
    console.error('Verify error:', e.message);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Login (only verified users)
app.post('/api/client/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true, email: user.email });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });
    
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, company: user.company, plan: user.plan, credits: user.credits, subscription_status: user.subscription_status, subscription_end: user.subscription_end } });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Resend verification
app.post('/api/client/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });
    
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email_verified FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.email_verified) return res.status(400).json({ error: 'Already verified.' });
    
    const verificationToken = generateVerificationToken();
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?', [verificationToken, new Date(Date.now() + 86400000).toISOString(), user.id], (err) => err ? reject(err) : resolve(null));
    });
    
    await sendVerificationEmail(email, verificationToken, user.name);
    res.json({ success: true, message: 'Verification email sent.' });
  } catch (e) {
    console.error('Resend error:', e.message);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

`;

// Insert before the meetings endpoint
const marker = "app.get('/api/client/meetings'";
if (server.includes(marker)) {
  const updated = server.replace(marker, emailVerification + marker);
  fs.writeFileSync('/home/vancore/vancore-backend/server.js', updated);
  console.log('OK - email verification endpoints added');
} else {
  console.log('ERROR - marker not found');
}
