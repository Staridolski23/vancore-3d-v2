const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function moduleFixture(relative,mocks={}){
 const source=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'..',relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};const env={NEXT_PUBLIC_SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'synthetic-private-fixture-only'};
 const load=id=>{if(id==='server-only')return{};if(id==='next/server')return{NextResponse:{json:(data,init)=>Response.json(data,init)}};if(Object.hasOwn(mocks,id))return mocks[id];throw Error('Unexpected dependency '+id);};
 vm.runInNewContext('(function(require,module,exports){'+source+'\n})',{process:{env},Request,Response,Headers,WeakSet,Date,console,fetch:mocks.fetch||globalThis.fetch})(load,module,module.exports);return module.exports;
}
function identityFixture(){
 let role='client',authError=null,profileError=null,missing=false,network=false;
 const sdk={auth:{getUser:async()=>{if(network)throw Error('Synthetic outage');return{data:{user:{id:'verified',email:'office@vancoresys.com',user_metadata:{role:'admin',plan:'business'}}},error:authError};}},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:missing?null:{id:'verified',role,plan:'starter',credits:5},error:profileError})})})})};
 const api=moduleFixture('src/lib/supabase.ts',{'@supabase/supabase-js':{createClient:()=>sdk}});
 return{api,set:value=>{({role=role,authError=authError,profileError=profileError,missing=missing,network=network}=value);}};
}
test('Next identity trusts protected profile role and never email or editable metadata',async()=>{
 const f=identityFixture();assert.equal((await f.api.verifyToken('fixture')).vancoreRole,'client');
 f.set({role:'admin'});assert.equal((await f.api.verifyToken('fixture')).vancoreRole,'admin');
 f.set({role:'consultant'});assert.equal((await f.api.verifyToken('fixture')).vancoreRole,'consultant');
 f.set({role:'client'});assert.equal((await f.api.verifyToken('fixture')).vancoreRole,'client');
});
test('privileged SDK fetches cannot reuse cached identity or role responses',async()=>{
 let sdkFetch,cache;
 const api=moduleFixture('src/lib/supabase.ts',{'@supabase/supabase-js':{createClient:(_url,_key,options)=>{sdkFetch=options.global.fetch;return{};}},fetch:async(_url,init)=>{cache=init.cache;return Response.json({});}});
 api.createAuthClient();await sdkFetch('https://fixture.supabase.co/rest/v1/users',{cache:'force-cache'});assert.equal(cache,'no-store');
});
test('Next distinguishes invalid credentials from transient Auth/profile failures',async()=>{
 const f=identityFixture();f.set({authError:{status:401}});assert.equal(await f.api.verifyToken('fixture'),null);
 for(const state of [{authError:{status:503}},{authError:{status:429}},{authError:null,profileError:{code:'PGRST000'}},{profileError:null,missing:true},{missing:false,network:true}]){
  f.set(state);await assert.rejects(f.api.verifyToken('fixture'),e=>e.code==='AUTH_VERIFICATION_UNAVAILABLE');
 }
});
test('request guards preserve 503 outages, deny non-admins and accept only the protected admin role',async()=>{
 let unavailable=false,role='client';
 const auth=moduleFixture('src/lib/request-auth.ts',{'./supabase':{verifyToken:async()=>{if(unavailable)throw Error('Synthetic outage');return{id:'verified',email:'office@vancoresys.com',vancoreRole:role};}}});
 const request=()=>new Request('https://fixture.example/api/private',{headers:{Authorization:'Bearer fixture'}});
 assert.equal((await auth.requireAdmin(request())).status,403);role='admin';assert.equal(await auth.requireAdmin(request()),null);
 unavailable=true;const failed=request();assert.equal(await auth.requestUser(failed),null);assert.equal(auth.authFailure(failed).status,503);assert.equal((await auth.requireAdmin(request())).status,503);
 assert.equal((await auth.requireAdmin(new Request('https://fixture.example/api/private'))).status,401);
});
test('account change validation rejects unsupported privileges, invalid amounts and unversioned edits',()=>{
 const {accountChangeInput:parse}=moduleFixture('src/lib/admin-accounts.ts',{'./supabase':{supabaseAdmin:{}}});
 for(const bad of [{credits:5},{credits:-1,expectedUpdatedAt:null},{credits:1.5,expectedUpdatedAt:null},{credits:2147483648,expectedUpdatedAt:null},{plan:'professional',expectedUpdatedAt:null},{role:'owner',expectedUpdatedAt:null},{role:'admin',expectedUpdatedAt:null,user_metadata:{}},{credits:1,creditDelta:1,expectedUpdatedAt:null}])assert.equal(parse(bad),null);
 assert.equal(parse({plan:'payg',subscription_status:'active',expectedUpdatedAt:null}).change.plan,'payg');
 assert.equal(parse({creditDelta:10,expectedUpdatedAt:'2026-11-07T00:00:00Z'}).change.creditDelta,10);
});
test('account patch denies clients, preserves conflicts and cannot report audit/database failure as saved',async()=>{
 const target='00000000-0000-4000-8000-000000000002';let role='client',failure=null,calls=0;
 const auth={requestUser:async()=>({id:'actor',vancoreRole:role}),isAdminUser:user=>user.vancoreRole==='admin',authFailure:()=>Response.json({error:'Unauthorized'},{status:401})};
 const input=moduleFixture('src/lib/admin-accounts.ts',{'./supabase':{supabaseAdmin:{}}});
 const route=moduleFixture('src/app/api/adminv2/clients/[id]/route.ts',{'@/lib/request-auth':auth,'@/lib/admin-accounts':input,'@/lib/supabase':{supabaseAdmin:{rpc:async(name,args)=>{calls++;assert.equal(name,'vancore_admin_update_account');assert.equal(args.p_actor,'actor');assert.equal(args.p_target,target);return failure?{error:{code:failure}}:{data:{account:{id:target,credits:15},changed:true,auditId:'synthetic-audit'}};}}}});
 const req=body=>new Request('https://fixture.example/api/adminv2/clients/'+target,{method:'PATCH',body:JSON.stringify(body)}),context={params:Promise.resolve({id:target})};
 assert.equal((await route.PATCH(req({creditDelta:10,expectedUpdatedAt:null}),context)).status,403);assert.equal(calls,0);
 role='admin';assert.equal((await route.PATCH(req({credits:-1,expectedUpdatedAt:null}),context)).status,400);assert.equal(calls,0);
 failure='40001';assert.equal((await route.PATCH(req({creditDelta:10,expectedUpdatedAt:null}),context)).status,409);
 failure='XX000';const failed=await route.PATCH(req({credits:15,expectedUpdatedAt:null}),context);assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('XX000'));
 failure=null;const saved=await route.PATCH(req({creditDelta:10,expectedUpdatedAt:null}),context);assert.equal(saved.status,200);assert.equal((await saved.json()).auditId,'synthetic-audit');assert.ok(saved.headers.get('cache-control').includes('no-store'));
});

