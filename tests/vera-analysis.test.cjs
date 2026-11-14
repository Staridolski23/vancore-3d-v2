const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadVera}=require('./helpers/vera-module.cjs');
const source='00000000-0000-4000-8000-000000000001';
const evidence={notes:'Goal: 4 weeks; preserve staffing.',sources:[{requestId:source,statement:'The backlog is 87 orders in warehouse AZUREFORK.'}],totalCompletedRequests:30,selectedSources:1,scope:'Selected unverified statements'};
const draft=()=>({title:'Case assessment',summary:'Preliminary assessment based on selected statements.',facts:[{quote:'The backlog is 87 orders',sourceRequestId:source}],unknowns:['Baseline processing time'],hypotheses:['The handoff might constrain throughput.'],risks:['Backlog may grow.'],actions:[{priority:'P1',action:'Measure queue waiting time',ownerRole:'Operations lead',metric:'Median wait; baseline unknown',timeframe:'Proposed first week'}],questions:['Which handoff has the longest wait?']});
function fixture(reply){let captured;const api=loadVera('src/lib/vera-analysis.ts',{'./vera-provider':{VERA_MODEL:'synthetic-model',createVeraProvider:()=>async(system,history,message)=>{captured={system,history,message};return reply===null?null:{reply};}},'./vera-answers':{limitedReply:()=> 'Report unavailable; no question used.'}});return{api,get captured(){return captured;}};}
test('structured draft accepts real quoted case sources and rejects invented evidence, foreign sources and missing actions',()=>{
 const {api}=fixture(null);assert.ok(api.validateAnalysis(draft(),evidence));
 for(const value of [{...draft(),facts:[{quote:'Guaranteed 40% savings',sourceRequestId:source}]},{...draft(),facts:[{quote:'The backlog is 87 orders',sourceRequestId:'foreign'}]},{...draft(),actions:[]},{...draft(),facts:[]},{...draft(),actions:[{priority:'URGENT',action:'Do it'}]}])assert.equal(api.validateAnalysis(value,evidence),null);
});
test('report generation uses owned older evidence/notes, saves a bounded structured result and labels proposals and human review distinctly',async()=>{
 const f=fixture(JSON.stringify({...draft(),extra:'Do not retain arbitrary provider fields'})),result=await f.api.analyseVera([{role:'assistant',content:'Earlier unverified AI claim: guaranteed profit.'}],'Prepare this case report',evidence);
 assert.equal(result.mode,'ai');assert.equal(result.model,'synthetic-model');assert.equal(result.analysis.extra,undefined);assert.match(f.captured.system,/AZUREFORK/);assert.match(f.captured.system,/preserve staffing/);
 assert.match(result.reply,/AI DRAFT/);assert.match(result.reply,/No consultant review/);assert.match(result.reply,/baseline unknown/);assert.match(result.reply,new RegExp(source));
 assert.equal(f.captured.history.length,0);
});
test('malformed, unsupported or unavailable model reports remain limited and never become a saved AI assessment',async()=>{
 for(const reply of [null,'Not JSON',JSON.stringify({...draft(),facts:[{quote:'Invented profit',sourceRequestId:source}]})]){const result=await fixture(reply).api.analyseVera([],'Report',evidence);assert.equal(result.mode,'limited');assert.equal(result.analysis,undefined);assert.equal(result.model,null);}
});
