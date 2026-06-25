const http = require('http');

const loginData = JSON.stringify({ email: 'momchil@vancore.ai', password: 'vancore2026' });
const loginOptions = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  const cookies = res.headers['set-cookie'];
  
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Login:', data);
    
    if (cookies) {
      // Access dashboard with session
      const dashOptions = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/admin/dashboard',
        method: 'GET',
        headers: { 'Cookie': cookies.join('; ') }
      };
      
      const dashReq = http.request(dashOptions, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => data2 += chunk);
        res2.on('end', () => console.log('Dashboard:', data2));
      });
      dashReq.end();
    }
  });
});

loginReq.write(loginData);
loginReq.end();
