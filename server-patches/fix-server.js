const fs = require('fs');

// Read the clean server.js
const server = fs.readFileSync('/tmp/server-clean.js', 'utf8');

// Read the email verification endpoints (without the duplicate imports)
const verificationCode = `
// Email verification transporter
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
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(email, token, name) {
  const verificationUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + token;
  const mailOptions = {
    from: '"VANCORE" <hello@vancoresys.com>',
    to: email,
    subject: 'Verify your email — VANCORE AI Business Analyst',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify your email — VANCORE</title><style>body{font-family:Inter,-apple-system,sans-serif;margin:0;padding:0;background:#f7f6f2}.container{max-width:600px;margin:0 auto;padding:40px 20px}.card{background:white;border-radius:16px;padding:48px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)}.logo{font-family:Georgia,serif;font-size:28px;font-weight:700;color:#111;margin-bottom:8px}.subtitle{color:#6b6b6b;font-size:14px;margin-bottom:32px}h1{font-size:24px;font-weight:700;color:#111;margin:0 0 16px}p{color:#333;font-size:15px;line-height:1.6;margin:0 0 24px}.button{display:inline-block;padding:14px 32px;background:#991930;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px}.link{color:#991930;text-decoration:underline}.footer{margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;color:#999;font-size:12px}</style></head><body><div class="container"><div class="card"><div class="logo">VANCORE</div><div class="subtitle">AI-Powered Business Analysis</div><h1>Welcome, ' + name + '! 👋</h1><p>Thank you for joining VANCORE. To start your AI-powered business analysis journey, please verify your email address by clicking the button below.</p><center><a href="' + verificationUrl + '" class="button">Verify My Email</a></center><p style="margin-top:24px;font-size:13px;color:#6b6b6b">Or copy and paste this link into your browser:<br><a href="' + verificationUrl + '" class="link">' + verificationUrl + '</a></p><div class="footer"><p>This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p><p>© 2026 VANCORE. All rights reserved.</p></div></div></div></body></html>',
  };
  await transporter.sendMail(mailOptions);
}

// Register with email verification
app.post('/api/client/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const verificationToken = generateVerificationToken();
    const now = new Date().toISOString();
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, name, email, password, company, email_verified, verification_token, verification_token_expires, created_at, plan, credits, subscription_status) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, \'starter\', 5, \'free\')',
        [id, name, email, hashedPassword, company || '', verificationToken, new Date(Date.now() + 24*60*60*1000).toISOString(), now],
        (err) => { if (err) reject(err); else resolve(null); }
      );
    });
    try { await sendVerificationEmail(email, verificationToken, name); } catch(e) { console.error('Email error:', e.message); }
    res.json({ success: true, message: 'Registration successful. Please check your email to verify your account.', userId: id });
  } catch (e) {
    console.error('Register error:', e.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Verify email
app.get('/api/client/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token required.' });
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, verification_token_expires FROM users WHERE verification_token = ? AND email_verified = 0', [token], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token.' });
    if (new Date(user.verification_token_expires) < new Date()) return res.status(400).json({ error: 'Verification token expired.' });
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?', [user.id], (err) => {
        if (err) reject(err); else resolve(null);
      });
    });
    const jwtToken = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', { expiresIn: '30d' });
    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name));
  } catch (e) {
    console.error('Verify email error:', e.message);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// Login (only if email verified)
app.post('/api/client/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => { if (err) reject(err); else resolve(row); });
    });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email before logging in.', needsVerification: true, email: user.email });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, company: user.company, plan: user.plan, credits: user.credits, subscription_status: user.subscription_status, subscription_end: user.subscription_end } });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Resend verification email
app.post('/api/client/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email_verified FROM users WHERE email = ?', [email], (err, row) => { if (err) reject(err); else resolve(row); });
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.email_verified) return res.status(400).json({ error: 'Email already verified.' });
    const verificationToken = generateVerificationToken();
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?', [verificationToken, new Date(Date.now() + 24*60*60*1000).toISOString(), user.id], (err) => {
        if (err) reject(err); else resolve(null);
      });
    });
    await sendVerificationEmail(email, verificationToken, user.name);
    res.json({ success: true, message: 'Verification email sent.' });
  } catch (e) {
    console.error('Resend error:', e.message);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

`;

// Insert before the meetings endpoint
const marker = "app.get('/api/client/meetings'";
if (server.includes(marker)) {
  const updated = server.replace(marker, verificationCode + '\n' + marker);
  fs.writeFileSync('/home/vancore/vancore-backend/server.js', updated);
  console.log('OK - email verification endpoints integrated');
} else {
  console.log('ERROR - marker not found');
}
