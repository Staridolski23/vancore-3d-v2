const { test } = require('node:test');
const assert = require('node:assert/strict');
const { monthRange, validDate, validTime, installBookingMaintenance } = require('./bookings-maintenance.cjs');
const { createRequire } = require('node:module');
const requireBackend = createRequire(process.env.BACKEND_PACKAGE || __dirname + '/server-snapshot/backend/package.json');

test('month bounds include January and roll December into next year', () => {
  assert.deepEqual(monthRange('2026', '0'), ['2026-01-01', '2026-02-01']);
  assert.deepEqual(monthRange('2026', '11'), ['2026-12-01', '2027-01-01']);
  for (const month of ['12', '-1', '', 'x']) assert.throws(() => monthRange('2026', month));
});
test('date and time reject impossible inputs', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validTime('25:00'), false);
  assert.equal(validTime('09:30'), true);
});

test('public monthly availability never leaks client fields during legacy compatibility',async()=>{
 const sqlite3=requireBackend('sqlite3'),express=requireBackend('express');
 const {createApiSecurity}=require('./backend-auth.cjs');
 const db=new sqlite3.Database(':memory:');
 await new Promise((resolve,reject)=>db.exec("CREATE TABLE bookings(id INTEGER PRIMARY KEY,date TEXT,time TEXT,status TEXT,name TEXT,email TEXT,phone TEXT,company TEXT,description TEXT);INSERT INTO bookings VALUES(1,'2026-11-10','09:00','new','Synthetic private name','private@example.invalid','private-phone','private-company','private-description')",e=>e?reject(e):resolve()));
 const app=express();app.use(createApiSecurity({db,enforce:()=>false,verify:async token=>{
  if(token==='fixture-admin')return{id:'fixture-admin-id',email:'admin@example.invalid',isAdmin:true};
  if(token==='fixture-client')return{id:'fixture-client-id',email:'client@example.invalid',isAdmin:false};
  throw Error('Invalid token');
 }}).middleware);installBookingMaintenance(app,db);
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const token of [null,'fixture-client','forged-admin']){
   const response=await fetch(base+'/api/bookings?year=2026&month=10',{headers:token?{Authorization:'Bearer '+token}:{}});
   assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
   const rows=(await response.json()).bookings;assert.equal(rows.length,1);
   assert.deepEqual(Object.keys(rows[0]).sort(),['date','status','time']);
   assert.equal(rows[0].time,'09:00');
  }
  const admin=await(await fetch(base+'/api/bookings?year=2026&month=10',{headers:{Authorization:'Bearer fixture-admin'}})).json();
  assert.equal(admin.bookings[0].email,'private@example.invalid');
  assert.equal((await fetch(base+'/api/bookings?year=2026')).status,400);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>db.close(resolve));}
});
test('booking updates and proposal acceptance work against a disposable SQLite database', async () => {
  const sqlite3 = requireBackend('sqlite3');
  const express = requireBackend('express');
  const db = new sqlite3.Database(':memory:');
  const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, error => error ? reject(error) : resolve()));
  const get = sql => new Promise((resolve, reject) => db.get(sql, (error, row) => error ? reject(error) : resolve(row)));
  await run('CREATE TABLE bookings(id INTEGER PRIMARY KEY, date TEXT, time TEXT, status TEXT, confirmed_at TEXT, cancelled_at TEXT, cancellation_reason TEXT, UNIQUE(date,time))');
  await run("CREATE TABLE booking_proposals(id INTEGER PRIMARY KEY,booking_id INTEGER,proposed_date TEXT,proposed_time TEXT,status TEXT DEFAULT 'pending')");
  await run("INSERT INTO bookings(id,date,time,status) VALUES(1,'2026-12-01','09:00','new'),(2,'2026-12-02','10:00','new')");
  const app = express(); app.use(express.json()); installBookingMaintenance(app, db);
  const server = await new Promise(resolve => { const server = app.listen(0,'127.0.0.1',()=>resolve(server)); });
  const base='http://127.0.0.1:'+server.address().port;
  const json = (method, body) => ({ method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  try {
    let response=await fetch(base+'/api/bookings?year=2026&month=11');
    assert.equal((await response.json()).bookings.length,2);
    response=await fetch(base+'/api/bookings/1',json('PUT',{status:'confirmed'}));
    assert.equal(response.status,200);
    const confirmed=await get('SELECT * FROM bookings WHERE id=1');
    assert.equal(confirmed.time,'09:00'); assert.ok(confirmed.confirmed_at);
    response=await fetch(base+'/api/bookings/1/propose',json('POST',{date:'2026-12-03',time:'11:00'}));
    const proposal=await response.json(); assert.equal(response.status,200);
    response=await fetch(base+'/api/bookings/proposals/'+proposal.id,json('PATCH',{status:'accepted'}));
    assert.equal(response.status,200);
    const moved=await get('SELECT * FROM bookings WHERE id=1');
    assert.equal(moved.date,'2026-12-03');assert.equal(moved.status,'rescheduled');
    response=await fetch(base+'/api/bookings/proposals/'+proposal.id,json('PATCH',{status:'accepted'}));
    assert.equal(response.status,409);
    response=await fetch(base+'/api/bookings/1/propose',json('POST',{date:'2026-12-02',time:'10:00'}));
    const conflict=await response.json();
    response=await fetch(base+'/api/bookings/proposals/'+conflict.id,json('PATCH',{status:'accepted'}));
    assert.equal(response.status,409);
    assert.equal((await get('SELECT status FROM booking_proposals WHERE id='+conflict.id)).status,'pending');
    assert.equal((await get('SELECT date FROM bookings WHERE id=1')).date,'2026-12-03');
    response=await fetch(base+'/api/bookings/1',json('PUT',{status:'cancelled',cancellation_reason:'Test cancellation'}));
    assert.equal(response.status,200);
    assert.equal((await get('SELECT cancellation_reason FROM bookings WHERE id=1')).cancellation_reason,'Test cancellation');
    response=await fetch(base+'/api/bookings/999',json('PUT',{status:'confirmed'}));assert.equal(response.status,404);
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); await new Promise(resolve=>db.close(resolve)); }
});

