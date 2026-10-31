const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript');
class NextResponse extends Response { static json(data,init){return new NextResponse(JSON.stringify(data),{...init,headers:{'Content-Type':'application/json'}});} }
function load(relative, mocks={}) {
  const filename=path.join(__dirname,'..',relative);
  const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  const requireMock=id=>{
    if(id==='@/lib/session-cookie')return load('src/lib/session-cookie.ts');
    if(Object.hasOwn(mocks,id))return mocks[id];
    if(id==='server-only')return {};
    if(id==='next/server')return {NextResponse};
    throw Error('Unmocked dependency '+id);
  };
  vm.runInNewContext('(function(require,module,exports){'+source+'\n})',{Response,Request,Headers,AbortSignal,process,console,URL})(requireMock,module,module.exports);
  return module.exports;
}
const req=(url,body)=>new Request('http://localhost'+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
const response=(data,status=200)=>Response.json(data,{status});

test('both contact form contracts normalize safely and upstream failure is not reported as success',async()=>{
 const contact=load('src/lib/contact-input.ts');let sent;
 const routes=load('src/app/api/contact/route.ts',{
  '@/lib/contact-input':contact,
  '@/lib/backend':{backendFetch:async(p,init)=>{sent=JSON.parse(init.body);return response({success:true});}},
 });
 assert.equal((await routes.POST(req('/api/contact',{name:'Client',email:'client@example.com',company:'Example',message:'Question'}))).status,200);
 assert.equal(sent.sender_name,'Client');assert.equal(sent.subject,'Website enquiry');assert.ok(sent.message.includes('Example'));
 assert.equal((await routes.POST(req('/api/contact',{sender_name:'Client',sender_email:'client@example.com',subject:'Question',message:'Details'}))).status,200);
 assert.equal((await routes.POST(req('/api/contact',{name:'Client',email:'invalid',message:'Question'}))).status,400);
 assert.equal(contact.contactInput({name:'Client',email:'client@example.com',subject:'Header\r\ninjection',message:'Question'}),null);
 const failed=load('src/app/api/contact/route.ts',{'@/lib/contact-input':contact,'@/lib/backend':{backendFetch:async()=>response({error:'SMTP private details'},503)}});
 const result=await failed.POST(req('/api/contact',{name:'Client',email:'client@example.com',message:'Question'}));assert.equal(result.status,502);assert.ok(!(await result.text()).includes('SMTP'));
});

test('session renewal rotates an HTTP-only cookie and denies cross-origin requests',async()=>{
 let signedOut=false;
 const routes=load('src/app/api/auth/session/route.ts',{'@/lib/supabase':{createAuthClient:()=>({auth:{signOut:async({scope})=>{assert.equal(scope,'local');signedOut=true;return{error:null};},refreshSession:async({refresh_token})=>{assert.equal(refresh_token,'old-refresh');return{data:{user:{email_confirmed_at:'yes'},session:{access_token:'new-access',refresh_token:'new-refresh'}},error:null};}}})}});
 const request=new Request('http://localhost/api/auth/session',{method:'POST',headers:{cookie:'vancore_refresh=old-refresh',origin:'http://localhost','X-Vancore-Session':'1'}});
 const result=await routes.POST(request);assert.equal(result.status,200);assert.equal((await result.json()).token,'new-access');assert.ok(result.headers.get('set-cookie').includes('HttpOnly'));assert.ok(result.headers.get('set-cookie').includes('new-refresh'));
 const forbidden=new Request('http://localhost/api/auth/session',{method:'POST',headers:{cookie:'vancore_refresh=old-refresh',origin:'https://foreign.example','X-Vancore-Session':'1'}});assert.equal((await routes.POST(forbidden)).status,403);
 assert.equal((await routes.POST(new Request('http://localhost/api/auth/session',{method:'POST',headers:{cookie:'vancore_refresh=old-refresh'}}))).status,403);
 const loggedOut=await routes.DELETE(request);assert.ok(loggedOut.headers.get('set-cookie').includes('Max-Age=0'));assert.equal(signedOut,true);
});

test('transient session failures preserve the refresh cookie and invalid recovery cannot change a password',async()=>{
 const temporary=load('src/app/api/auth/session/route.ts',{'@/lib/supabase':{createAuthClient:()=>({auth:{refreshSession:async()=>({data:{},error:{status:503}})}})}});
 const request=new Request('http://localhost/api/auth/session',{method:'POST',headers:{cookie:'vancore_refresh=keep-me','X-Vancore-Session':'1'}});
 const failed=await temporary.POST(request);assert.equal(failed.status,503);assert.equal(failed.headers.get('set-cookie'),null);
 let changed=false;
 const recovery=load('src/app/api/auth/route.ts',{
  '@/lib/request-auth':{requestUser:async()=>null,isAdminEmail:()=>false},
  '@/lib/supabase':{createAuthClient:()=>({auth:{setSession:async()=>({data:{},error:{status:401}}),updateUser:async()=>{changed=true;return{error:null};}}})},
  '@supabase/supabase-js':{},
 });
 assert.equal((await recovery.POST(req('/api/auth',{action:'recover-password',accessToken:'invalid',refreshToken:'invalid',newPassword:'synthetic-test-password'}))).status,401);
 assert.equal(changed,false);
});
test('backend preserves conflict status, forwards user authorization, and fails closed on network error',async()=>{
  const old=global.fetch;
  const filename=path.join(__dirname,'../src/lib/backend.ts');
  const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  let captured;
  const module={exports:{}};
  const context={Response,Headers,AbortSignal,process,console,URL,fetch:async(url,init)=>{captured={url,init};return response({error:'conflict'},409);}};
  vm.runInNewContext('(function(require,module,exports){'+source+'\n})',context)(id=>id==='server-only'?{}:id==='next/headers'?{headers:async()=>new Headers({Authorization:'Bearer test-token'})}:{NextResponse},module,module.exports);
  try {
    const result=await module.exports.backendResponse('/api/bookings',{method:'POST'});
    assert.equal(result.status,409); assert.equal(captured.init.headers.get('Authorization'),'Bearer test-token');assert.equal(captured.init.cache,'no-store');
    context.fetch=async()=>{throw Error('private internal detail');};
    const failed=await module.exports.backendResponse('/api/content');assert.equal(failed.status,502);assert.ok(!(await failed.text()).includes('private internal detail'));
  } finally {global.fetch=old;}
});
test('public monthly availability contains only dates and times, excluding cancellations',async()=>{
  const routes=load('src/app/api/bookings/route.ts',{
    '@/lib/backend':{backendFetch:async()=>response({bookings:[{date:'2026-01-10',time:'09:00',email:'private@example.com',status:'new'},{date:'2026-01-10',time:'10:00',status:'cancelled'}]})},
    '@/lib/request-auth':{requestUser:async()=>null,isAdminEmail:()=>false},
  });
  let result=await routes.GET(req('/api/bookings?year=2026&month=0'));
  assert.equal(result.status,200);assert.deepEqual(await result.json(),{bookings:{'2026-01-10':['09:00']}});
  result=await routes.GET(req('/api/bookings?year=2026&month=12'));assert.equal(result.status,400);
  result=await routes.GET(req('/api/bookings?email=private@example.com'));assert.equal(result.status,401);
});
test('clients cannot access other clients documents',async()=>{
  const routes=load('src/app/api/documents/route.ts',{
    '@/lib/backend':{backendResponse:()=>{throw Error('must not contact backend');}},
    '@/lib/request-auth':{requestUser:async()=>({id:'one',email:'one@example.com'}),isAdminEmail:()=>false},
  });
  assert.equal((await routes.GET(req('/api/documents?email=two@example.com'))).status,403);
});
test('booking changes reject foreign ownership before any write',async()=>{
  const routes=load('src/app/api/bookings/[id]/route.ts',{
    '@/lib/backend':{backendFetch:async()=>response({booking:{email:'two@example.com'}}),backendResponse:()=>{throw Error('must not write');}},
    '@/lib/request-auth':{requestUser:async()=>({id:'one',email:'one@example.com'}),isAdminEmail:()=>false},
  });
  assert.equal((await routes.PUT(req('/api/bookings/1',{status:'cancelled'}),{params:Promise.resolve({id:'1'})})).status,403);
});
test('anonymous review queries cannot expose unpublished reviews',async()=>{
  let endpoint;
  const routes=load('src/app/api/reviews/route.ts',{
    '@/lib/backend':{backendResponse:p=>{endpoint=p;return response({reviews:[]});}},
    '@/lib/request-auth':{requestUser:async()=>null,isAdminEmail:()=>false},
  });
  await routes.GET(req('/api/reviews?status=pending_approval&user_id=someone'));
  assert.equal(endpoint,'/api/reviews?status=published');
});
test('profile update reads the request once and requires authentication',async()=>{
  const routes=load('src/app/api/auth/route.ts',{
    '@/lib/request-auth':{requestUser:async()=>null,isAdminEmail:()=>false},
    '@/lib/supabase':{supabaseAdmin:new Proxy({},{get(){throw Error('must not access privileged data');}})},
    '@supabase/supabase-js':{},
  });
  const result=await routes.POST(req('/api/auth',{action:'update-profile',email:'victim@example.com',name:'attacker'}));
  assert.equal(result.status,401);
});
test('profile writes use verified identity and ignore caller privilege fields',async()=>{
 let profile,authId;
 const routes=load('src/app/api/auth/route.ts',{
  '@/lib/request-auth':{requestUser:async()=>({id:'verified-client',email:'owner@example.com'}),isAdminEmail:()=>false},
  '@/lib/supabase':{supabaseAdmin:{from:()=>({upsert:async value=>{profile=value;return {error:null};}}),auth:{admin:{updateUserById:async id=>{authId=id;return {error:null};}}}}},
  '@supabase/supabase-js':{},
 });
 const result=await routes.POST(req('/api/auth',{action:'update-profile',id:'victim',email:'victim@example.com',name:'Updated',phone:'123',role:'admin',plan:'business',credits:99999}));
 assert.equal(result.status,200);assert.equal(profile.id,'verified-client');assert.equal(profile.email,'owner@example.com');assert.equal(profile.phone,'123');assert.equal(authId,'verified-client');
 for(const field of ['role','plan','credits','subscription_status'])assert.ok(!Object.hasOwn(profile,field));
});

test('password changes use the parsed body once and an isolated sign-in client',async()=>{
 let changed;
 const routes=load('src/app/api/auth/route.ts',{
  '@/lib/request-auth':{requestUser:async()=>null,isAdminEmail:()=>false},
  '@/lib/supabase':{
   createAuthClient:()=>({auth:{signInWithPassword:async()=>({data:{user:{id:'verified-user'}},error:null})}}),
   supabaseAdmin:{auth:{admin:{updateUserById:async(id,update)=>{changed={id,update};return {error:null};}}}},
  },
  '@supabase/supabase-js':{},
 });
 const result=await routes.POST(req('/api/auth',{action:'change-password',email:'one@example.com',currentPassword:'old-test-password',newPassword:'new-test-password'}));
 assert.equal(result.status,200);assert.equal(changed.id,'verified-user');assert.equal(changed.update.password,'new-test-password');
});
test('settings deny unauthenticated updates without contacting an obsolete verify endpoint',async()=>{
  const routes=load('src/app/api/adminv2/settings/route.ts',{
    '@/lib/backend':{backendResponse:()=>{throw Error('must not write');}},
    '@/lib/request-auth':{requireAdmin:async()=>NextResponse.json({error:'Unauthorized'},{status:401})},
  });
  assert.equal((await routes.PUT(req('/api/adminv2/settings',{booking_enabled:false}))).status,401);
});
test('public signup preserves confirmation flow and never overwrites an existing profile',async()=>{
 let signup,profileOptions;
 const routes=load('src/app/api/auth/route.ts',{
  '@/lib/request-auth':{requestUser:async()=>null,isAdminEmail:email=>email==='admin@example.com'},
  '@/lib/supabase':{
   createAuthClient:()=>({auth:{signUp:async options=>{signup=options;return {data:{user:{id:'new-user',identities:[{}]},session:null},error:null};}}}),
   supabaseAdmin:{from:()=>({upsert:async(profile,options)=>{profileOptions=options;return {error:null};}})},
  },'@supabase/supabase-js':{},
 });
 assert.equal((await routes.POST(req('/api/auth',{action:'register',email:'admin@example.com',password:'strong-test-password'}))).status,403);
 const result=await routes.POST(req('/api/auth',{action:'register',email:'client@example.com',password:'strong-test-password',role:'admin'}));
 assert.equal(result.status,200);assert.equal((await result.json()).autoConfirmed,false);assert.equal(signup.options.data.role,'client');assert.equal(profileOptions.ignoreDuplicates,true);
});

test('service worker never intercepts private APIs or authenticated requests',()=>{
 const listeners={};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8'),{
   self:{addEventListener:(name,fn)=>listeners[name]=fn,location:{origin:'https://www.vancoresys.com'}},URL,
 });
 for(const url of ['/api/auth/profile','/api/documents','/client-portal','/admin-v2']) {
   let intercepted=false;
   listeners.fetch({request:new Request('https://www.vancoresys.com'+url),respondWith(){intercepted=true;}});
   assert.equal(intercepted,false,url);
 }
 let intercepted=false;
 listeners.fetch({request:new Request('https://www.vancoresys.com/_next/static/a.js',{headers:{Authorization:'Bearer private'}}),respondWith(){intercepted=true;}});
 assert.equal(intercepted,false);
});
