const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');
const lines = content.split('\n');

// Step 1: Find transporter end and insert safeSendMail
let tEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ZOHO_PASSWORD')) {
    // Next line should be "  }"
    for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
      if (lines[j].trim() === '});') {
        tEnd = j + 1;
        break;
      }
    }
    break;
  }
}

if (tEnd > 0) {
  const helper = [
    '',
    '// Safe email sender with timeout',
    'async function safeSendMail(mailOptions) {',
    '  return new Promise((resolve) => {',
    '    const timer = setTimeout(() => { console.error("Email timeout"); resolve(false); }, 8000);',
    '    transporter.sendMail(mailOptions)',
    '      .then(() => { clearTimeout(timer); resolve(true); })',
    '      .catch((e) => { clearTimeout(timer); console.error("Email error:", e.message); resolve(false); });',
    '  });',
    '}',
  ];
  lines.splice(tEnd, 0, ...helper);
  console.log('Step 1 OK: safeSendMail added at line', tEnd);
} else {
  console.log('Step 1 ERROR');
}

// Step 2: Replace register endpoint
const regStart = lines.findIndex(l => l.includes("app.post('/api/client/register'"));
const logStart = lines.findIndex((l, i) => i > regStart && l.includes("app.post('/api/client/login'"));
if (regStart > 0 && logStart > 0) {
  // Find }); before login
  let regEnd = logStart;
  for (let i = logStart - 1; i > regStart; i--) {
    if (lines[i].trim() === '});') { regEnd = i + 1; break; }
  }
  
  const newReg = [
    "app.post('/api/client/register', async (req, res) => {",
    "  try {",
    "    const { email, password, name, company } = req.body;",
    "    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });",
    "    if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ chars.' });",
    "    if (!email.includes('@')) return res.status(400).json({ error: 'Invalid email.' });",
    "    const hash = require('crypto').createHash('sha256').update(password).digest('hex');",
    "    const id = require('crypto').randomUUID();",
    "    const created_at = new Date().toISOString();",
    "    const vt = require('crypto').randomBytes(32).toString('hex');",
    "    const ve = new Date(Date.now() + 86400000).toISOString();",
    "    const existing = await new Promise((resolve, reject) => {",
    "      db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));",
    "    });",
    "    if (existing) return res.status(400).json({ error: 'Email already registered.' });",
    "    await new Promise((resolve, reject) => {",
    "      db.run('INSERT INTO users (id,email,password,company,created_at,email_verified,verification_token,verification_token_expires) VALUES (?,?,?,?,?,0,?,?)',",
    "        [id, email, hash, company||'', created_at, vt, ve], (err) => err ? reject(err) : resolve(null));",
    "    });",
    "    safeSendMail({",
    "      from: '\"VANCORE\" <hello@vancoresys.com>', to: email, subject: 'Verify your email - VANCORE',",
    "      html: '<div style=\"font-family:sans-serif;max-width:500px;margin:auto;padding:30px\"><h1>Welcome! Please verify your email.</h1><a href=\"https://www.vancoresys.com/api/client/verify-email?token=' + vt + '\" style=\"display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px\">Verify Email</a></div>',",
    "    });",
    "    res.json({ token: signToken({ id, email }), user: { id, email, name: name||'', company: company||'' } });",
    "  } catch (e) { res.status(500).json({ error: e.message }); }",
    "});",
  ];
  
  lines.splice(regStart, regEnd - regStart, ...newReg);
  console.log('Step 2 OK: register replaced');
} else {
  console.log('Step 2 ERROR');
}

// Step 3: Replace login endpoint
const logStart2 = lines.findIndex(l => l.includes("app.post('/api/client/login'"));
const meetIdx = lines.findIndex(l => l.includes("app.get('/api/client/meetings'"));
if (logStart2 > 0 && meetIdx > 0) {
  let logEnd = meetIdx;
  for (let i = meetIdx - 1; i > logStart2; i--) {
    if (lines[i].trim() === '});') { logEnd = i + 1; break; }
  }
  
  const newLog = [
    "app.post('/api/client/login', (req, res) => {",
    "  try {",
    "    const { email, password } = req.body;",
    "    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });",
    "    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {",
    "      if (err) return res.status(500).json({ error: 'Login error.' });",
    "      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });",
    "      if (!user.email_verified) return res.status(403).json({ error: 'Please verify your email first.', needsVerification: true });",
    "      const hash = require('crypto').createHash('sha256').update(password).digest('hex');",
    "      if (hash !== user.password) return res.status(401).json({ error: 'Invalid credentials.' });",
    "      res.json({ token: signToken({ id: user.id, email: user.email }), user: { id: user.id, email: user.email, name: user.name, company: user.company } });",
    "    });",
    "  } catch (e) { res.status(500).json({ error: e.message }); }",
    "});",
  ];
  
  lines.splice(logStart2, logEnd - logStart2, ...newLog);
  console.log('Step 3 OK: login replaced');
} else {
  console.log('Step 3 ERROR');
}

// Step 4: Add verify-email before meetings
const meetIdx2 = lines.findIndex(l => l.includes("app.get('/api/client/meetings'"));
if (meetIdx2 > 0) {
  const verify = [
    "app.get('/api/client/verify-email', async (req, res) => {",
    "  try {",
    "    const { token } = req.query;",
    "    if (!token) return res.status(400).json({ error: 'Token required.' });",
    "    const user = await new Promise((resolve, reject) => {",
    "      db.get(\"SELECT id,name,email FROM users WHERE verification_token=? AND email_verified=0\", [token], (err, row) => err ? reject(err) : resolve(row));",
    "    });",
    "    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });",
    "    await new Promise((resolve, reject) => {",
    "      db.run(\"UPDATE users SET email_verified=1,verification_token=NULL,verification_token_expires=NULL WHERE id=?\", [user.id], (err) => err ? reject(err) : resolve(null));",
    "    });",
    "    const jwtToken = signToken({ id: user.id, email: user.email });",
    "    res.redirect('/client-portal?verified=true&token=' + jwtToken + '&welcome=' + encodeURIComponent(user.name));",
    "  } catch (e) { res.status(500).json({ error: 'Verification failed.' }); }",
    "});",
    "",
  ];
  
  lines.splice(meetIdx2, 0, ...verify);
  console.log('Step 4 OK: verify-email added');
} else {
  console.log('Step 4 ERROR');
}

// Step 5: Add DB migration
const pragmaIdx = lines.findIndex(l => l.includes("PRAGMA journal_mode"));
if (pragmaIdx > 0) {
  const alterLines = [
    "  db.run('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0', () => {});",
    "  db.run('ALTER TABLE users ADD COLUMN verification_token TEXT', () => {});",
    "  db.run('ALTER TABLE users ADD COLUMN verification_token_expires TEXT', () => {});",
  ];
  lines.splice(pragmaIdx + 1, 0, ...alterLines);
  console.log('Step 5 OK: DB migration added');
} else {
  console.log('Step 5 WARN');
}

content = lines.join('\n');
fs.writeFileSync(serverPath, content);
console.log('DONE');
