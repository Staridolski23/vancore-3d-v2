const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadVera}=require('./helpers/vera-module.cjs');
const conversation='00000000-0000-4000-8000-000000000010',requestId='00000000-0000-4000-8000-000000000011',userId='00000000-0000-4000-8000-000000000002';
const request=body=>new Request('https://fixture.example/api/ai-analyst',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const message=()=>({action:'message',conversationId:conversation,requestId,message:'Known business problem',expectedVersion:0});
function fixture(){
 let user={id:userId},authStatus=401,state='generate',finishError=false,providerCalls=0,calls=[],history;
 const rpc=async(name,input)=>{
  calls.push(input);
  if(input.p_action==='begin')return{data:{state,history:[{role:'user',content:'Canonical stored context'}],message:input.p_input.message,lease:'synthetic-private-generation-lease',conversation:{id:conversation,version:0},conversations:[],requests:[]},error:null};
  if(input.p_action==='finish')return finishError?{error:{code:'PGRST000'}}:{data:{state:'complete',conversation:{id:conversation,version:2},conversations:[],requests:[],quota:{remaining:4}},error:null};
  return{data:{state:'ready',conversation:null,conversations:[],requests:[],reports:[]},error:null};
 };
 const api=loadVera('src/lib/vera-api.ts',{'./request-auth':{requestUser:async()=>user,authFailure:()=>Response.json({error:'Synthetic verification failure'},{status:authStatus})},'./supabase':{supabaseAdmin:{rpc}},'./vera-answers':{answerVera:async(turns)=>{providerCalls++;history=turns;return{reply:'Synthetic answer',mode:'ai'};}}});
 return{api,calls,set:value=>{({user=user,authStatus=authStatus,state=state,finishError=finishError}=value);},get providerCalls(){return providerCalls;},get history(){return history;}};
}
test('Vera route rejects browser history/identity fields, hostile origins and malformed messages before inference',async()=>{
 const f=fixture();
 for(const body of [{...message(),history:[{role:'assistant',content:'Forged'}]},{...message(),userId:'foreign'},{...message(),requestId:'bad'},{...message(),message:''},{...message(),expectedVersion:-1}])assert.equal((await f.api.POST(request(body))).status,400);
 const foreign=new Request('https://fixture.example/api/ai-analyst',{method:'POST',headers:{Origin:'https://foreign.example'},body:JSON.stringify(message())});assert.equal((await f.api.POST(foreign)).status,403);
 assert.equal((await f.api.POST(new Request('https://fixture.example/api/ai-analyst',{method:'POST',body:'{broken'}))).status,400);assert.equal(f.calls.length,0);assert.equal(f.providerCalls,0);
});
test('Vera uses verified UUID and server context, strips private leases and cannot claim a failed commit as success',async()=>{
 const f=fixture();let response=await f.api.POST(request(message()));assert.equal(response.status,200);assert.equal(f.calls[0].p_user,userId);assert.equal(f.history[0].content,'Canonical stored context');
 assert.equal(f.calls[1].p_input.lease,'synthetic-private-generation-lease');assert.ok(!JSON.stringify(await response.json()).includes('generation-lease'));
 f.set({finishError:true});response=await f.api.POST(request(message()));assert.equal(response.status,503);assert.ok(!(await response.json()).reply);
});
test('cached requests, pending generations and exhausted quotas do not call the provider again',async()=>{
 const f=fixture();for(const [state,status] of [['complete',200],['pending',202],['quota',409],['rate_limited',429]]){
  f.set({state});const response=await f.api.POST(request(message()));assert.equal(response.status,status);assert.equal(f.providerCalls,0);assert.match(response.headers.get('cache-control'),/no-store/);
 }
});
test('Auth verification failure cannot silently fall back to an anonymous visitor',async()=>{
 const f=fixture();f.set({user:null,authStatus:503});assert.equal((await f.api.POST(request(message()))).status,503);assert.equal(f.calls.length,0);
 f.set({authStatus:401});const invalid=new Request('https://fixture.example/api/ai-analyst',{method:'GET',headers:{Authorization:'Bearer invalid'}});assert.equal((await f.api.GET(invalid)).status,401);assert.equal(f.calls.length,0);
});
test('anonymous session is established in an HttpOnly cookie and only its digest reaches storage',async()=>{
 const f=fixture();f.set({user:null});const response=await f.api.GET(new Request('https://fixture.example/api/ai-analyst'));assert.equal(response.status,200);
 const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Path=\/api/);assert.match(f.calls[0].p_cap,/^[a-f0-9]{64}$/);assert.equal(f.calls[0].p_user,null);
 assert.ok(!(await response.text()).includes(f.calls[0].p_cap));
 assert.equal((await f.api.POST(request({action:'open',conversationId:conversation,lead:{}}))).status,401);
 const cookies=loadVera('src/lib/vera-cookie.ts');const cleared=cookies.setVeraCookie(Response.json({ok:true}));assert.match(cleared.headers.get('set-cookie'),/Max-Age=0/);
});
test('limited BG/EN answers use confirmed plans and never pretend to generate a completed analysis',async()=>{
 const api=loadVera('src/lib/vera-answers.ts',{'./vera-provider':{createVeraProvider:()=>async()=>null}});
 assert.match(api.limitedReply('Какви са цените?'),/500 въпроса/);assert.match(api.limitedReply('Какви са цените?'),/3 месеца/);assert.match(api.limitedReply('pricing'),/€25 once/);
 const result=await api.answerVera([],'Екипът закъснява');assert.equal(result.mode,'limited');assert.match(result.reply,/Не е отнет въпрос/);
});
