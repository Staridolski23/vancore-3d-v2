const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadVera}=require('./helpers/vera-module.cjs');
const actor='00000000-0000-4000-8000-000000000001',id='00000000-0000-4000-8000-000000000002';
function fixture(){let user={id:actor,vancoreRole:'consultant'},code=null,calls=[];const api=loadVera('src/app/api/vera-handoffs/route.ts',{'@/lib/request-auth':{requestUser:async()=>user,authFailure:()=>Response.json({error:'Sign in required'},{status:401})},'@/lib/session-cookie':{sameOrigin:request=>!request.headers.get('origin')||request.headers.get('origin')==='https://fixture.example'},'@/lib/supabase':{supabaseAdmin:{rpc:async(name,input)=>{calls.push({name,input});return code?{error:{code}}:{data:{saved:true,handoff:{id,version:2},items:[]}};}}}});return{api,calls,set:value=>{({user=user,code=code}=value);}};}
const request=body=>new Request('https://fixture.example/api/vera-handoffs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('staff queue denies anonymous clients and hostile origins before accessing shared reports',async()=>{
 const f=fixture();for(const user of [null,{id:actor,vancoreRole:'client'}]){f.set({user});assert.equal((await f.api.GET(new Request('https://fixture.example/api/vera-handoffs'))).status,user?403:401);}assert.equal(f.calls.length,0);
 assert.equal((await f.api.POST(new Request('https://fixture.example/api/vera-handoffs',{method:'POST',headers:{Origin:'https://foreign.example'},body:'{}'}))).status,403);
});
test('staff actions derive actor from verified identity, reject forged authority and require an optimistic version',async()=>{
 const f=fixture(),body={id,action:'review',expectedVersion:1,body:'A consultant review with a proposed next step and no guaranteed result.'};
 for(const altered of [{...body,p_actor:'forged'},{...body,expectedVersion:-1},{...body,body:'short'}])assert.equal((await f.api.POST(request(altered))).status,400);
 assert.equal((await f.api.POST(request({id,action:'assign',expectedVersion:1,assignee:actor}))).status,403);
 assert.equal((await f.api.POST(request(body))).status,200);assert.equal(f.calls[0].input.p_actor,actor);assert.equal(f.calls[0].input.p_expected_version,1);assert.equal(f.calls[0].input.p_input.body,body.body);
});
test('stale, revoked and storage failure results cannot be reported as saved',async()=>{
 const f=fixture(),body={id,action:'status',expectedVersion:1,status:'in_review'};
 for(const [code,status]of [['40001',409],['42501',403],['P0002',404],['PGRST000',503]]){f.set({code});const response=await f.api.POST(request(body));assert.equal(response.status,status);assert.equal((await response.json()).saved,undefined);assert.match(response.headers.get('cache-control'),/no-store/);}
});
