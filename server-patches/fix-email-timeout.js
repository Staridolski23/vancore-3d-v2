const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const content = fs.readFileSync(serverPath, 'utf8');

// Replace the transporter.sendMail in register endpoint with a timeout version
const oldSendMail = `    try {
      const verifyUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + verificationToken;
      await transporter.sendMail({
        from: '"VANCORE" <hello@vancoresys.com>',
        to: email,
        subject: 'Verify your email - VANCORE',
        html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome, ' + (name || 'User') + '!</h1><p>Please verify your email.</p><a href="' + verifyUrl + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></div>',
      });
    } catch(e) { console.error('Email error:', e.message); }`;

const newSendMail = `    // Send verification email (non-blocking)
    const verifyUrl = 'https://www.vancoresys.com/api/client/verify-email?token=' + verificationToken;
    transporter.sendMail({
      from: '"VANCORE" <hello@vancoresys.com>',
      to: email,
      subject: 'Verify your email - VANCORE',
      html: '<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px"><h1>Welcome, ' + (name || 'User') + '!</h1><p>Please verify your email.</p><a href="' + verifyUrl + '" style="display:inline-block;padding:12px 24px;background:#991930;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></div>',
    }).catch(e => console.error('Email error:', e.message));`;

if (content.includes(oldSendMail)) {
  const updated = content.replace(oldSendMail, newSendMail);
  fs.writeFileSync(serverPath, updated);
  console.log('OK - email send updated to non-blocking');
} else {
  console.log('ERROR - old sendMail not found');
}
