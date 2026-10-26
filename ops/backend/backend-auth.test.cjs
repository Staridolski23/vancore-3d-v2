const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const {createRequire}=require('node:module');const backend=require('node:path').dirname(process.env.BACKEND_PACKAGE || __dirname+'/server-snapshot/backend/package.json');
const req=createRequire(backend+'/package.json');
const jwt=req('jsonwebtoken');const express=req('express');
const {createSupabaseVerifier,createApiSecurity}=require('./backend-auth.cjs');
const id='00000000-0000-4000-8000-000000000001';
test('Supabase tokens require a trusted asymmetric signature, issuer, audience and expiry',async()=>{
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const jwk={...publicKey.export({format:'jwk'}),kid:'test',alg:'ES256'};let calls=0;
 const verify=createSupabaseVerifier({projectUrl:'https://project.supabase.co',fetchKeys:async()=>{calls++;return Response.json({keys:[jwk]});}});
 const sign=(overrides={},options={})=>jwt.sign({sub:id,role:'authenticated',email:'client@example.com',...overrides},privateKey,{algorithm:'ES256',keyid:'test',issuer:'https://project.supabase.co/auth/v1',audience:'authenticated',expiresIn:60,...options});
 assert.equal((await verify(sign())).email,'client@example.com');assert.equal((await verify(sign())).isAdmin,false);assert.equal(calls,1);
 await assert.rejects(verify(sign({},{issuer:'https://attacker.example/auth/v1'})));
 await assert.rejects(verify(sign({},{audience:'wrong'})));
 await assert.rejects(verify(sign({},{expiresIn:-60})));
 await assert.rejects(verify(sign({role:'service_role'})));
 await assert.rejects(verify(jwt.sign({sub:id,role:'authenticated',email:'office@vancoresys.com'},'forged-secret',{algorithm:'HS256',keyid:'test'})));
});
test('direct backend requests cannot bypass ownership or administrator checks',async()=>{
 const app=express();app.use(express.json());
 const db={get(sql,params,cb){cb(null,{email:'owner@example.com'});}};
 const security=createApiSecurity({enforce:()=>true,db,verify:async token=>{
  if(token==='owner')return{id,email:'owner@example.com',isAdmin:false};
  if(token==='admin')return{id,email:'office@vancoresys.com',isAdmin:true};
  throw Error('invalid');
 }});
 app.use(security.middleware);
 app.get('/api/settings',(r,s)=>s.json({ok:true}));
 app.get('/api/documents',(r,s)=>s.json(r.query));
 app.get('/api/reviews',(r,s)=>s.json(r.query));
 app.put('/api/bookings/:id',(r,s)=>s.json({ok:true}));
 app.post('/api/bookings',(r,s)=>s.json(r.body));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port;
 const auth=t=>({headers:{Authorization:'Bearer '+t}});
 try{
  assert.equal((await fetch(base+'/api/settings')).status,401);
  assert.equal((await fetch(base+'/api/settings',auth('owner'))).status,403);
  assert.equal((await fetch(base+'/api/settings',auth('admin'))).status,200);
  let r=await fetch(base+'/api/documents?client_email=victim@example.com',auth('owner'));assert.equal((await r.json()).client_email,'owner@example.com');
  r=await fetch(base+'/api/reviews?status=pending_approval&user_id=victim');assert.deepEqual(await r.json(),{status:'published'});
  r=await fetch(base+'/api/reviews?status=published&user_id=victim',auth('owner'));assert.deepEqual(await r.json(),{user_id:id});
  assert.equal((await fetch(base+'/api/bookings/1',{method:'PUT',...auth('owner')})).status,200);
  assert.equal((await fetch(base+'/api/bookings/1',{method:'PUT',...auth('forged')})).status,401);
  r=await fetch(base+'/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'someone@example.com',client_id:'forged'})});assert.equal((await r.json()).client_id,'');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
