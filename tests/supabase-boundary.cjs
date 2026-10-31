// Offline restore + actual PostgreSQL RLS checks. No real hosted writes.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {restoreSnapshot}=require('../scripts/verify-supabase-snapshot.cjs');
const ids={a:'f0000000-0000-4000-8000-000000000001',b:'f0000000-0000-4000-8000-000000000002',admin:'f0000000-0000-4000-8000-000000000003'};
async function check(directory,migration){
 const {database,report}=await restoreSnapshot(directory),results=[];
 try{
  await database.exec(await fs.readFile(migration,'utf8'));
  for(const [label,id]of Object.entries(ids)){
   await database.query('INSERT INTO auth.users(id,email) VALUES($1,$2)',[id,label+'@example.invalid']);
  }
  // The restored auth trigger created fixture profiles despite revoked direct EXECUTE.
  await database.query("UPDATE public.users SET role='admin' WHERE id=$1",[ids.admin]);
  for(const label of ['a','b']){
   const inserted=await database.query('INSERT INTO public.conversations(user_id,title) VALUES($1,$2) RETURNING id',[ids[label],'Synthetic '+label]);
   await database.query("INSERT INTO public.messages(conversation_id,role,content) VALUES($1,'user',$2)",[inserted.rows[0].id,'Synthetic '+label]);
  }
  const asRole=async(role,id,fn)=>{
   await database.exec('BEGIN');
   try{
    await database.exec('SET LOCAL ROLE '+role);
    await database.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[id||'',role]);
    return await fn();
   }finally{await database.exec('ROLLBACK');}
  };
  await asRole('anon',null,async()=>{
   assert.equal((await database.query('SELECT count(*)::int AS n FROM public.users')).rows[0].n,0);
   assert.equal((await database.query('SELECT count(*)::int AS n FROM public.conversations')).rows[0].n,0);
   assert.equal((await database.query('SELECT count(*)::int AS n FROM public.messages')).rows[0].n,0);
   assert.equal((await database.query('SELECT count(*)::int AS n FROM public.site_content')).rows[0].n,6);
  });results.push({check:'Anonymous cannot read profiles or conversations; public content preserved',status:'PASS'});
  for(const label of ['a','b'])await asRole('authenticated',ids[label],async()=>{
   const profiles=await database.query('SELECT id FROM public.users');assert.deepEqual(profiles.rows.map(r=>r.id),[ids[label]]);
   const conversations=await database.query('SELECT user_id FROM public.conversations');assert.deepEqual(conversations.rows.map(r=>r.user_id),[ids[label]]);
   const messages=await database.query('SELECT content FROM public.messages');assert.deepEqual(messages.rows.map(r=>r.content),['Synthetic '+label]);
   await database.query("UPDATE public.users SET name='Synthetic changed name' WHERE id=$1",[ids[label]]);
  });results.push({check:'Two clients see only their own profile, conversation and messages; allowed profile save works',status:'PASS'});
  await assert.rejects(asRole('authenticated',ids.a,()=>database.query("UPDATE public.users SET role='admin' WHERE id=$1",[ids.a])),error=>error.code==='42501');
  await assert.rejects(asRole('authenticated',ids.a,()=>database.query('UPDATE public.users SET credits=1000 WHERE id=$1',[ids.a])),error=>error.code==='42501');
  results.push({check:'Client role and credit escalation blocked',status:'PASS'});
  await asRole('authenticated',ids.admin,async()=>{
   assert.equal((await database.query('SELECT count(*)::int AS n FROM public.users')).rows[0].n,12);
   await database.query('UPDATE public.users SET credits=11 WHERE id=$1',[ids.a]);
  });results.push({check:'Administrator retains profile visibility and privileged updates',status:'PASS'});
  const exposure=await database.query("SELECT to_regprocedure('public.is_admin()') IS NULL AND to_regprocedure('public.is_staff()') IS NULL AS helpers_private,NOT has_function_privilege('anon','public.handle_new_user()','EXECUTE') AND NOT has_function_privilege('authenticated','public.handle_new_user()','EXECUTE') AS trigger_not_callable");
  assert.equal(exposure.rows[0].helpers_private,true);assert.equal(exposure.rows[0].trigger_not_callable,true);
  results.push({check:'No public helper RPCs; direct signup-trigger execution revoked',status:'PASS'});
  const rollback=path.join(path.dirname(migration),'../rollback',path.basename(migration));
  await database.exec(await fs.readFile(rollback,'utf8'));
  const reverted=await database.query("SELECT to_regprocedure('public.is_admin()') IS NOT NULL AND to_regprocedure('public.is_staff()') IS NOT NULL AS restored");
  assert.equal(reverted.rows[0].restored,true);
  await asRole('authenticated',ids.a,async()=>assert.equal((await database.query('SELECT count(*)::int AS n FROM public.users')).rows[0].n,1));
  results.push({check:'Code/ACL rollback restores helper locations and preserves client isolation',status:'PASS'});
  return {date:new Date().toISOString(),status:'PASS',environment:report.environment,results};
 }finally{await database.close();}
}
exports.check=check;
if(require.main===module)check(path.resolve(process.argv[2]),path.resolve(process.argv[3])).then(async report=>{await fs.writeFile(path.resolve(process.argv[4]),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}).catch(error=>{console.error('Boundary check failed',{code:error.code||'ASSERTION',reason:error.code?'Database rejected a fixture operation':'A security assertion failed'});process.exitCode=1;});
