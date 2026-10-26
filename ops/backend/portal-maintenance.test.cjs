const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createRequire}=require('node:module');
const req=createRequire(process.env.BACKEND_PACKAGE||__dirname+'/server-snapshot/backend/package.json');
const {installPortalMaintenance}=require('./portal-maintenance.cjs');
test('portal downloads enforce ownership, media hides documents, and chat trusts verified identity',async()=>{
 const sqlite3=req('sqlite3'),express=req('express'),db=new sqlite3.Database(':memory:');
 const run=sql=>new Promise((resolve,reject)=>db.run(sql,error=>error?reject(error):resolve()));
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'vancore-portal-'));
 await fs.mkdir(path.join(root,'uploads'));await fs.mkdir(path.join(root,'documents'));
 const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0,0,0,0,0]);
 await fs.writeFile(path.join(root,'uploads','public.png'),png);await fs.writeFile(path.join(root,'uploads','private.png'),png);
 await fs.writeFile(path.join(root,'uploads','unsafe.html'),'<script>alert(1)</script>');
 await fs.writeFile(path.join(root,'documents','report.pdf'),'private report');
 await run('CREATE TABLE documents(id INTEGER,filename TEXT,client_email TEXT,client_id TEXT,mime_type TEXT)');
 await run("INSERT INTO documents VALUES(1,'report.pdf','one@example.com','one','application/pdf'),(2,'private.png','two@example.com','two','image/png')");
 await run('CREATE TABLE incoming_messages(id TEXT,sender_name TEXT,sender_email TEXT,subject TEXT,message TEXT,type TEXT,reply_text TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP)');
 const app=express();app.use(express.json());
 installPortalMaintenance(app,db,{principal:async r=>r.get('Authorization')==='Bearer one'?{id:'one',email:'one@example.com',isAdmin:false}:null},root);
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base='http://127.0.0.1:'+server.address().port,headers={Authorization:'Bearer one'};
 try{
  assert.equal((await fetch(base+'/api/documents/report.pdf')).status,401);
  const own=await fetch(base+'/api/documents/report.pdf',{headers});assert.equal(own.status,200);assert.equal(await own.text(),'private report');assert.equal(own.headers.get('cache-control'),'private, no-store');
  assert.equal((await fetch(base+'/api/documents/private.png',{headers})).status,403);
  assert.equal((await fetch(base+'/uploads/private.png')).status,404);
  assert.equal((await fetch(base+'/uploads/unsafe.html')).status,415);
  assert.equal((await fetch(base+'/uploads/public.png')).headers.get('content-type'),'image/png');
  assert.equal((await fetch(base+'/api/documents/.hidden',{headers})).status,400);
  assert.equal((await fetch(base+'/api/chat/two',{headers})).status,403);
  const sent=await fetch(base+'/api/chat/send',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Test message',userEmail:'two@example.com'})});assert.equal(sent.status,200);
  const history=await(await fetch(base+'/api/chat/one',{headers})).json();assert.equal(history.messages.length,1);assert.equal(history.messages[0].content,'Test message');
  const foreign=await new Promise((resolve,reject)=>db.get("SELECT COUNT(*) AS total FROM incoming_messages WHERE sender_email='two@example.com'",(e,r)=>e?reject(e):resolve(r)));assert.equal(foreign.total,0);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>db.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
