'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
function installPortalMaintenance(app,db,security,baseDir) {
 const get=(sql,params)=>new Promise((resolve,reject)=>db.get(sql,params,(error,row)=>error?reject(error):resolve(row)));
 const all=(sql,params)=>new Promise((resolve,reject)=>db.all(sql,params,(error,rows)=>error?reject(error):resolve(rows)));
 const run=(sql,params)=>new Promise((resolve,reject)=>db.run(sql,params,error=>error?reject(error):resolve()));
 async function user(req,res){const principal=await security.principal(req);if(!principal)res.status(401).json({error:'Unauthorized'});return principal;}
 function filenameValid(name){return typeof name==='string'&&name.length<=200&&!name.startsWith('.')&&path.basename(name)===name&&!/[\\/\x00-\x1f]/.test(name);}
 function localFile(name,folders){
  if(!filenameValid(name))return null;
  for(const folder of folders){
   const root=path.resolve(baseDir,folder),candidate=path.join(root,name);
   try{const real=fs.realpathSync(candidate);if(real.startsWith(root+path.sep)&&fs.statSync(real).isFile())return real;}catch{}
  }
  return null;
 }
 app.get('/api/documents/:filename',async(req,res)=>{
  try{
   const principal=await user(req,res);if(!principal)return;
   const name=req.params.filename;if(!filenameValid(name))return res.status(400).json({error:'Invalid filename'});
   const document=await get('SELECT client_email,client_id,mime_type FROM documents WHERE filename=?',[name]);
   if(!document)return res.status(404).json({error:'Document not found'});
   if(!principal.isAdmin&&String(document.client_email).toLowerCase()!==principal.email&&document.client_id!==principal.id)return res.status(403).json({error:'Access denied'});
   const file=localFile(name,['documents','uploads']);if(!file)return res.status(404).json({error:'Document file is not available'});
   res.set({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(name)});
   res.sendFile(file);
  }catch{res.status(500).json({error:'Unable to download document'});}
 });
 app.get('/uploads/:filename',async(req,res)=>{
  try{
   const name=req.params.filename;
   // A document, even an image, must never be served through the public media route.
   if(await get('SELECT id FROM documents WHERE filename=?',[name]))return res.sendStatus(404);
   const file=localFile(name,['uploads']);if(!file)return res.sendStatus(404);
   const fd=fs.openSync(file,'r'),bytes=Buffer.alloc(16);try{fs.readSync(fd,bytes,0,16,0);}finally{fs.closeSync(fd);}
   let type=null;
   if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';
   else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)type='image/jpeg';
   else if(['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)))type='image/gif';
   else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')type='image/webp';
   if(!type)return res.sendStatus(415);
   res.set({'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=3600'});res.sendFile(file);
  }catch{res.sendStatus(500);}
 });
 app.get('/api/chat/:userId',async(req,res)=>{
  try{
   const principal=await user(req,res);if(!principal)return;
   if(req.params.userId!==principal.id)return res.status(403).json({error:'Access denied'});
   const rows=await all("SELECT id,message,reply_text,created_at FROM incoming_messages WHERE sender_email=? AND type='client_chat' ORDER BY created_at ASC LIMIT 200",[principal.email]);
   const messages=rows.flatMap(row=>[{id:row.id,role:'user',content:row.message,created_at:row.created_at},...(row.reply_text?[{id:row.id+'-reply',role:'support',content:row.reply_text}]:[])]);
   res.set('Cache-Control','no-store');res.json({messages});
  }catch{res.status(500).json({error:'Unable to load messages'});}
 });
 app.post('/api/chat/send',async(req,res)=>{
  try{
   const principal=await user(req,res);if(!principal)return;
   const message=req.body.message;if(typeof message!=='string'||!message.trim()||message.length>20000)return res.status(400).json({error:'A message is required'});
   const id=crypto.randomUUID();
   await run("INSERT INTO incoming_messages(id,sender_name,sender_email,subject,message,type) VALUES(?,?,?,?,?,?)",[id,principal.email,principal.email,'Client portal message',message.trim(),'client_chat']);
   res.json({success:true,id,reply:'Your message has been recorded. Our team will respond shortly.'});
  }catch{res.status(500).json({error:'Message could not be recorded'});}
 });
}
module.exports={installPortalMaintenance};
