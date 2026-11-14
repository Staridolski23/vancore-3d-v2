const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../qa-runtime'),'node_modules/@electric-sql/pglite'));
const directory=path.resolve(__dirname,'../../supabase/migrations');
const admin='00000000-0000-4000-8000-000000000001',client='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',consultant='00000000-0000-4000-8000-000000000004';
async function fixture(){
 const db=new PGlite();await db.exec(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA vancore_private;ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role;GRANT USAGE ON SCHEMA public,vancore_private TO anon,authenticated,service_role;
 CREATE TABLE public.users(id uuid PRIMARY KEY,email text,name text,company text,phone text,vat_id text,role text,plan text,credits integer,subscription_status text,subscription_end text,updated_at timestamptz);GRANT ALL ON public.users TO service_role;
 INSERT INTO public.users(id,role,plan,credits,subscription_status) VALUES('${admin}','admin','business',5,'active'),('${client}','client','starter',5,'free'),('${other}','client','starter',5,'free'),('${consultant}','consultant','starter',5,'free');`);
 for(const suffix of ['account_change_audit','vera_conversations','vera_registered_accounts','vera_casework']){const names=fs.readdirSync(directory).filter(n=>n.endsWith('_'+suffix+'.sql'));assert.equal(names.length,1);await db.exec(fs.readFileSync(path.join(directory,names[0]),'utf8'));}await db.exec('SET ROLE service_role');
 const call=async(action,conv=null,id=null,input={},user=client)=>(await db.query('SELECT public.vancore_vera($1,$2,NULL,$3,$4,$5::jsonb) AS result',[action,user,conv,id,JSON.stringify(input)])).rows[0].result;
 const staff=async(action,id=null,input={},version=null,actor=admin)=>(await db.query('SELECT public.vancore_vera_handoffs($1,$2,$3,$4::jsonb,$5) AS result',[actor,action,id,JSON.stringify(input),version])).rows[0].result;
 const open=async(user=client)=>{const conv=randomUUID();await call('open',conv,null,{},user);return conv;};
 const add=async(conv,message,kind='conversation',mode='limited',analysis)=>{const state=await call('read',conv),id=randomUUID(),begun=await call('begin',conv,id,{message,kind,expectedVersion:state.conversation.version});const finished=await call('finish',conv,id,{lease:begun.lease,reply:'Synthetic response',mode,model:'synthetic-model',analysis});return{id,begun,finished};};
 const makeReport=async()=>{const conv=await open(),turn=await add(conv,'The backlog is 17 orders.');const content={title:'Synthetic assessment',summary:'A preliminary assessment',facts:[{quote:'The backlog is 17 orders.',sourceRequestId:turn.id}],unknowns:['Baseline lead time'],hypotheses:['The handoff might be a bottleneck'],risks:['Delay may grow'],actions:[{priority:'P1',action:'Measure handoff waiting time',ownerRole:'Operations lead',metric:'Median handoff wait; baseline unknown',timeframe:'Proposed first week'}],questions:['Which handoff waits longest?']};const report=await add(conv,'Prepare the assessment','analysis','ai',content);return{conv,turn,content,report,id:report.finished.analyses[0].id};};
 return{db,call,staff,open,add,makeReport};
}
test('hosted casework acceptance script is rollback-only and leaves the isolated fixture unchanged',async()=>{
 const f=await fixture();try{await f.db.exec(fs.readFileSync(path.join(__dirname,'verify-vera-casework-rollback.sql'),'utf8'));assert.equal(Number((await f.db.query('SELECT count(*) AS n FROM vancore_private.vera_conversations')).rows[0].n),0);assert.equal(Number((await f.db.query('SELECT count(*) AS n FROM vancore_private.vera_consultant_reviews')).rows[0].n),0);}finally{await f.db.close();}
});

test('long-case evidence retrieves an older matching fact after recent context rolls off; notes are owned and versioned',async()=>{
 const f=await fixture();try{
  const conv=await f.open();await f.call('memory',conv,null,{notes:'Goal: reduce delays without changing staffing.',expectedVersion:0});
  await assert.rejects(f.call('memory',conv,null,{notes:'stale',expectedVersion:0}),e=>e.code==='40001');
  for(let i=0;i<16;i++)await f.add(conv,i===3?'The special warehouse code is AZUREFORK and the backlog is 87.':'Routine diagnostic statement '+i);
  const state=await f.call('read',conv),begun=await f.call('begin',conv,randomUUID(),{message:'What was the AZUREFORK backlog?',expectedVersion:state.conversation.version});
  assert.ok(begun.caseMemory.sources.some(s=>s.statement.includes('AZUREFORK')));assert.match(begun.caseMemory.notes,/without changing staffing/);assert.equal(begun.history.length,12);
  assert.ok(!begun.history.some(t=>t.content.includes('AZUREFORK')));
  await assert.rejects(f.call('read',conv,null,{},other),e=>e.code==='P0002');
  await assert.rejects(f.call('memory',conv,null,{notes:'foreign',expectedVersion:state.conversation.version},other),e=>e.code==='P0002');
 }finally{await f.db.close();}
});
test('AI report commits once with its question, exact source quotes and an immutable version; foreign reports are denied',async()=>{
 const f=await fixture();try{
  const r=await f.makeReport();assert.equal(r.report.finished.quota.remaining,4);
  assert.equal((await f.call('analysis_list')).analyses.length,1);assert.equal((await f.call('analysis_list',null,null,{},other)).analyses.length,0);
  const saved=await f.call('analysis_read',null,r.id);assert.equal(saved.analysis.content.facts[0].quote,r.content.facts[0].quote);assert.equal(saved.analysis.request_id,r.report.id);assert.equal(saved.reviews.length,0);
  const again=await f.call('begin',r.conv,r.report.id,{kind:'analysis',message:'Prepare the assessment',expectedVersion:2});assert.equal(again.state,'complete');assert.equal(again.analyses.length,1);assert.equal(again.quota.remaining,4);
  await assert.rejects(f.call('analysis_read',null,r.id,{},other),e=>e.code==='P0002');
  await assert.rejects(f.db.query('UPDATE vancore_private.vera_analyses SET content=$1 WHERE id=$2',[JSON.stringify({forged:true}),r.id]),e=>e.code==='42501');
  const foreign=await f.open(other);await assert.rejects(f.call('begin',foreign,r.report.id,{kind:'conversation',message:'Forged reuse',expectedVersion:0},other),e=>e.code==='P0002');
 }finally{await f.db.close();}
});
test('unsupported report evidence cannot consume a question or create a draft',async()=>{
 const f=await fixture();try{
  const conv=await f.open();await f.add(conv,'Actual statement');const state=await f.call('read',conv),id=randomUUID(),begun=await f.call('begin',conv,id,{kind:'analysis',message:'Report',expectedVersion:state.conversation.version});
  await assert.rejects(f.call('finish',conv,id,{lease:begun.lease,mode:'ai',reply:'Forged report',analysis:{facts:[{quote:'Invented 40% savings',sourceRequestId:randomUUID()}]}}),e=>e.code==='22023');
  assert.equal((await f.call('read',conv)).quota.remaining,5);assert.equal(Number((await f.db.query('SELECT count(*) AS n FROM vancore_private.vera_analyses')).rows[0].n),0);
  await f.call('finish',conv,id,{lease:begun.lease,mode:'limited',reply:'Report unavailable'});assert.equal((await f.call('read',conv)).quota.remaining,5);
 }finally{await f.db.close();}
});
test('only explicitly shared reports reach staff; assignment, review and audit use protected roles and stale revisions fail',async()=>{
 const f=await fixture();try{
  const r=await f.makeReport();assert.equal((await f.staff('list')).items.length,0);await assert.rejects(f.call('analysis_read',null,r.id,{},admin),e=>e.code==='P0002');
  await assert.rejects(f.call('handoff',r.conv,r.id,{shareWithTeam:false,message:''}),e=>e.code==='22023');
  const shared=await f.call('handoff',r.conv,r.id,{shareWithTeam:true,message:'Synthetic review request'}),handoff=shared.handoffs[0];
  assert.equal((await f.call('handoff',r.conv,r.id,{shareWithTeam:true,message:'Retry'})).handoffs.length,1);
  await assert.rejects(f.staff('list',null,{},null,other),e=>e.code==='42501');assert.equal((await f.staff('list',null,{},null,consultant)).items.length,0);
  await assert.rejects(f.staff('read',handoff.id,{},null,consultant),e=>e.code==='P0002');await assert.rejects(f.staff('assign',handoff.id,{assignee:other},0),e=>e.code==='22023');
  await f.staff('assign',handoff.id,{assignee:consultant},0);await assert.rejects(f.staff('status',handoff.id,{status:'in_review'},0,consultant),e=>e.code==='40001');
  assert.equal((await f.staff('read',handoff.id,{},null,consultant)).analysis.id,r.id);
  await f.staff('status',handoff.id,{status:'in_review'},1,consultant);
  const review='Synthetic consultant review: validate the baseline and record handoff waiting time before proposing a target.';
  await f.db.exec("RESET ROLE;CREATE FUNCTION vancore_private.fixture_fail_review_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic audit outage'; END $$;CREATE TRIGGER fixture_fail_review_audit BEFORE INSERT ON vancore_private.vera_handoff_events FOR EACH ROW WHEN (NEW.event='review') EXECUTE FUNCTION vancore_private.fixture_fail_review_audit();SET ROLE service_role;");
  await assert.rejects(f.staff('review',handoff.id,{body:review},2,consultant),e=>e.code==='P0001');
  assert.equal((await f.call('analysis_read',null,r.id)).reviews.length,0);assert.equal((await f.staff('read',handoff.id,{},null,consultant)).handoff.status,'in_review');
  await f.db.exec('RESET ROLE;DROP TRIGGER fixture_fail_review_audit ON vancore_private.vera_handoff_events;DROP FUNCTION vancore_private.fixture_fail_review_audit();SET ROLE service_role;');
  await f.staff('review',handoff.id,{body:review},2,consultant);assert.equal((await f.call('analysis_read',null,r.id)).reviews[0].body,review);
  await assert.rejects(f.staff('review',handoff.id,{body:review},2,consultant),e=>e.code==='40001');
  assert.equal(Number((await f.db.query('SELECT count(*) AS n FROM vancore_private.vera_handoff_events')).rows[0].n),4);
  await assert.rejects(f.call('analysis_read',null,r.id,{},other),e=>e.code==='P0002');
  for(const role of ['anon','authenticated']){await f.db.exec('RESET ROLE;SET ROLE '+role);await assert.rejects(f.staff('list'),e=>e.code==='42501');for(const table of ['vera_case_memory','vera_analyses','vera_handoffs','vera_handoff_events','vera_consultant_reviews'])await assert.rejects(f.db.query('SELECT * FROM vancore_private.'+table),e=>e.code==='42501');}
 }finally{await f.db.close();}
});
test('withdrawn sharing closes staff report access and preserves original history',async()=>{
 const f=await fixture();try{
  const r=await f.makeReport(),shared=await f.call('handoff',r.conv,r.id,{shareWithTeam:true,message:''}),id=shared.handoffs[0].id;await f.staff('assign',id,{assignee:consultant},0);
  const withdrawn=await f.call('cancel_handoff',r.conv,id,{expectedVersion:1});assert.equal(withdrawn.handoffs[0].status,'cancelled');
  await assert.rejects(f.staff('read',id,{},null,consultant),e=>e.code==='P0002');assert.equal((await f.staff('list',null,{},null,consultant)).items.length,0);
  assert.equal((await f.call('analysis_read',null,r.id)).analysis.id,r.id);assert.equal((await f.call('read',r.conv)).requests.length,2);
  assert.equal((await f.call('handoff',r.conv,r.id,{shareWithTeam:true,message:'Old request retry'})).handoffs[0].status,'cancelled');
  await assert.rejects(f.call('handoff',r.conv,r.id,{shareWithTeam:true,message:'Reshare',expectedVersion:1}),e=>e.code==='40001');
  const reshared=await f.call('handoff',r.conv,r.id,{shareWithTeam:true,message:'Explicit new sharing choice',expectedVersion:2});assert.equal(reshared.handoffs[0].status,'requested');
  assert.equal((await f.staff('list',null,{},null,consultant)).items.length,0);
 }finally{await f.db.close();}
});
