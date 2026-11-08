// Local browser acceptance: actual API module + actual migration in PGlite.
// All /api calls are intercepted. No cloud database, model, SMTP or team call.
const http=require('node:http'),path=require('node:path'),fs=require('node:fs');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../../ops/qa-runtime'),'node_modules/@electric-sql/pglite'));
const {loadVera}=require('../helpers/vera-module.cjs');
const ids={one:'00000000-0000-4000-8000-000000000002',two:'00000000-0000-4000-8000-000000000003'};
const profiles={one:{id:ids.one,name:'Synthetic One',email:'one@example.invalid',role:'client',plan:'starter',credits:5},two:{id:ids.two,name:'Synthetic Two',email:'two@example.invalid',role:'client',plan:'starter',credits:5}};
let mode='ai',nextAccount='one',loginToken=null,failRead=false,failFinish=false,providerCalls=0,release=null;
const db=new PGlite();
const ready=(async()=>{
 await db.exec(`CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA vancore_private;
 ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role;GRANT USAGE ON SCHEMA public,vancore_private TO service_role,anon,authenticated;
 CREATE TABLE public.users(id uuid PRIMARY KEY,email text,name text,company text,phone text,vat_id text,role text,plan text,credits integer,subscription_status text,subscription_end text,updated_at timestamptz);
 GRANT ALL ON public.users TO service_role;INSERT INTO public.users(id,email,name,role,plan,credits,subscription_status) VALUES('${ids.one}','one@example.invalid','Synthetic One','client','starter',5,'free'),('${ids.two}','two@example.invalid','Synthetic Two','client','starter',5,'free'),('00000000-0000-4000-8000-000000000001','admin@example.invalid','Synthetic Admin','admin','business',5,'active');`);
 const directory=path.resolve(__dirname,'../../supabase/migrations');
 for(const suffix of ['account_change_audit.sql','vera_conversations.sql']){const names=fs.readdirSync(directory).filter(n=>n.endsWith('_'+suffix));if(names.length!==1)throw Error('Ambiguous fixture migration');await db.exec(fs.readFileSync(path.join(directory,names[0]),'utf8'));}
 await db.exec('SET ROLE service_role');
})();
const profile=request=>{const token=request.headers.get('authorization');return token==='Bearer fixture-one'?profiles.one:token==='Bearer fixture-two'?profiles.two:null;};
const api=loadVera('src/lib/vera-api.ts',{
 './request-auth':{requestUser:async request=>profile(request),authFailure:()=>Response.json({error:'Synthetic sign-in required'},{status:401})},
 './supabase':{supabaseAdmin:{rpc:async(name,p)=>{
  if(name!=='vancore_vera')throw Error('Unexpected fixture RPC');
  if((failRead&&p.p_action==='read')||(failFinish&&p.p_action==='finish'))return{error:{code:'PGRST000'}};
  try{return{data:(await db.query('SELECT public.vancore_vera($1,$2,$3,$4,$5,$6::jsonb) AS result',[p.p_action,p.p_user,p.p_cap,p.p_conversation,p.p_request,JSON.stringify(p.p_input)])).rows[0].result,error:null};}
  catch(error){return{error:{code:error.code}};}
 }}},
 './vera-answers':{answerVera:async(history,message)=>{
  providerCalls++;const selected=mode;
  if(selected==='hold')await new Promise(resolve=>{release=resolve;});
  return selected==='limited'?{reply:'Synthetic limited reply. No question used.',mode:'limited'}:{reply:'Synthetic preliminary answer. '+(history.length?'Stored context retained. ':'')+'Which handoff causes the delay? <b>literal text</b>',mode:'ai'};
 }}
});
const cookie=loadVera('src/lib/vera-cookie.ts');
const server=http.createServer(async(req,res)=>{
 try{
  await ready;const url=new URL(req.url,'http://127.0.0.1:3108');
  const send=response=>{res.writeHead(response.status,Object.fromEntries(response.headers));response.arrayBuffer().then(bytes=>res.end(Buffer.from(bytes)));};
  const json=(data,status=200)=>send(Response.json(data,{status,headers:{'Cache-Control':'no-store'}}));
  if(url.pathname==='/__qa__/control'&&req.method==='POST'){
   let raw='';for await(const part of req)raw+=part;const input=JSON.parse(raw);
   if(input.mode&&!['ai','limited','hold','drop-after-save'].includes(input.mode))return json({error:'Invalid fixture'},400);
   if(input.mode)mode=input.mode;if(input.account){if(!ids[input.account])throw Error('Unknown synthetic account');nextAccount=input.account;}
   failRead=input.failRead===true;failFinish=input.failFinish===true;
   if(input.credits!==undefined){if(!Number.isInteger(input.credits)||input.credits<0)throw Error('Invalid fixture credits');await db.query('UPDATE public.users SET credits=$1 WHERE id=$2',[input.credits,ids[nextAccount]]);}
   if(input.expireLeases)await db.exec("UPDATE vancore_private.vera_requests SET lease_expires_at=clock_timestamp()-interval '1 second' WHERE status='generating'");
   return json({mode,nextAccount,failRead,failFinish});
  }
  if(url.pathname==='/__qa__/release'&&req.method==='POST'){release?.();release=null;return json({released:true});}
  if(url.pathname==='/__qa__/state')return json({providerCalls,profiles:(await db.query('SELECT id,plan,credits FROM public.users ORDER BY id')).rows,requests:(await db.query('SELECT id,conversation_id,status,mode,charged FROM vancore_private.vera_requests ORDER BY created_at')).rows,reports:Number((await db.query('SELECT count(*) AS n FROM vancore_private.vera_reports')).rows[0].n),realCloudWrites:0,realEmailsSent:0});
  if(url.pathname.startsWith('/api/')){
   let raw='';for await(const part of req)raw+=part;
   const headers=new Headers();for(const [key,value]of Object.entries(req.headers))headers.set(key,Array.isArray(value)?value.join(','):value);
   const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:raw}:{} )});
   if(url.pathname==='/api/ai-analyst'){
    const result=await (req.method==='GET'?api.GET(request):api.POST(request));
    if(mode==='drop-after-save'&&req.method==='POST'&&result.status===200&&raw.includes('"action":"message"')){mode='ai';req.socket.destroy();return;}
    return send(result);
   }
   if(url.pathname==='/api/content')return json({sections:{},order:[]});
   if(url.pathname==='/api/auth'){
    const body=JSON.parse(raw);if(body.action!=='login')return json({error:'Only synthetic login supported'},400);
    loginToken='fixture-'+nextAccount;return send(cookie.setVeraCookie(Response.json({token:loginToken,user:profiles[nextAccount],redirectTo:'/client-portal'})));
   }
   if(url.pathname==='/api/auth/session'){
    if(req.method==='DELETE'){loginToken=null;return send(cookie.setVeraCookie(Response.json({success:true})));}
    return loginToken?json({token:loginToken}):json({error:'No synthetic identity'},401);
   }
   if(url.pathname==='/api/auth/profile')return profile(request)?json({user:profile(request)}):json({error:'No synthetic identity'},401);
   if(url.pathname==='/api/bookings')return json({bookings:[]});
   if(url.pathname==='/api/documents')return json({documents:[]});
   if(url.pathname==='/api/reviews')return json({reviews:[]});
   if(url.pathname==='/api/chat')return json({messages:[]});
   return json({error:'Unrecognized isolated fixture API'},418);
  }
  const upstream=http.request({hostname:'127.0.0.1',port:3106,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:3106'}},incoming=>{res.writeHead(incoming.statusCode,incoming.headers);incoming.pipe(res);});
  upstream.on('error',()=>json({error:'Local UI build unavailable'},502));req.pipe(upstream);
 }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"Isolated fixture failure"}');}
});
ready.then(()=>server.listen(3108,'127.0.0.1',()=>console.log('Isolated Vera fixture: http://127.0.0.1:3108/ai-analyst'))).catch(()=>{console.log('Isolated schema setup failed');process.exitCode=1;});
