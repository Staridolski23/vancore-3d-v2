const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadVera}=require('./helpers/vera-module.cjs');
const {createFreeProvider,FREE_MODELS}=loadVera('src/lib/vera-free-provider.ts');
const env={GROQ_API_KEY:'synthetic-groq-key',CLOUDFLARE_AI_TOKEN:'synthetic-cf-key',CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),VERA_GROQ_FREE_CONFIRMED:'true',VERA_CLOUDFLARE_FREE_CONFIRMED:'true'};
const success=()=>Response.json({choices:[{finish_reason:'stop',message:{content:'<think>Private reasoning</think>Accepted answer',reasoning:'Never expose'}}]});
function admissionRecorder(){const calls=[];return{calls,admission:async(action,provider,input)=>{calls.push({action,provider,input});return{allowed:true,lease:'00000000-0000-4000-8000-000000000001'};}};}
test('free routing reserves globally, isolates provider credentials and records the actual answering model',async()=>{
 const budget=admissionRecorder();let captured;const invoke=createFreeProvider({...budget,env,fetcher:async(url,options)=>{captured={url,options,body:JSON.parse(options.body)};return success();}});
 const result=await invoke('System',[],'Synthetic question');assert.equal(result.model,'groq:'+FREE_MODELS.groq);assert.equal(result.reply,'Accepted answer');assert.equal(captured.url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(captured.options.headers.Authorization,'Bearer synthetic-groq-key');assert.equal(captured.options.redirect,'error');assert.equal(captured.body.include_reasoning,false);assert.equal(captured.body.max_completion_tokens,1024);
 assert.deepEqual(budget.calls.map(x=>x.action),['reserve','release']);assert.ok(budget.calls[0].input.units>1024);assert.doesNotMatch(JSON.stringify(budget.calls),/Synthetic question|key|reasoning/);
});
test('provider 429 is persisted before independent fallback, never retried on that provider and never loses model provenance',async()=>{
 const budget=admissionRecorder(),requests=[];const invoke=createFreeProvider({...budget,env,jsonMode:true,fetcher:async(url,options)=>{requests.push({url,options});return requests.length===1?Response.json({error:'private upstream details'},{status:429,headers:{'retry-after':'1572'}}):success();}});
 const result=await invoke('System',[],'Synthetic case');assert.equal(result.model,'cloudflare:'+FREE_MODELS.cloudflare);assert.equal(requests.length,2);assert.match(requests[1].url,/^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/a{32}\/ai\/v1\/chat\/completions$/);assert.equal(requests[1].options.headers.Authorization,'Bearer synthetic-cf-key');assert.doesNotMatch(requests[1].options.body,/groq-key/);
 assert.equal(budget.calls[1].action,'release');assert.equal(budget.calls[1].input.retryAfterSeconds,1572);assert.equal(budget.calls[2].provider,'cloudflare');
});
test('missing free-tier confirmation, exhausted global budget and storage failure all prevent outbound inference',async()=>{
 let network=0;const fetcher=async()=>{network++;return success();};
 assert.equal(await createFreeProvider({env:{...env,VERA_GROQ_FREE_CONFIRMED:'false',VERA_CLOUDFLARE_FREE_CONFIRMED:'false'},fetcher})('System',[],'Case'),null);
 let issue;assert.equal(await createFreeProvider({env,fetcher,onUnavailable:x=>{issue=x;},admission:async()=>({allowed:false,retryAfterSeconds:60})})('System',[],'Case'),null);assert.equal(issue.retryAfterSeconds,60);
 assert.equal(await createFreeProvider({env,fetcher,admission:async()=>{throw Error('Storage outage');}})('System',[],'Case'),null);assert.equal(network,0);
});
test('long evidence is never silently truncated; incompatible small token quota is skipped and oversized requests fail closed',async()=>{
 const budget=admissionRecorder(),requests=[];const invoke=createFreeProvider({...budget,env,jsonMode:true,fetcher:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return success();}});
 const evidence='Synthetic longer source '.repeat(400);assert.equal((await invoke('System',[],evidence)).model,'cloudflare:'+FREE_MODELS.cloudflare);assert.equal(requests.length,1);assert.equal(requests[0].body.messages.at(-1).content,evidence);
 assert.equal(await invoke('System',[],'x'.repeat(65000)),null);assert.equal(requests.length,1);
});
test('truncation, hidden reasoning without final content and oversized provider responses never become an accepted answer',async()=>{
 for(const body of [{choices:[{finish_reason:'length',message:{content:'Truncated'}}]},{choices:[{finish_reason:'stop',message:{reasoning:'Only private reasoning'}}]},{choices:[{finish_reason:'stop',message:{content:'x'.repeat(270000)}}]}]){
  const budget=admissionRecorder();assert.equal(await createFreeProvider({...budget,env,fetcher:async()=>Response.json(body)})('System',[],'Case'),null);assert.equal(budget.calls.filter(x=>x.action==='release').length,2);
 }
});
