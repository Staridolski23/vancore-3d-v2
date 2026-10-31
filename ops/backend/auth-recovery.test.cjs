const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const {installAuthRecovery}=require('./auth-recovery.cjs');
const express=createRequire(process.env.BACKEND_PACKAGE||__dirname+'/server-snapshot/backend/package.json')('express');
test('public recovery document isolates credentials, pins provider and never caches tokens',async()=>{
 const app=express();installAuthRecovery(app,{url:'https://wqvhivuyvzdbuguuojhk.supabase.co',publishableKey:'sb_publishable_synthetic'});
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 try {
  const base='http://127.0.0.1:'+server.address().port;
  const a=await fetch(base+'/auth/reset-password'),b=await fetch(base+'/auth/reset-password');
  assert.equal(a.status,200);assert.match(a.headers.get('cache-control'),/no-store/);assert.equal(a.headers.get('referrer-policy'),'no-referrer');
  const policy=a.headers.get('content-security-policy');assert.match(policy,/frame-ancestors 'none'/);assert.notEqual(policy,b.headers.get('content-security-policy'));
  const html=await a.text();assert.ok(!html.includes('__NONCE__'));assert.ok(!html.includes('__PUBLIC_CONFIG__'));
  const nonce=policy.match(/script-src 'nonce-([^']+)'/)[1];assert.equal((html.match(new RegExp('nonce="'+nonce.replace(/[+]/g,'\\+')+'"','g'))||[]).length,3);
  assert.ok(html.indexOf('replaceState')<html.indexOf('<form'));assert.ok(!html.includes('localStorage'));assert.ok(!html.includes('sessionStorage'));
  assert.equal((await fetch(base+'/auth/reset-password',{method:'POST',body:'no credentials'})).status,404);
 } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 assert.throws(()=>installAuthRecovery(express(),{url:'https://foreign.example',publishableKey:'sb_publishable_synthetic'}));
 assert.throws(()=>installAuthRecovery(express(),{url:'https://wqvhivuyvzdbuguuojhk.supabase.co',publishableKey:'service-role-secret'}));
});
