const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../qa-runtime'),'node_modules/@electric-sql/pglite'));
async function fixture(){const db=new PGlite();await db.exec('CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA vancore_private;GRANT USAGE ON SCHEMA vancore_private,public TO anon,authenticated,service_role;');const dir=path.resolve(__dirname,'../../supabase/migrations'),file=fs.readdirSync(dir).find(n=>n.endsWith('_vera_inference_budget.sql'));await db.exec(fs.readFileSync(path.join(dir,file),'utf8'));await db.exec('SET ROLE service_role');const call=async(action,provider,units=0,lease=null,retry=0)=>(await db.query('SELECT public.vancore_vera_inference_budget($1,$2,$3,$4,$5) value',[action,provider,units,lease,retry])).rows[0].value;return{db,call};}
test('global inference admission serializes requests, retains failed reservations and requires the matching lease',async()=>{
 const f=await fixture();try{const first=await f.call('reserve','groq',1000);assert.equal(first.allowed,true);assert.equal((await f.call('reserve','groq',1000)).allowed,false);assert.equal((await f.call('release','groq',0,'00000000-0000-4000-8000-000000000099')).allowed,false);assert.equal((await f.call('release','groq',0,first.lease)).allowed,true);assert.equal((await f.call('release','groq',0,first.lease)).allowed,false);
 const second=await f.call('reserve','groq',1000);assert.equal(second.allowed,true);await f.call('release','groq',0,second.lease,120);assert.equal((await f.call('reserve','groq',1000)).allowed,false);const row=(await f.db.query('SELECT used,requests FROM vancore_private.vera_inference_budget')).rows[0];assert.deepEqual(row,{used:2000,requests:2});}finally{await f.db.close();}
});
test('minute and daily admission limits survive new requests, expiry and UTC day rollover',async()=>{
 const f=await fixture();try{let r=await f.call('reserve','groq',7000);await f.call('release','groq',0,r.lease);assert.equal((await f.call('reserve','groq',501)).allowed,false);
 await f.db.exec("UPDATE vancore_private.vera_inference_budget SET minute_started=clock_timestamp()-interval '61 seconds',used=99900");assert.equal((await f.call('reserve','groq',101)).allowed,false);
 await f.db.exec("UPDATE vancore_private.vera_inference_budget SET day=((clock_timestamp() AT TIME ZONE 'UTC')::date-1)");r=await f.call('reserve','groq',1000);assert.equal(r.allowed,true);await f.call('release','groq',0,r.lease);
 let cf=await f.call('reserve','cloudflare',2000);assert.equal(cf.allowed,true);await f.call('release','cloudflare',0,cf.lease);assert.equal((await f.call('reserve','cloudflare',1)).allowed,false);
 await f.db.exec("UPDATE vancore_private.vera_inference_budget SET lease='00000000-0000-4000-8000-000000000099',lease_until=clock_timestamp()-interval '1 second',minute_started=clock_timestamp()-interval '61 seconds' WHERE provider='cloudflare'");assert.equal((await f.call('reserve','cloudflare',100)).allowed,true);
 }finally{await f.db.close();}
});
test('browser roles cannot read or mutate inference counters or call admission, and unknown providers are rejected',async()=>{
 const f=await fixture();try{await assert.rejects(f.call('reserve','paid-provider',1),e=>e.code==='22023');await assert.rejects(f.call('reserve','groq',0),e=>e.code==='22023');for(const role of ['anon','authenticated']){await f.db.exec('RESET ROLE;SET ROLE '+role);await assert.rejects(f.call('reserve','groq',1),e=>e.code==='42501');await assert.rejects(f.db.query('SELECT * FROM vancore_private.vera_inference_budget'),e=>e.code==='42501');}}finally{await f.db.close();}
});

test('hosted acceptance script rolls all synthetic counters back and preserves unrelated records',async()=>{
 const f=await fixture();try{
  await f.db.exec("RESET ROLE;CREATE TABLE public.users(id uuid PRIMARY KEY,credits integer);INSERT INTO public.users VALUES('00000000-0000-4000-8000-000000000001',5);CREATE TABLE vancore_private.vera_requests(id uuid PRIMARY KEY);");
  await f.db.exec(fs.readFileSync(path.join(__dirname,'verify-vera-inference-budget-rollback.sql'),'utf8'));
  assert.equal(Number((await f.db.query('SELECT count(*) n FROM vancore_private.vera_inference_budget')).rows[0].n),0);
  assert.equal((await f.db.query('SELECT credits FROM public.users')).rows[0].credits,5);
 }finally{await f.db.close();}
});
