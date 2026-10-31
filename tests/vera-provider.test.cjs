const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function provider(){const file=path.join(__dirname,'../src/lib/vera-provider.ts'),source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};vm.runInNewContext('(function(require,module,exports){'+source+'\n})',{process:{env:{}},AbortSignal,console:{error(){}},fetch:()=>{throw Error('No external QA calls');}})(id=>{if(id==='server-only')return{};throw Error(id);},module,module.exports);return module.exports;}
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
