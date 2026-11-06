const {test}=require('node:test'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const load=createRequire(process.env.BACKEND_PACKAGE||__dirname+'/server-snapshot/backend/package.json');
const {installContactMaintenance}=require('./contact-maintenance.cjs');
const fixtureBody={name:'Synthetic QA',email:'qa@example.invalid',company:'Fixture company',plan:'professional',message:'Synthetic saved enquiry'};
const adminHeaders={Authorization:'Bearer fixture-admin'};
async function fixture(options={},filename){
 const scratch=filename?null:await fs.mkdtemp(path.join(os.tmpdir(),'vancore-contact-'));
 filename=filename||path.join(scratch,'disposable.db');
 const sqlite3=load('sqlite3'),express=load('express'),db=new sqlite3.Database(filename);
 const exec=sql=>new Promise((resolve,reject)=>db.exec(sql,e=>e?reject(e):resolve()));
 const get=(sql,args=[])=>new Promise((resolve,reject)=>db.get(sql,args,(e,row)=>e?reject(e):resolve(row)));
 await exec('CREATE TABLE IF NOT EXISTS incoming_messages(id TEXT PRIMARY KEY,sender_name TEXT,sender_email TEXT,subject TEXT,message TEXT,type TEXT,reply_text TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
 const app=express();app.use(express.json());const controller=installContactMaintenance(app,db,{autoProcess:false,from:'team@example.invalid',requireAdmin:(req,res,next)=>req.get('Authorization')==='Bearer fixture-admin'?next():res.status(req.get('Authorization')?403:401).json({error:'Denied'}),...options});await controller.ready;
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base='http://127.0.0.1:'+server.address().port;
 const post=(pathname,body,headers={})=>fetch(base+pathname,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 return{filename,scratch,base,post,get,exec,controller,stop:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await controller.stop();await new Promise(resolve=>db.close(resolve));}};
}
async function cleanup(scratch){assert.ok(scratch.startsWith(path.join(os.tmpdir(),'vancore-contact-')));await fs.rm(scratch,{recursive:true,force:true});}

test('contact saves atomically, rejects spoofed chat/header fields and preserves incoming enquiries on failure',async()=>{
 let sends=0;const f=await fixture({deliveryEnabled:false,notify:async()=>{sends++;}});
 try{
  for(const body of [{...fixtureBody,email:'a@b@c.com'},{...fixtureBody,name:'Name\r\nBcc: other@example.invalid'},{...fixtureBody,message:{}},{...fixtureBody,subject:'x'.repeat(201)}])assert.equal((await f.post('/api/contact',body)).status,400);
  const r=await f.post('/api/contact',{...fixtureBody,type:'client_chat',userId:'foreign',userEmail:'victim@example.invalid'});assert.equal(r.status,201);const id=(await r.json()).id;
  const saved=await f.get('SELECT * FROM incoming_messages WHERE id=?',[id]);assert.equal(saved.type,'contact');assert.equal(saved.sender_email,fixtureBody.email);assert.ok(saved.message.includes('Selected plan: professional'));
  assert.equal((await f.get('SELECT status FROM vancore_contact_deliveries WHERE message_id=?',[id])).status,'queued');assert.equal(sends,0);
  assert.equal((await fetch(f.base+'/api/incoming')).status,401);assert.equal((await fetch(f.base+'/api/incoming',{headers:{Authorization:'Bearer fixture-client'}})).status,403);
  const inbox=await(await fetch(f.base+'/api/incoming',{headers:adminHeaders})).json();assert.equal(inbox[0].id,id);assert.equal(inbox[0].notification_status,'queued');
  await f.exec("CREATE TRIGGER fail_queue BEFORE INSERT ON vancore_contact_deliveries BEGIN SELECT RAISE(ABORT,'Synthetic queue outage'); END;");
  assert.equal((await f.post('/api/contact',fixtureBody)).status,503);assert.equal((await f.get('SELECT count(*) AS n FROM incoming_messages')).n,1);
 }finally{await f.stop();await cleanup(f.scratch);}
});

test('notification failure survives restart, uses bounded retries and never resends a completed job',async()=>{
 let tick=1000000,attempts=0;
 const f=await fixture({deliveryEnabled:true,now:()=>tick,notify:async()=>{attempts++;throw Object.assign(Error('Private server details must not be saved'),{code:'ETIMEDOUT'});}});
 const filename=f.filename,scratch=f.scratch;let id;
 try{
  id=(await(await f.post('/api/contact',fixtureBody)).json()).id;
  for(let i=0;i<5;i++){await f.controller.processPending();tick+=3600001;}
  assert.equal(attempts,5);const failed=await f.get('SELECT * FROM vancore_contact_deliveries WHERE message_id=?',[id]);assert.equal(failed.status,'failed');assert.equal(failed.last_error_code,'ETIMEDOUT');assert.equal(failed.attempts,5);assert.ok(!JSON.stringify(failed).includes('Private server details'));
  await f.controller.processPending();assert.equal(attempts,5);
 }finally{await f.stop();}
 const delivered=[];const restarted=await fixture({deliveryEnabled:true,now:()=>tick,notify:async mail=>{delivered.push(mail);}},filename);
 try{
  assert.equal((await restarted.get('SELECT status FROM vancore_contact_deliveries WHERE message_id=?',[id])).status,'failed');
  assert.equal((await restarted.post('/api/maintenance/contact-notifications/'+id+'/retry',{},adminHeaders)).status,200);
  await Promise.all([restarted.controller.processPending(),restarted.controller.processPending()]);assert.equal(delivered.length,1);
  assert.equal(delivered[0].to,'team@example.invalid');assert.equal(delivered[0].replyTo,fixtureBody.email);assert.equal(delivered[0].html,undefined);assert.ok(delivered[0].messageId.includes(id));
  assert.equal((await restarted.get('SELECT status FROM vancore_contact_deliveries WHERE message_id=?',[id])).status,'sent');
  assert.equal((await restarted.post('/api/maintenance/contact-notifications/'+id+'/retry',{},adminHeaders)).status,409);
  await restarted.controller.processPending();assert.equal(delivered.length,1);
 }finally{await restarted.stop();await cleanup(scratch);}
});

test('worker recovers an abandoned lease and cancels a removed enquiry without sending',async()=>{
 let tick=1000000,sends=0;const f=await fixture({deliveryEnabled:true,now:()=>tick,notify:async()=>{sends++;}});
 try{
  const id=(await(await f.post('/api/contact',fixtureBody)).json()).id;
  await f.exec("UPDATE vancore_contact_deliveries SET status='processing',attempts=1,locked_at=1");
  await f.controller.processPending();assert.equal(sends,1);assert.equal((await f.get('SELECT attempts FROM vancore_contact_deliveries WHERE message_id=?',[id])).attempts,2);
  const second=(await(await f.post('/api/contact',fixtureBody)).json()).id;await f.exec("DELETE FROM incoming_messages WHERE id='"+second+"'");
  await f.controller.processPending();assert.equal(sends,1);assert.equal((await f.get('SELECT status FROM vancore_contact_deliveries WHERE message_id=?',[second])).status,'cancelled');
 }finally{await f.stop();await cleanup(f.scratch);}
});
