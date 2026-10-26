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