test('verified clients cannot move, complete, revive or change another clients booking',async()=>{
 const sqlite3=requireBackend('sqlite3'),express=requireBackend('express');
 const {createApiSecurity}=require('./backend-auth.cjs');const db=new sqlite3.Database(':memory:');
 await new Promise((resolve,reject)=>db.exec("CREATE TABLE bookings(id INTEGER PRIMARY KEY,date TEXT,time TEXT,status TEXT,email TEXT,confirmed_at TEXT,cancelled_at TEXT,cancellation_reason TEXT);CREATE TABLE booking_proposals(id INTEGER PRIMARY KEY,booking_id INTEGER,proposed_date TEXT,proposed_time TEXT,status TEXT DEFAULT 'pending');INSERT INTO bookings(id,date,time,status,email) VALUES(1,'2099-01-05','09:00','new','one@example.invalid'),(2,'2099-01-05','12:00','new','two@example.invalid'),(3,'2099-01-06','09:00','completed','one@example.invalid')",e=>e?reject(e):resolve()));
 const app=express();app.use(express.json());app.use(createApiSecurity({db,enforce:()=>true,verify:async()=>({id:'fixture-one',email:'one@example.invalid',isAdmin:false})}).middleware);installBookingMaintenance(app,db);
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));}),base='http://127.0.0.1:'+server.address().port;
 const send=(path,body,method='PUT')=>fetch(base+path,{method,headers:{Authorization:'Bearer fixture-one','Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  assert.equal((await send('/api/bookings/2',{status:'cancelled'})).status,403);
  assert.equal((await send('/api/bookings/1',{date:'2099-01-07',status:'confirmed'})).status,403);
  assert.equal((await send('/api/bookings/1',{status:'completed'})).status,403);
  assert.equal((await send('/api/bookings/3',{status:'cancelled'})).status,409);
  assert.equal((await send('/api/bookings/1',{status:'confirmed'})).status,200);
  assert.equal((await send('/api/bookings/1/propose',{date:'2099-01-08',time:'10:00'},'POST')).status,200);
  assert.equal((await send('/api/bookings/1',{status:'cancelled',cancellation_reason:'Synthetic cancellation'})).status,200);
  assert.equal((await send('/api/bookings/1',{status:'confirmed'})).status,409);
  assert.equal((await send('/api/bookings/1/propose',{date:'2099-01-08',time:'10:00'},'POST')).status,409);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>db.close(resolve));}
});

