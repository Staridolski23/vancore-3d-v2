const http = require('http');

// First register to get a valid token
function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      const cookies = res.headers['set-cookie'];
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, cookies, headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function debug() {
  // Register
  const email = 'debug' + Date.now() + '@test.com';
  const regBody = JSON.stringify({ name: 'Debug', email, password: 'test123456' });
  
  const reg = await makeRequest({
    hostname: '127.0.0.1', port: 3001, path: '/api/client/register',
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(regBody) }
  }, regBody);
  
  const regData = JSON.parse(reg.body);
  console.log('Register status:', reg.status);
  console.log('Register body:', reg.body);
  
  // Check DB for verification token
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');
  
  db.get("SELECT id,email,email_verified,verification_token,verification_token_expires FROM users WHERE email = ?", [email], (err, row) => {
    console.log('\nDB record:');
    console.log('  email:', row.email);
    console.log('  email_verified:', row.email_verified);
    console.log('  verification_token:', row.verification_token);
    console.log('  verification_token_expires:', row.verification_token_expires);
    
    if (row.verification_token) {
      // Try to verify
      console.log('\nTrying verify with token:', row.verification_token);
      const verifyReq = http.request({
        hostname: '127.0.0.1', port: 3001,
        path: '/api/client/verify-email?token=' + row.verification_token,
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('Verify status:', res.statusCode);
          console.log('Verify headers:', JSON.stringify(res.headers));
          console.log('Verify body:', data.substring(0, 200));
          db.close();
        });
      });
      verifyReq.end();
    } else {
      console.log('No verification token found!');
      db.close();
    }
  });
}

debug().catch(e => console.error(e.message));
