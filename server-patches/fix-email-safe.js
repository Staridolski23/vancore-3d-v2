const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
const content = fs.readFileSync(serverPath, 'utf8');

// Add a safe sendMail function after transporter creation
const marker = "  }\n});\n\n// Helper: send email with timeout";
const safeMailFn = `  }\n});\n\n// Helper: send email with timeout (non-blocking)
async function safeSendMail(mailOptions, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error('Email send timeout');
      resolve(false);
    }, timeoutMs || 5000);
    
    transporter.sendMail(mailOptions)
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch((e) => { clearTimeout(timer); console.error('Email error:', e.message); resolve(false); });
  });
}

`;

if (content.includes(marker)) {
  const updated = content.replace(marker, safeMailFn);
  fs.writeFileSync(serverPath, updated);
  console.log('OK - safeSendMail helper added');
} else {
  console.log('ERROR - marker not found');
}
