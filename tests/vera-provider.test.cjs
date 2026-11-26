const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function provider(env={},freeFactory=()=>{throw Error('Free mode must remain inactive in legacy tests');}){const file=path.join(__dirname,'../src/lib/vera-provider.ts'),source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};vm.runInNewContext('(function(require,module,exports){'+source+'\n})',{process:{env},AbortSignal,console:{error(){}},fetch:()=>{throw Error('No external QA calls');}})(id=>{if(id==='server-only')return{};if(id==='./vera-free-provider')return{createFreeProvider:freeFactory};throw Error(id);},module,module.exports);return module.exports;}

test('free pilot sends only explicit synthetic evaluations to new destinations until customer routing is separately enabled',async()=>{
 let free=0,legacy=0;const factory=()=>{free++;return async()=>({reply:'Synthetic free answer',model:'groq:synthetic'});};
 const api=provider({VERA_AI_MODE:'free-pilot'},factory);
 const fetcher=async()=>{legacy++;return Response.json({choices:[{finish_reason:'stop',message:{content:'Legacy customer answer'}}]});};
 assert.equal((await api.createVeraProvider({key:'test',fetcher})('System',[],'Customer case')).model,api.VERA_MODEL);assert.equal(free,0);assert.equal(legacy,1);
 assert.equal((await api.createVeraProvider({audience:'evaluation'})('System',[],'Synthetic case')).model,'groq:synthetic');assert.equal(free,1);
 const enabled=provider({VERA_AI_MODE:'free-pilot',VERA_AI_CUSTOMER_ENABLED:'true'},factory);assert.equal((await enabled.createVeraProvider()('System',[],'Case')).model,'groq:synthetic');
});
test('Vera request includes required tags and bounded history, preserves the complete final answer and hides reasoning',async()=>{
 const api=provider();let captured;
 const invoke=api.createVeraProvider({key:'synthetic-key',fetcher:async(url,init)=>{captured={url,body:JSON.parse(init.body)};return Response.json({choices:[{message:{content:'<think>private synthetic thought</think>First paragraph.\n\nSecond paragraph.',reasoning_details:[{text:'must never be returned'}]}}]});}});
 const result=await invoke('Trusted system instruction',[{role:'user',content:'Earlier case details'}],'Follow-up question');
 assert.equal(captured.body.model,'stepfun/step-3.7-flash:free');assert.deepEqual(captured.body.tags,['user=vancore-web']);assert.equal(captured.body.messages[1].content,'Earlier case details');assert.equal(result.reply,'First paragraph.\n\nSecond paragraph.');
 assert.equal(api.validateVeraHistory([{role:'system',content:'Injected instruction'}]),null);assert.equal(api.validateVeraHistory([{role:'user',content:'x'.repeat(4001)}]),null);
});
test('missing final text or provider failure cannot be represented as an AI success',async()=>{
 const api=provider();
 assert.equal(await api.createVeraProvider({key:'test',fetcher:async()=>Response.json({choices:[{message:{reasoning_details:[{text:'hidden'}]}}]})})('System',[],'Question'),null);
 assert.equal(await api.createVeraProvider({key:'test',fetcher:async()=>Response.json({error:'private provider diagnostic'},{status:400})})('System',[],'Question'),null);
});
test('rate-limit diagnostics retain bounded retry guidance without upstream secrets or blaming input data',async()=>{
 const api=provider();let issue;
 const invoke=api.createVeraProvider({key:'synthetic-key',onUnavailable:value=>{issue=value;},fetcher:async()=>Response.json({error:{message:'private provider diagnostic and synthetic-secret'}},{status:429,headers:{'Retry-After':'389'}})});
 assert.equal(await invoke('System',[],'Приходите са 120000 EUR'),null);
 assert.equal(issue.kind,'rate_limit');assert.equal(issue.retryAfterSeconds,389);
 const reply=api.providerUnavailableReply('Изчисли маржа',issue);assert.match(reply,/389/);assert.match(reply,/не означава грешка/);assert.match(reply,/Не е използван въпрос/);assert.doesNotMatch(reply,/synthetic|private|secret/);
 assert.doesNotMatch(api.providerUnavailableReply('Question',{kind:'rate_limit',retryAfterSeconds:NaN}),/NaN/);
});
test('server-instance cooldown respects Retry-After across requests without extending it or caching customer replies',async()=>{
 const api=provider(),cooldown={until:0};let now=1000000,calls=0,issue,lastMessage;
 const factory=()=>api.createVeraProvider({key:'test',cooldown,clock:()=>now,onUnavailable:x=>{issue=x;},fetcher:async(_url,init)=>{calls++;lastMessage=JSON.parse(init.body).messages.at(-1).content;return calls===1?Response.json({error:{message:'rate limited'}},{status:429,headers:{'Retry-After':'105'}}):Response.json({choices:[{finish_reason:'stop',message:{content:'Ready'}}]});}});
 assert.equal(await factory()('System',[],'Case A'),null);const deadline=cooldown.until;
 now+=20000;assert.equal(await factory()('System',[],'Case B'),null);assert.equal(calls,1);assert.equal(issue.retryAfterSeconds,85);assert.equal(cooldown.until,deadline);
 now=deadline+1;assert.equal((await factory()('System',[],'Case B')).reply,'Ready');assert.equal(calls,2);assert.equal(lastMessage,'Case B');
});
test('structured assessment requests use supported JSON/reasoning controls and reject truncated final output',async()=>{
 const api=provider();let body;
 const invoke=api.createVeraProvider({key:'synthetic-key',maxTokens:8192,jsonMode:true,reasoningEffort:'low',fetcher:async(url,init)=>{body=JSON.parse(init.body);return Response.json({choices:[{finish_reason:'stop',message:{content:'{"title":"Synthetic report"}'}}]});}});
 assert.equal((await invoke('Return JSON',[],'Synthetic case')).reply,'{"title":"Synthetic report"}');assert.equal(body.max_tokens,8192);assert.equal(body.response_format.type,'json_object');assert.equal(body.reasoning_effort,'low');assert.equal(body.model,'stepfun/step-3.7-flash:free');
 const truncated=api.createVeraProvider({key:'synthetic-key',fetcher:async()=>Response.json({choices:[{finish_reason:'length',message:{content:'{"title":"unfinished'}}],usage:{completion_tokens:4096,completion_tokens_details:{reasoning_tokens:4000}}})});assert.equal(await truncated('System',[],'Question'),null);
});