test('administrator account lists paginate identities/profiles and fail visibly on provider errors or missing profiles',async()=>{
 const identities=Array.from({length:1001},(_,index)=>({id:'synthetic-'+index,email:'qa'+index+'@example.invalid',email_confirmed_at:'2026-11-07T00:00:00Z',created_at:'2026-11-07T00:00:00Z',user_metadata:{role:'admin'}}));
 const profiles=identities.map(user=>({id:user.id,role:'client',plan:'starter',credits:5,subscription_status:'free'}));
 let profileFailure=false,identityFailure=false,missing=false,identityPages=[];
 const sdk={from:()=>({select:()=>({order:()=>({range:async(start,end)=>({data:profiles.slice(start,end+1).filter(profile=>!missing||profile.id!=='synthetic-1000'),error:profileFailure?{code:'Synthetic profile outage'}:null})})})}),auth:{admin:{listUsers:async({page,perPage})=>{identityPages.push(page);assert.equal(perPage,1000);return{data:{users:identities.slice((page-1)*perPage,page*perPage)},error:identityFailure?{code:'Synthetic identity outage'}:null};}}}};
 const api=moduleFixture('src/lib/admin-accounts.ts',{'./supabase':{supabaseAdmin:sdk}});
 const accounts=await api.listAdminAccounts();assert.equal(accounts.length,1001);assert.equal(accounts[1000].role,'client');assert.deepEqual(identityPages,[1,2]);
 profileFailure=true;await assert.rejects(api.listAdminAccounts());profileFailure=false;identityFailure=true;await assert.rejects(api.listAdminAccounts());identityFailure=false;missing=true;await assert.rejects(api.listAdminAccounts());
});
