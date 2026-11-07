const {test}=require('node:test');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const {createRequire}=require('node:module');const backend=require('node:path').dirname(process.env.BACKEND_PACKAGE || __dirname+'/server-snapshot/backend/package.json');
const req=createRequire(backend+'/package.json');
const jwt=req('jsonwebtoken');const express=req('express');
const {createSupabaseVerifier,createApiSecurity}=require('./backend-auth.cjs');
const id='00000000-0000-4000-8000-000000000001';

test('verifier reuses only the existing public config for the same project',async()=>{
 const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
 const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'vancore-role-config-'));
 try{
  await fs.copyFile(path.join(__dirname,'backend-auth.cjs'),path.join(scratch,'backend-auth.cjs'));
  const config=path.join(scratch,'auth-recovery-config.json');
  await fs.writeFile(config,JSON.stringify({url:'https://project.supabase.co',publishableKey:'sb_publishable_fixture'}));
  const factory=require(path.join(scratch,'backend-auth.cjs')).createSupabaseVerifier;
  assert.equal(typeof factory({projectUrl:'https://project.supabase.co'}),'function');
  assert.throws(()=>factory({projectUrl:'https://other.supabase.co'}));
  await fs.writeFile(config,JSON.stringify({url:'https://project.supabase.co',publishableKey:'sb_secret_must_not_be_used'}));
  assert.throws(()=>factory({projectUrl:'https://project.supabase.co'}));
 }finally{assert.ok(scratch.startsWith(path.join(os.tmpdir(),'vancore-role-config-')));await fs.rm(scratch,{recursive:true,force:true});}
});

test('temporary key-service outages are distinguished from invalid client tokens',async()=>{
 const {privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const token=jwt.sign({sub:id,role:'authenticated',email:'client@example.invalid'},privateKey,{algorithm:'ES256',keyid:'fixture',issuer:'https://project.supabase.co/auth/v1',audience:'authenticated',expiresIn:60});
 for(const fetchKeys of [async()=>{throw Error('Network outage');},async()=>Response.json({error:'Unavailable'},{status:503}),async()=>Response.json({keys:[]})]){
  await assert.rejects(createSupabaseVerifier({projectUrl:'https://project.supabase.co',publishableKey:'sb_publishable_fixture',fetchKeys})(token),e=>e.code==='AUTH_VERIFICATION_UNAVAILABLE');
 }
 const app=express();let unavailable=true;
 const security=createApiSecurity({db:{},enforce:()=>true,verify:async()=>{throw Object.assign(Error('Fixture'),{code:unavailable?'AUTH_VERIFICATION_UNAVAILABLE':'INVALID_TOKEN'});}});
 app.use(security.middleware);app.get('/admin-fixture',security.requireAdmin,(_req,res)=>res.json({secret:'must never return'}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port,headers={Authorization:'Bearer fixture'};
 try{
  assert.equal((await fetch(base+'/api/bookings',{headers})).status,503);
  assert.equal((await fetch(base+'/admin-fixture',{headers})).status,503);
  assert.equal((await fetch(base+'/api/bookings')).status,401);
  unavailable=false;assert.equal((await fetch(base+'/api/bookings',{headers})).status,401);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('Supabase tokens require a trusted asymmetric signature, issuer, audience and expiry',async()=>{
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const jwk={...publicKey.export({format:'jwk'}),kid:'test',alg:'ES256'};let calls=0;
 const verify=createSupabaseVerifier({projectUrl:'https://project.supabase.co',publishableKey:'sb_publishable_fixture',fetchRole:async()=>Response.json([{id,role:'client'}]),fetchKeys:async()=>{calls++;return Response.json({keys:[jwk]});}});
 const sign=(overrides={},options={})=>jwt.sign({sub:id,role:'authenticated',email:'client@example.com',...overrides},privateKey,{algorithm:'ES256',keyid:'test',issuer:'https://project.supabase.co/auth/v1',audience:'authenticated',expiresIn:60,...options});
 assert.equal((await verify(sign())).email,'client@example.com');assert.equal((await verify(sign())).isAdmin,false);assert.equal(calls,1);
 await assert.rejects(verify(sign({},{issuer:'https://attacker.example/auth/v1'})));
 await assert.rejects(verify(sign({},{audience:'wrong'})));
 await assert.rejects(verify(sign({},{expiresIn:-60})));
 await assert.rejects(verify(sign({role:'service_role'})));
 await assert.rejects(verify(jwt.sign({sub:id,role:'authenticated',email:'office@vancoresys.com'},'forged-secret',{algorithm:'HS256',keyid:'test'})));
});
test('backend role authority follows protected profiles, ignores editable metadata and fails closed on profile outages',async()=>{
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 const jwk={...publicKey.export({format:'jwk'}),kid:'role-test',alg:'ES256'};let role='client',unavailable=false,calls=0;
 const verify=createSupabaseVerifier({projectUrl:'https://project.supabase.co',publishableKey:'sb_publishable_fixture',fetchKeys:async()=>Response.json({keys:[jwk]}),fetchRole:async(url,init)=>{
  calls++;assert.equal(url,'https://project.supabase.co/rest/v1/users?select=id,role&id=eq.'+id);assert.ok(init.headers.Authorization.startsWith('Bearer '));assert.equal(init.headers.apikey,'sb_publishable_fixture');assert.equal(init.redirect,'error');
  if(unavailable)return Response.json({error:'Unavailable'},{status:503});return Response.json(role===null?[]:[{id,role}]);
 }});
 const sign=email=>jwt.sign({sub:id,role:'authenticated',email,user_metadata:{role:'admin'},app_metadata:{role:'admin'}},privateKey,{algorithm:'ES256',keyid:'role-test',issuer:'https://project.supabase.co/auth/v1',audience:'authenticated',expiresIn:60});
 assert.equal((await verify(sign('office@vancoresys.com'))).isAdmin,false);
 role='admin';const token=sign('team@example.invalid');assert.equal((await verify(token)).isAdmin,true);
 role='consultant';assert.equal((await verify(token)).isAdmin,false);role='client';assert.equal((await verify(token)).isAdmin,false);assert.equal(calls,4);
 unavailable=true;await assert.rejects(verify(token),e=>e.code==='AUTH_VERIFICATION_UNAVAILABLE');
 unavailable=false;role=null;await assert.rejects(verify(token),e=>e.code==='AUTH_VERIFICATION_UNAVAILABLE');
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
