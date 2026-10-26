const {test}=require('node:test');const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const req=createRequire(process.env.BACKEND_PACKAGE || __dirname+'/server-snapshot/backend/package.json');
const {installContentMaintenance}=require('./content-maintenance.cjs');
test('content editor requires server credentials, round-trips updates, and blocks prototype pollution',async()=>{
 const sqlite3=req('sqlite3'),express=req('express');const db=new sqlite3.Database(':memory:');
 const run=sql=>new Promise((resolve,reject)=>db.run(sql,error=>error?reject(error):resolve()));
 await run('CREATE TABLE site_content(id INTEGER PRIMARY KEY,section TEXT,key TEXT,value TEXT,type TEXT,updated_at TEXT)');
 await run('CREATE TABLE client_reviews(id TEXT,status TEXT,published_at TEXT)');
 await run("INSERT INTO client_reviews VALUES('one','pending_approval',NULL)");
 process.env.VANCORE_BACKEND_KEY='a'.repeat(64);
 const app=express();app.use(express.json());installContentMaintenance(app,db,()=>({hero:{title:'Original'}}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});const base='http://127.0.0.1:'+server.address().port;
 const opts=body=>({method:'PUT',headers:{'Content-Type':'application/json','X-Vancore-Backend-Key':process.env.VANCORE_BACKEND_KEY},body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(base+'/api/maintenance/content')).status,401);
  assert.equal((await fetch(base+'/api/maintenance/content',opts({id:'hero:title',value:'Updated'}))).status,200);
  assert.equal((await(await fetch(base+'/api/content')).json()).sections.hero.title,'Updated');
  assert.equal((await fetch(base+'/api/maintenance/content',opts({section:'__proto__',key:'polluted',value:'yes'}))).status,400);
  const o=opts({status:'published'});o.method='PATCH';
  assert.equal((await fetch(base+'/api/reviews/one',o)).status,200);
  assert.equal((await fetch(base+'/api/reviews/missing',o)).status,404);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>db.close(resolve));}
});
