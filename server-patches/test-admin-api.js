const http = require('http');
const data = JSON.stringify({ email: 'momchil@vancore.ai', password: 'vancore2026' });
const req = http.request({
  hostname: '127.0.0.1', port: 3001, path: '/api/admin/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, (res) => {
  let body = '';
  const cookies = res.headers['set-cookie'];
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Login:', body.substring(0, 100));
    console.log('Cookies:', cookies ? 'YES' : 'NO');
    
    const dashReq = http.request({
      hostname: '127.0.0.1', port: 3001, path: '/api/admin/dashboard', method: 'GET',
      headers: { 'Cookie': cookies ? cookies.join('; ') : '' }
    }, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => console.log('Dashboard:', body2));
    });
    dashReq.end();
  });
});
req.write(data);
req.end();
