const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../qa-runtime'),'node_modules/@electric-sql/pglite'));
const directory=path.resolve(__dirname,'../../supabase/migrations');
const admin='00000000-0000-4000-8000-000000000001',client='00000000-0000-4000-8000-000000000002';
async function fixture(){
 const db=new PGlite();await db.exec(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA vancore_private;ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role;GRANT USAGE ON SCHEMA public,vancore_private TO anon,authenticated,service_role;
 CREATE TABLE public.users(id uuid PRIMARY KEY,email text,name text,company text,phone text,vat_id text,role text,plan text,credits integer,subscription_status text,subscription_end text,updated_at timestamptz);GRANT ALL ON public.users TO service_role;
 INSERT INTO public.users(id,role,plan,credits,subscription_status) VALUES('${admin}','admin','business',5,'active'),('${client}','client','starter',5,'free'),('00000000-0000-4000-8000-000000000003','client','starter',5,'free');`);
 for(const suffix of ['account_change_audit','vera_conversations','vera_registered_accounts','vera_casework','vera_knowledge_base','vera_knowledge_fresh_retrieval']){const names=fs.readdirSync(directory).filter(n=>n.endsWith('_'+suffix+'.sql'));assert.equal(names.length,1);await db.exec(fs.readFileSync(path.join(directory,names[0]),'utf8'));}await db.exec('SET ROLE service_role');
 const knowledge=async(action,input={},actor=null)=>(await db.query('SELECT public.vancore_vera_knowledge($1,$2::jsonb,$3) AS result',[action,JSON.stringify(input),actor])).rows[0].result;
 const call=async(action,conv=null,id=null,input={},user=client)=>(await db.query('SELECT public.vancore_vera($1,$2,NULL,$3,$4,$5::jsonb) AS result',[action,user,conv,id,JSON.stringify(input)])).rows[0].result;
 return{db,knowledge,call};
}
const document=()=>{const content='Synthetic public source for migration QA only. Not actual law. '.repeat(30);return{sourceId:'bg-obligations',url:'https://justice.government.bg/home/normdoc/2121934337',sha256:createHash('sha256').update(content).digest('hex'),content,chunks:[{label:'Чл. 9.',body:'Synthetic public contract provision for terms and acceptance. This is not an actual legal text.'},{label:'Чл. 10.',body:'Synthetic public provision about unrelated information for retrieval separation testing.'}]};};
test('knowledge corpus ingests approved documents idempotently, searches exact versions and refuses forged URLs, collisions and modification',async()=>{
 const f=await fixture();try{
  const method=await f.knowledge('method',{sourceId:'vancore-business-method'});assert.match(method.content,/cash flow/);assert.match(method.versionId,/^[a-f0-9-]{36}$/);
  const d=document(),saved=await f.knowledge('ingest',d),again=await f.knowledge('ingest',d);assert.equal(saved.versionId,again.versionId);
  const selected=await f.knowledge('select',{sourceId:d.sourceId,versionId:saved.versionId,query:'contract acceptance',articles:[]});assert.equal(selected.chunks[0].article,'Чл. 9.');assert.match(selected.chunks[0].text,/Synthetic public/);
  const requested=await f.knowledge('select',{sourceId:d.sourceId,versionId:saved.versionId,query:'несъществуваща дума',articles:['Чл. 10.']});assert.equal(requested.chunks[0].article,'Чл. 10.');
  await assert.rejects(f.knowledge('ingest',{...d,url:'http://127.0.0.1/private'}),e=>e.code==='22023');
  await assert.rejects(f.knowledge('ingest',{...d,content:d.content+'different'}),e=>e.code==='22023');
  await assert.rejects(f.db.query('UPDATE vancore_private.vera_knowledge_versions SET content=$1 WHERE id=$2',['changed',saved.versionId]),e=>e.code==='42501');
  assert.equal(Number((await f.db.query('SELECT count(*) AS n FROM vancore_private.vera_knowledge_versions')).rows[0].n),2);
 }finally{await f.db.close();}
});
test('dated corpus retrieval rejects failed/expired observations without changing stored text or bypassing browser grants',async()=>{
 const f=await fixture();try{
  const d=document(),saved=await f.knowledge('ingest',d);
  const fresh=async()=>(await f.db.query("SELECT public.vancore_vera_knowledge_fresh('bg-obligations','contract','[]') AS result")).rows[0].result;
  let selected=await fresh();assert.equal(selected.available,true);assert.equal(selected.versionId,saved.versionId);assert.equal(selected.sha256,d.sha256);
  await f.knowledge('unavailable',{sourceId:d.sourceId});assert.equal((await fresh()).available,false);
  await f.knowledge('ingest',d);assert.equal((await fresh()).available,true);
  await f.db.exec("RESET ROLE;UPDATE vancore_private.vera_knowledge_checks SET checked_at=clock_timestamp()-interval '25 hours';SET ROLE service_role;");assert.equal((await fresh()).available,false);
  await f.db.exec('RESET ROLE;SET ROLE authenticated');await assert.rejects(fresh(),e=>e.code==='42501');
 }finally{await f.db.close();}
});
test('knowledge reference and answer commit atomically, failed references do not charge, and completed retries cannot append new provenance',async()=>{
 const f=await fixture();try{
  const method=await f.knowledge('method',{sourceId:'vancore-business-method'}),saved=await f.knowledge('ingest',document());
  const conv=randomUUID(),id=randomUUID();await f.call('open',conv);const begun=await f.call('begin',conv,id,{message:'Private customer fact: backlog 17 orders.',expectedVersion:0});
  const answer={lease:begun.lease,reply:'Synthetic preliminary answer',mode:'ai',model:'synthetic-model',knowledgeRefs:[randomUUID()]};
  await assert.rejects(f.call('finish',conv,id,answer),e=>e.code==='22023');assert.equal((await f.db.query('SELECT credits FROM public.users WHERE id=$1',[client])).rows[0].credits,5);
  await f.call('finish',conv,id,{...answer,knowledgeRefs:[method.versionId]});assert.equal((await f.db.query('SELECT credits FROM public.users WHERE id=$1',[client])).rows[0].credits,4);
  await f.call('finish',conv,id,{...answer,knowledgeRefs:[saved.versionId]});const refs=(await f.db.query('SELECT version_id FROM vancore_private.vera_request_knowledge WHERE request_id=$1',[id])).rows;assert.equal(refs.length,1);assert.equal(refs[0].version_id,method.versionId);
  assert.equal(Number((await f.db.query("SELECT count(*) AS n FROM vancore_private.vera_knowledge_chunks WHERE body LIKE '%Private customer fact%'")).rows[0].n),0);
  await assert.rejects(f.call('read',conv,null,{},admin),e=>e.code==='P0002');
 }finally{await f.db.close();}
});
test('fixed evaluation scenarios require protected admin role, single-flight scenario-bound leases and retain pending human review without client charges',async()=>{
 const f=await fixture();try{
  await assert.rejects(f.knowledge('scenario',{scenarioId:'dialogue-greeting-v1'},client),e=>e.code==='42501');
  const scenario=await f.knowledge('scenario',{scenarioId:'dialogue-greeting-v1'},admin);assert.equal(scenario.scenario.message,'Здравей, Вера!');assert.ok(scenario.lease);
  await assert.rejects(f.knowledge('scenario',{scenarioId:'dialogue-greeting-v1'},admin),e=>e.code==='55P03');
  await assert.rejects(f.knowledge('evaluation',{scenarioId:'business-margin-v1',lease:scenario.lease,mode:'ai',output:'Wrong scenario'},admin),e=>e.code==='40001');
  const result=await f.knowledge('evaluation',{scenarioId:scenario.id,lease:scenario.lease,mode:'ai',model:'synthetic-model',output:'Здравей! С какъв бизнес казус мога да помогна?',checks:{synthetic:true}},admin);assert.equal(result.saved,true);assert.equal(result.humanReview,'pending');
  await assert.rejects(f.knowledge('evaluation',{scenarioId:scenario.id,lease:scenario.lease,mode:'ai',output:'Repeat'},admin),e=>e.code==='40001');
  assert.equal((await f.db.query('SELECT credits FROM public.users WHERE id=$1',[client])).rows[0].credits,5);assert.equal(Number((await f.db.query('SELECT count(*) AS n FROM vancore_private.vera_requests')).rows[0].n),0);
 }finally{await f.db.close();}
});
test('browser roles cannot read global corpus, evaluation data, private core or server RPCs; old casework acceptance remains rollback-only',async()=>{
 const f=await fixture();try{
  await f.db.exec(fs.readFileSync(path.join(__dirname,'verify-vera-casework-rollback.sql'),'utf8'));
  await f.db.exec(fs.readFileSync(path.join(__dirname,'verify-vera-knowledge-rollback.sql'),'utf8'));
  await f.db.exec(fs.readFileSync(path.join(__dirname,'verify-vera-knowledge-fresh-rollback.sql'),'utf8'));
  const tables=['vera_knowledge_sources','vera_knowledge_versions','vera_knowledge_chunks','vera_knowledge_checks','vera_request_knowledge','vera_evaluation_scenarios','vera_evaluation_runs','vera_evaluation_leases'];
  for(const role of ['anon','authenticated']){await f.db.exec('RESET ROLE;SET ROLE '+role);await assert.rejects(f.knowledge('method',{sourceId:'vancore-business-method'}),e=>e.code==='42501');for(const table of tables)await assert.rejects(f.db.query('SELECT * FROM vancore_private.'+table),e=>e.code==='42501');await assert.rejects(f.db.query("SELECT vancore_private.vera_casework_v1('read')"),e=>e.code==='42501');}
 }finally{await f.db.close();}
});
