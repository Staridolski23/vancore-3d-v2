const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const content = fs.readFileSync(serverPath, 'utf8');

// Find the register endpoint
const startMarker = "app.post('/api/client/register', (req, res) => {";
const endMarker = "});\n\napp.post('/api/client/login'";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex > 0 && endIndex > 0) {
    const oldRegister = content.substring(startIndex, endIndex + 3);
    
    const newRegister = `app.post('/api/client/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Имейл и парола са задължителни.' });
    if (password.length < 6) return res.status(400).json({ error: 'Паролата трябва да е поне 6 символа.' });
    if (!email.includes('@')) return res.status(400).json({ error: 'Невалиден имейл адрес.' });
    const hash = require('crypto').createHash('sha256').update(password).digest('hex');
    const id = require('crypto').randomUUID();
    const created_at = new Date().toISOString();
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 86400000).toISOString();
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
    });
    if (existing) return res.status(400).json({ error: 'Този имейл вече е регистриран.' });
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO users (id, email, password, company, created_at, email_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
        [id, email, hash, company || '', created_at, verificationToken, tokenExpires],
        (err) => err ? reject(err) : resolve(null));
    });
    try {
      const verifyUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + verificationToken;
      await transporter.sendMail({
        from: '"VANCORE" <hello@vancoresys.com>',
        to: email,
        subject: 'Verify your email - VANCORE',
        html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome, ' + (name || 'User') + '!</h1><p>Please verify your email.</p><a href="' + verifyUrl + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></div>',
      });
    } catch(e) { console.error('Email error:', e.message); }
    const token = signToken({ id, email });
    res.json({ token, user: { id, email, name: name || '', company: company || '' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

    const updated = content.substring(0, startIndex) + newRegister + content.substring(endIndex + 3);
    fs.writeFileSync(serverPath, updated);
    console.log('OK - register endpoint replaced');
} else {
    console.log('ERROR - could not find register endpoint');
    console.log('startIndex:', startIndex, 'endIndex:', endIndex);
}
