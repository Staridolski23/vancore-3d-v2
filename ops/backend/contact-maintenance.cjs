'use strict';
const crypto=require('node:crypto'),path=require('node:path');
const {contactInput}=require('./contact-input.cjs');

function installContactMaintenance(app,db,options={}) {
 const sqlite3=require('sqlite3'),queueDb=options.queueDb||new sqlite3.Database(path.resolve(db.filename));
 queueDb.configure('busyTimeout',5000);
 const run=(sql,args=[])=>new Promise((resolve,reject)=>queueDb.run(sql,args,function(e){e?reject(e):resolve({changes:this.changes});}));
 const get=(sql,args=[])=>new Promise((resolve,reject)=>queueDb.get(sql,args,(e,r)=>e?reject(e):resolve(r)));
 const all=(sql,args=[])=>new Promise((resolve,reject)=>queueDb.all(sql,args,(e,r)=>e?reject(e):resolve(r)));
 const now=options.now||Date.now;let tail=Promise.resolve(),worker=null,timer=null;
 const serial=fn=>{const work=tail.then(fn);tail=work.catch(()=>{});return work;};
 const ready=(async()=>{
  await run("CREATE TABLE IF NOT EXISTS vancore_contact_deliveries(message_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','sent','failed','cancelled')),attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at INTEGER NOT NULL DEFAULT 0,locked_at INTEGER,last_error_code TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)");
  await run('CREATE INDEX IF NOT EXISTS vancore_contact_delivery_due ON vancore_contact_deliveries(status,next_attempt_at,created_at)');
 })();
 // Keep a failed initialization fail-closed for requests, without an unhandled
 // rejection terminating the otherwise healthy API before its first request.
 ready.catch(()=>{});
 const guard=options.requireAdmin||((_req,res)=>res.status(401).json({error:'Unauthorized'}));
 const enabled=options.deliveryEnabled===true;
 let notify=options.notify;
 if(enabled&&!notify) {
  const host=process.env.ZOHO_SMTP_HOST||'smtp.zoho.com',port=Number(process.env.ZOHO_SMTP_PORT||587);
  if(!['smtp.zoho.com','smtp.zoho.eu','smtppro.zoho.com','smtppro.zoho.eu'].includes(host)||![465,587].includes(port))throw Error('Unreviewed notification SMTP destination');
  const transport=require('nodemailer').createTransport({host,port,secure:port===465,requireTLS:port===587,auth:{user:process.env.ZOHO_EMAIL,pass:process.env.ZOHO_PASSWORD},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
  notify=mail=>transport.sendMail(mail);
 }

 app.post('/api/contact',async(req,res)=>{
  const input=contactInput(req.body,10500);
  if(!input)return res.status(400).json({error:'A valid name, email, subject and message are required'});
  const id=crypto.randomUUID();
  try {
   await ready;
   await serial(async()=>{
    let transaction=false;
    try {
     await run('BEGIN IMMEDIATE');transaction=true;
     await run("INSERT INTO incoming_messages(id,sender_name,sender_email,subject,message,type) VALUES(?,?,?,?,?,'contact')",[id,input.sender_name,input.sender_email,input.subject,input.message]);
     await run('INSERT INTO vancore_contact_deliveries(message_id,created_at,updated_at) VALUES(?,?,?)',[id,now(),now()]);
     await run('COMMIT');transaction=false;
    }catch(e){if(transaction)await run('ROLLBACK').catch(()=>{});throw e;}
   });
   res.status(201).json({success:true,id,notification:'queued'});
   if(enabled&&options.autoProcess!==false)void processPending().catch(()=>{});
  }catch {res.status(503).json({error:'Your enquiry could not be recorded. Please try again.'});}
 });

 app.get('/api/incoming',guard,async(req,res)=>{
  try {await ready;const rows=await serial(()=>all('SELECT i.*,d.status AS notification_status,d.attempts AS notification_attempts,d.last_error_code AS notification_error_code FROM incoming_messages i LEFT JOIN vancore_contact_deliveries d ON d.message_id=i.id ORDER BY i.created_at DESC,i.id DESC LIMIT 100'));res.set('Cache-Control','no-store');res.json(rows);}catch{res.status(503).json({error:'Incoming enquiries are temporarily unavailable'});}
 });

 app.post('/api/maintenance/contact-notifications/:id/retry',guard,async(req,res)=>{
  try {
   await ready;
   const result=await serial(()=>run("UPDATE vancore_contact_deliveries SET status='queued',attempts=0,next_attempt_at=0,locked_at=NULL,last_error_code=NULL,updated_at=? WHERE message_id=? AND status='failed' AND EXISTS(SELECT 1 FROM incoming_messages WHERE id=message_id)",[now(),req.params.id]));
   if(!result.changes)return res.status(409).json({error:'Only a failed notification for an existing enquiry can be retried'});
   res.json({success:true});
   if(enabled&&options.autoProcess!==false)void processPending().catch(()=>{});
  }catch{res.status(503).json({error:'Notification could not be queued'});}
 });

 function processPending() {
  if(!enabled||typeof notify!=='function')return Promise.resolve({processed:false,reason:'delivery_disabled'});
  if(worker)return worker;
  worker=(async()=>{
   await ready;
   const job=await serial(async()=>{
    const tick=now();
    await run("UPDATE vancore_contact_deliveries SET status=CASE WHEN attempts>=5 THEN 'failed' ELSE 'queued' END,locked_at=NULL,updated_at=? WHERE status='processing' AND locked_at<?",[tick,tick-600000]);
    const candidate=await get("SELECT d.*,i.sender_name,i.sender_email,i.subject,i.message FROM vancore_contact_deliveries d LEFT JOIN incoming_messages i ON i.id=d.message_id WHERE d.status='queued' AND d.next_attempt_at<=? ORDER BY d.created_at,d.message_id LIMIT 1",[tick]);
    if(!candidate)return null;
    const claimed=await run("UPDATE vancore_contact_deliveries SET status='processing',attempts=attempts+1,locked_at=?,updated_at=? WHERE message_id=? AND status='queued'",[tick,tick,candidate.message_id]);
    return claimed.changes?{...candidate,attempts:candidate.attempts+1,locked_at:tick}:null;
   });
   if(!job)return{processed:false};
   let status='sent',code=null,next=0;
   if(!job.sender_email){status='cancelled';code='SOURCE_REMOVED';}
   else try {
    const from=options.from||process.env.ZOHO_EMAIL;
    if(typeof from!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from))throw Object.assign(Error('SMTP configuration unavailable'),{code:'SMTP_NOT_CONFIGURED'});
    await notify({from,to:from,replyTo:job.sender_email,messageId:'<vancore-enquiry-'+job.message_id+'@vancoresys.com>',subject:'[VANCORE] '+job.subject,text:'From: '+job.sender_name+' <'+job.sender_email+'>\n\n'+job.message});
   }catch(e){status=job.attempts>=5?'failed':'queued';code=typeof e.code==='string'&&/^[A-Z0-9_]{1,50}$/.test(e.code)?e.code:'DELIVERY_FAILED';next=now()+Math.min(3600000,60000*2**(job.attempts-1));}
   await serial(()=>run("UPDATE vancore_contact_deliveries SET status=?,last_error_code=?,next_attempt_at=?,locked_at=NULL,updated_at=? WHERE message_id=? AND status='processing' AND locked_at=? AND attempts=?",[status,code,next,now(),job.message_id,job.locked_at,job.attempts]));
   return{processed:true,status};
  })().finally(()=>{worker=null;});return worker;
 }
 if(enabled&&options.autoProcess!==false){timer=setInterval(()=>void processPending().catch(()=>{}),60000);timer.unref();}
 return{ready,processPending,stop:async()=>{if(timer)clearInterval(timer);if(worker)await worker;await tail;if(!options.queueDb)await new Promise(resolve=>queueDb.close(resolve));}};
}
module.exports={installContactMaintenance};
