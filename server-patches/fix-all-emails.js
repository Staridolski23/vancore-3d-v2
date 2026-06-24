const fs = require('fs');

const serverPath = '/home/vancore/vancore-backend/server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Add safeSendMail function after transporter line
const marker = "  }\n});\n";
let insertIdx = content.indexOf("  }\n});\n", content.indexOf("const transporter"));
if (insertIdx > 0) {
  const safeMailCode = `
// Helper: send email with timeout (non-blocking)
async function safeSendMail(mailOptions) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error('Email send timeout');
      resolve(false);
    }, 5000);
    transporter.sendMail(mailOptions)
      .then(() => { clearTimeout(timer); resolve(true); })
      .catch((e) => { clearTimeout(timer); console.error('Email error:', e.message); resolve(false); });
  });
}

`;
  content = content.substring(0, insertIdx + 5) + safeMailCode + content.substring(insertIdx + 5);
  
  // Replace all 3 await transporter.sendMail with await safeSendMail
  content = content.replace(/await transporter\.sendMail\(/g, 'await safeSendMail(');
  
  fs.writeFileSync(serverPath, content);
  console.log('OK - safeSendMail added and 3 sendMail calls updated');
} else {
  console.log('ERROR - could not find transporter block end');
}
