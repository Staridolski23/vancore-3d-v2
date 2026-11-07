// Offline Postgres/WASM fixture. No hosted connections, identities or secrets.
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../qa-runtime'),'node_modules/@electric-sql/pglite'));
const migrationDirectory=path.resolve(__dirname,'../../supabase/migrations');
const migrationNames=fs.readdirSync(migrationDirectory).filter(name=>/^\d{14}_account_change_audit\.sql$/.test(name));assert.equal(migrationNames.length,1);
const migration=fs.readFileSync(path.join(migrationDirectory,migrationNames[0]),'utf8');
const admin='00000000-0000-4000-8000-000000000001',client='00000000-0000-4000-8000-000000000002';
async function fixture(){
 const db=new PGlite();
 await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA vancore_private;
 ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role;
 GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
 CREATE TABLE public.users(id uuid PRIMARY KEY,email text,name text,company text,phone text,vat_id text,role text,plan text,credits integer,subscription_status text,subscription_end text,updated_at timestamptz);
 GRANT ALL ON public.users TO service_role;
 INSERT INTO public.users(id,email,role,plan,credits,subscription_status) VALUES('${admin}','admin@example.invalid','admin','business',5,'active'),('${client}','client@example.invalid','client','starter',5,'free');`);
 await db.exec(migration);
 await db.exec("SET ROLE service_role; SELECT set_config('request.jwt.claim.role','service_role',false)");
 const change=async(body,version=null,actor=admin,target=client)=>(await db.query('SELECT public.vancore_admin_update_account($1,$2,$3::jsonb,$4,$5) AS result',[actor,target,JSON.stringify(body),version,'Synthetic offline audit'])).rows[0].result;
 const account=async()=>(await db.query('SELECT role,plan,credits,subscription_status,updated_at FROM public.users WHERE id=$1',[client])).rows[0];
 const auditCount=async()=>Number((await db.query('SELECT count(*) AS n FROM vancore_private.account_change_audit')).rows[0].n);
 return{db,change,account,auditCount};
}

test('account activation and delta credits commit together with protected audit, using stored values',async()=>{
 const f=await fixture();try{
  const first=await f.change({plan:'professional',subscription_status:'active',creditDelta:10});
  assert.equal(first.account.credits,15);assert.equal(first.account.plan,'professional');assert.equal(first.account.subscription_status,'active');assert.ok(first.auditId);assert.equal(await f.auditCount(),1);
  const history=(await f.db.query('SELECT public.vancore_admin_account_audit($1,$2) AS history',[admin,client])).rows[0].history;
  assert.equal(history.length,1);assert.equal(history[0].before_values.credits,5);assert.equal(history[0].after_values.credits,15);assert.ok(!JSON.stringify(history).includes('client@example.invalid'));
  const noop=await f.change({credits:15},first.account.updated_at);assert.equal(noop.changed,false);assert.equal(await f.auditCount(),1);
 }finally{await f.db.close();}
});

test('invalid/stale changes are rejected and an audit insertion failure rolls back the account update',async()=>{
 const f=await fixture();try{
  for(const body of [{role:'owner'},{plan:'professional'},{credits:-1},{credits:1.5},{credits:2147483648},{credits:1,creditDelta:1},{creditDelta:-10},{email:'other@example.invalid'},{role:null}])await assert.rejects(f.change(body));
  assert.equal((await f.account()).credits,5);assert.equal(await f.auditCount(),0);
  const first=await f.change({creditDelta:1});await assert.rejects(f.change({credits:99},null),e=>e.code==='40001');
  await f.db.exec("RESET ROLE; CREATE FUNCTION vancore_private.fail_audit_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic audit unavailable'; END $$; CREATE TRIGGER fail_audit BEFORE INSERT ON vancore_private.account_change_audit FOR EACH ROW EXECUTE FUNCTION vancore_private.fail_audit_fixture(); SET ROLE service_role;");
  await assert.rejects(f.change({credits:99},first.account.updated_at));assert.equal((await f.account()).credits,6);assert.equal(await f.auditCount(),1);
 }finally{await f.db.close();}
});

test('anonymous/client calls and forged actors cannot change privileges or read the private audit',async()=>{
 const f=await fixture();try{
  for(const role of ['anon','authenticated']){
   await f.db.exec('RESET ROLE; SET ROLE '+role);
   await assert.rejects(f.change({role:'admin'}),e=>e.code==='42501');
   await assert.rejects(f.db.query('SELECT public.vancore_admin_account_audit($1,$2)',[admin,client]),e=>e.code==='42501');
   await assert.rejects(f.db.query('SELECT * FROM vancore_private.account_change_audit'),e=>e.code==='42501');
  }
  await f.db.exec('RESET ROLE; SET ROLE service_role');
  await assert.rejects(f.db.query('DELETE FROM vancore_private.account_change_audit WHERE false'),e=>e.code==='42501');
  await assert.rejects(f.db.query('TRUNCATE vancore_private.account_change_audit'),e=>e.code==='42501');
  await assert.rejects(f.change({role:'admin'},null,client),e=>e.code==='42501');
  assert.equal((await f.account()).role,'client');assert.equal(await f.auditCount(),0);
 }finally{await f.db.close();}
});

test('concurrent stale versions cannot overwrite credits, and role revocation takes effect immediately',async()=>{
 const f=await fixture();try{
  const results=await Promise.allSettled([f.change({creditDelta:10}),f.change({creditDelta:20})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected'&&r.reason.code==='40001').length,1);assert.equal(await f.auditCount(),1);
  await assert.rejects(f.change({role:'client'},null,admin,admin),e=>e.code==='22023');
  const current=await f.account();await f.change({role:'admin'},current.updated_at);
  await f.change({role:'client'},null,client,admin);
  const updated=await f.account();await assert.rejects(f.change({credits:1},updated.updated_at,admin),e=>e.code==='42501');
  await assert.rejects(f.change({role:'client'},updated.updated_at,client,client),e=>e.code==='22023');
 }finally{await f.db.close();}
});