test('concurrent creation and all reschedule paths enforce 45-minute intervals across SQLite connections',async()=>{
 const sqlite3=requireBackend('sqlite3'),express=requireBackend('express'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
 const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'vancore-interval-')),filename=path.join(scratch,'disposable.db');
 const db=new sqlite3.Database(filename),other=new sqlite3.Database(filename);db.configure('busyTimeout',5000);other.configure('busyTimeout',5000);
 const exec=sql=>new Promise((resolve,reject)=>db.exec(sql,error=>error?reject(error):resolve()));
 const get=sql=>new Promise((resolve,reject)=>db.get(sql,(error,row)=>error?reject(error):resolve(row)));
 await exec("CREATE TABLE bookings(id INTEGER PRIMARY KEY AUTOINCREMENT,date TEXT,time TEXT,name TEXT,email TEXT,phone TEXT,company TEXT,description TEXT,client_id TEXT,status TEXT DEFAULT 'new',confirmed_at TEXT,cancelled_at TEXT,cancellation_reason TEXT,UNIQUE(date,time));CREATE TABLE booking_proposals(id INTEGER PRIMARY KEY,booking_id INTEGER REFERENCES bookings(id),proposed_date TEXT,proposed_time TEXT,status TEXT DEFAULT 'pending');INSERT INTO bookings(id,date,time,name,email,status) VALUES(50,'2099-01-03','12:00','Synthetic cancelled','qa@example.invalid','cancelled');");
 const migrate=apply=>JSON.parse(require('node:child_process').execFileSync(process.env.PYTHON_CMD||'python3',[path.join(__dirname,'booking-interval-migration.py'),'--database',filename,'--policy',path.join(__dirname,'booking-policy.cjs'),...(apply?['--apply']:[])],{encoding:'utf8'}));
 assert.equal(migrate(false).committed,false);assert.ok((await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'")).sql.includes('UNIQUE(date,time)'));
 assert.equal(migrate(true).rowsPreserved,1);assert.equal(migrate(true).tableRebuilt,false);
 const servers=[];for(const connection of [db,other]){const app=express();app.use(express.json());installBookingMaintenance(app,connection);servers.push(await new Promise(resolve=>{const server=app.listen(0,'127.0.0.1',()=>resolve(server));}));}
 const urls=servers.map(s=>'http://127.0.0.1:'+s.address().port),request=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const body=time=>({date:'2099-01-05',time,name:'Synthetic client',email:'qa@example.invalid',client_id:'caller-cannot-assign-identity'});
 try{
  const created=await Promise.all([fetch(urls[0]+'/api/bookings',request('POST',body('09:00'))),fetch(urls[1]+'/api/bookings',request('POST',body('09:30')))]);
  assert.deepEqual(created.map(r=>r.status).sort(),[201,409]);assert.equal((await get("SELECT count(*) AS n FROM bookings WHERE status!='cancelled'")).n,1);
  const winner=await get("SELECT * FROM bookings WHERE status!='cancelled'");assert.equal(winner.client_id,'');assert.ok(winner.id>50);
  assert.equal((await fetch(urls[0]+'/api/bookings',request('POST',body('10:30')))).status,201);
  assert.equal((await fetch(urls[0]+'/api/bookings/'+winner.id,request('PUT',{status:'cancelled'}))).status,200);
  const replacement=await(await fetch(urls[1]+'/api/bookings',request('POST',body('09:00')))).json();assert.ok(replacement.id);
  assert.equal((await fetch(urls[0]+'/api/bookings/'+replacement.id,request('PUT',{time:'10:00'}))).status,409);
  assert.equal((await get('SELECT time FROM bookings WHERE id='+replacement.id)).time,'09:00');
  const proposal=await(await fetch(urls[0]+'/api/bookings/'+replacement.id+'/propose',request('POST',{date:'2099-01-05',time:'10:00'}))).json();
  assert.equal((await fetch(urls[0]+'/api/bookings/proposals/'+proposal.id,request('PATCH',{status:'accepted'}))).status,409);
  assert.equal((await get('SELECT status FROM booking_proposals WHERE id='+proposal.id)).status,'pending');
  assert.equal((await fetch(urls[0]+'/api/bookings',request('POST',{...body('12:00'),email:{invalid:true}}))).status,400);
 }finally{
  for(const server of servers){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  for(const connection of [db,other])await new Promise(resolve=>connection.close(resolve));
  await fs.rm(scratch,{recursive:true,force:true});
 }
});
