const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {loadVera}=require('./helpers/vera-module.cjs');
test('knowledge adapter archives all public provisions then validates exact database-selected text and preserves version provenance',async()=>{
 const {createKnowledgeStore}=loadVera('src/lib/vera-knowledge.ts'),calls=[],id='00000000-0000-4000-8000-000000000099';
 const document={source:{id:'bg-obligations',url:'https://justice.government.bg/home/normdoc/2121934337'},content:'Synthetic public source',provisions:[{article:'Чл. 9.',text:'Synthetic source provision about contracts and terms.'}]};document.sha256=createHash('sha256').update(document.content).digest('hex');
 let foreign=false;const store=createKnowledgeStore(async(action,input)=>{calls.push({action,input});return action==='ingest'?{versionId:id}:{chunks:foreign?[{article:'Чл. 9.',text:'Injected foreign/private text'}]:document.provisions};});
 const selected=await store.archiveAndSelect(document,'Private case query; чл. 9.');assert.equal(selected.versionId,id);assert.equal(calls[0].action,'ingest');assert.doesNotMatch(JSON.stringify(calls[0].input),/Private case query/);assert.equal(calls[1].action,'select');assert.ok(calls[1].input.articles.includes('Чл. 9.'));
 foreign=true;await assert.rejects(store.archiveAndSelect(document,'contract'),/mismatch/);await assert.rejects(store.archiveAndSelect({...document,sha256:'0'.repeat(64)},'contract'),/digest/);
});
test('database source adapter enforces dated metadata, bounded excerpts and no silently stale source',async()=>{
 const {createKnowledgeStore}=loadVera('src/lib/vera-knowledge.ts');let data={available:true,versionId:'00000000-0000-4000-8000-000000000099',sha256:'a'.repeat(64),retrievedAt:new Date().toISOString(),chunks:[]};
 const store=createKnowledgeStore(async()=>data);assert.ok(await store.freshSource('bg-obligations','contract'));
 data={...data,retrievedAt:new Date(Date.now()-25*3600000).toISOString()};await assert.rejects(store.freshSource('bg-obligations','contract'),/dated/);
 data={available:false};assert.equal(await store.freshSource('bg-obligations','contract'),null);
});
test('greetings, vague openings, corrections and topic switches stay conversational instead of inheriting stale legal/numeric routing',async()=>{
 let systems=[],ordinary=0,legal=0,numeric=0;
 const base=loadVera('src/lib/vera-legal.ts');const answers=loadVera('src/lib/vera-answers.ts',{
 './vera-provider':{VERA_MODEL:'synthetic',createVeraProvider:()=>async system=>{ordinary++;systems.push(system);return{reply:'Synthetic conversational reply'};}},
 './vera-legal':{...base,createLegalResearch:()=>async()=>{legal++;return{reply:'Synthetic legal clarification',mode:'limited',model:null};}},
 './vera-business-answer':{...loadVera('src/lib/vera-business-answer.ts'),createBusinessAnswer:()=>async()=>{numeric++;return{reply:'Synthetic numeric answer',mode:'ai',model:'synthetic'};}}
 });
 const history=[{role:'user',content:'Правен договор в България; марж 20%.'},{role:'assistant',content:'За коя държава и към коя дата е казусът?'}];
 for(const message of ['Здравей, Вера!','Благодаря ти!','Нова тема: как да измерим забавянето между отделите?'])await answers.answerVera(history,message);
 assert.equal(ordinary,3);assert.equal(legal,0);assert.equal(numeric,0);
 assert.match(systems[0],/greet naturally/);assert.match(systems[0],/one concrete/);assert.match(systems[0],/Reconcile corrections/);assert.match(systems[0],/do not force a previous legal or numerical intake/i);
 await answers.answerVera(history,'България, към днешна дата.');assert.equal(legal,1);
 await answers.answerVera(history,'Какъв е маржът при приходи 120 и себестойност 90?');assert.equal(numeric,1);
});
test('knowledge outage preserves a limited uncharged substantive result; a social greeting can still use the model without inventing corpus access',async()=>{
 let calls=0;const answers=loadVera('src/lib/vera-answers.ts',{'./vera-provider':{VERA_MODEL:'synthetic',createVeraProvider:()=>async()=>{calls++;return{reply:'Здравей! С какъв казус мога да помогна?'};}},'./vera-knowledge-server':{veraKnowledge:{businessMethod:async()=>{throw Error('Synthetic storage outage');}}}});
 assert.equal((await answers.answerVera([],'How can we reduce warehouse waiting time?')).mode,'limited');assert.equal(calls,0);assert.equal((await answers.answerVera([],'Здравей!')).mode,'ai');assert.equal(calls,1);
});
function evaluationFixture(){let user={id:'00000000-0000-4000-8000-000000000001',vancoreRole:'admin',email_confirmed_at:'2026-11-16T00:00:00Z'},code=null,saved=true,calls=[],modelCalls=0;const module=loadVera('src/app/api/adminv2/vera-evaluations/route.ts',{'@/lib/request-auth':{requestUser:async()=>user,authFailure:()=>Response.json({error:'Sign in required'},{status:401})},'@/lib/session-cookie':{sameOrigin:r=>r.headers.get('origin')!=='https://foreign.invalid'},'@/lib/vera-answers':{answerVera:async(history,message)=>{modelCalls++;calls.push({history,message});return{reply:'Здравей! С какъв бизнес казус мога да помогна?',mode:'ai',model:'synthetic'};}},'@/lib/vera-knowledge-server':{veraKnowledge:{scenario:async(id,actor)=>{if(code)throw Object.assign(Error('Synthetic'),{code});calls.push({id,actor});return{scenario:{history:[],message:'Fixed synthetic greeting'},suite_version:'qa',lease:'lease'};},saveEvaluation:async(id,actor,lease,result,checks)=>{calls.push({id,actor,lease,result,checks});return{saved,id:'saved-id'};},evaluations:async actor=>({items:[],actor})}}});return{module,calls,set:values=>{({user=user,code=code,saved=saved}=values);},get modelCalls(){return modelCalls;}};}
const evaluationRequest=body=>new Request('https://fixture.example/api/adminv2/vera-evaluations',{method:'POST',body:JSON.stringify(body)});
test('evaluation API denies non-admins and forged customer input before model use; only fixed scenarios and canonical actor reach the archive',async()=>{
 const f=evaluationFixture();for(const user of [null,{id:'client',vancoreRole:'client',email_confirmed_at:'yes'},{id:'consultant',vancoreRole:'consultant',email_confirmed_at:'yes'}]){f.set({user});assert.equal((await f.module.POST(evaluationRequest({scenarioId:'dialogue-greeting-v1'}))).status,user?403:401);}assert.equal(f.modelCalls,0);
 f.set({user:{id:'canonical-admin',vancoreRole:'admin',email_confirmed_at:'yes'}});
 for(const body of [{scenarioId:'dialogue-greeting-v1',history:[{content:'customer secret'}]},{scenarioId:'dialogue-greeting-v1',actor:'forged'},{scenarioId:'http://attacker.invalid'}])assert.equal((await f.module.POST(evaluationRequest(body))).status,400);
 const response=await f.module.POST(evaluationRequest({scenarioId:'dialogue-greeting-v1'}));assert.equal(response.status,200);assert.equal(f.modelCalls,1);assert.equal(f.calls[0].actor,'canonical-admin');assert.equal(f.calls[1].message,'Fixed synthetic greeting');assert.equal(f.calls[2].lease,'lease');assert.match(response.headers.get('cache-control'),/no-store/);
});
test('evaluation lease limits and archival failures are visible and never claim a saved or professionally approved test',async()=>{
 const f=evaluationFixture();f.set({code:'55P03'});assert.equal((await f.module.POST(evaluationRequest({scenarioId:'dialogue-greeting-v1'}))).status,429);assert.equal(f.modelCalls,0);
 f.set({code:null,saved:false});const response=await f.module.POST(evaluationRequest({scenarioId:'dialogue-greeting-v1'}));assert.equal(response.status,503);assert.equal((await response.json()).saved,undefined);
});
