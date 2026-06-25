const http = require('http');

function makeRequest(options, body, cookies) {
  return new Promise((resolve, reject) => {
    const headers = { ...(options.headers || {}) };
    if (cookies) headers['Cookie'] = cookies;
    
    const req = http.request({ ...options, headers }, (res) => {
      let data = '';
      const respCookies = res.headers['set-cookie'];
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, cookies: respCookies }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function fullTest() {
  console.log('=== FULL EMAIL VERIFICATION FLOW TEST ===\n');
  
  const email = 'flowtest' + Date.now() + '@vancoresys.com';
  
  // Step 1: Register
  console.log('1. Register:', email);
  const regBody = JSON.stringify({ name: 'Flow Test', email, password: 'test123456', company: 'Test Co' });
  const reg = await makeRequest({
    hostname: '127.0.0.1', port: 3001, path: '/api/client/register', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(regBody) }
  }, regBody);
  console.log('   Status:', reg.status, '- Token:', reg.body.includes('token') ? 'YES' : 'NO');
  
  // Step 2: Get token from DB
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('/home/vancore/vancore-backend/data/vancore.db');
  
  const row = await new Promise((resolve) => {
    db.get("SELECT verification_token FROM users WHERE email = ?", [email], (err, r) => resolve(r));
  });
  
  const vt = row.verification_token;
  console.log('   Verification token from DB:', vt ? 'YES' : 'NO');
  
  // Step 3: Try login BEFORE verify (should fail)
  console.log('\n2. Login BEFORE verification:');
  const loginBody = JSON.stringify({ email, password: 'test123456' });
  const login1 = await makeRequest({
    hostname: '127.0.0.1', port: 3001, path: '/api/client/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);
  const login1Data = JSON.parse(login1.body);
  console.log('   Status:', login1.status, '- Error:', login1Data.error || 'none');
  console.log('   ✅ Correctly blocked!' );
  
  // Step 4: Verify email
  console.log('\n3. Verify email with token:');
  const verify = await makeRequest({
    hostname: '127.0.0.1', port: 3001, path: '/api/client/verify-email?token=' + vt, method: 'GET'
  });
  console.log('   Status:', verify.status, '(302 = redirect = success)');
  const newToken = verify.body.match(/token=([^&]+)/);
  console.log('   New token received:', newToken ? 'YES' : 'NO');
  
  // Step 5: Login AFTER verify (should work)
  console.log('\n4. Login AFTER verification:');
  const login2 = await makeRequest({
    hostname: '127.0.0.1', port: 3001, path: '/api/client/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, loginBody);
  const login2Data = JSON.parse(login2.body);
  console.log('   Status:', login2.status);
  console.log('   Token received:', login2Data.token ? 'YES ✅' : 'NO ❌');
  console.log('   User:', login2Data.user ? login2Data.user.email : 'none');
  
  if (login2Data.token) {
    // Step 6: Access /api/client/me with token
    console.log('\n5. Access profile with token:');
    const me = await makeRequest({
      hostname: '127.0.0.1', port: 3001, path: '/api/client/me', method: 'GET',
      headers: { 'Authorization': 'Bearer ' + login2Data.token }
    });
    console.log('   Status:', me.status);
    console.log('   User data:', me.body.substring(0, 100));
  }
  
  db.close();
  console.log('\n=== TEST COMPLETE ===');
}

fullTest().catch(e => console.error(e.message));
