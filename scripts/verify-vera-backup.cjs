// Targeted offline restore of owned Vera data, never hosted Auth or session tokens.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../ops/qa-runtime'),'node_modules/@electric-sql/pglite'));
const quote=value=>'"'+value.replaceAll('"','""')+'"';
let db,phase='read-private-snapshots';
(async()=>{
 const raw=await fs.readFile(process.argv[2],'utf8'),data=JSON.parse(raw),baseline=JSON.parse(await fs.readFile(process.argv[3],'utf8'));
 if(data.project!=='wqvhivuyvzdbuguuojhk'||baseline.project!==data.project)throw Error('Unexpected project');
 db=new PGlite();
 await db.exec('CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA auth;CREATE SCHEMA vancore_private;GRANT USAGE ON SCHEMA public,auth,vancore_private TO service_role;');
 const columns=[...baseline.columns].sort((a,b)=>a.position-b.position);
 await db.exec('CREATE TABLE public.users('+columns.map(c=>quote(c.name)+' '+c.type+(c.not_null?' NOT NULL':'')).join(',')+')');
 for(const c of baseline.constraints||[])await db.exec('ALTER TABLE public.users ADD CONSTRAINT '+quote(c.name)+' '+c.definition);
 async function insert(table,rows){for(const row of rows){const keys=Object.keys(row);await db.query('INSERT INTO '+table+'('+keys.map(quote).join(',')+') VALUES('+keys.map((_,i)=>'$'+(i+1)).join(',')+')',keys.map(k=>row[k]!==null&&typeof row[k]==='object'?JSON.stringify(row[k]):row[k]));}}
 phase='restore-profiles';await insert('public.users',data.profiles);
 phase='restore-ledger-schema';
 const directory=path.resolve(__dirname,'../supabase/migrations');
 for(const suffix of ['account_change_audit.sql','vera_conversations.sql']){
  const names=(await fs.readdir(directory)).filter(n=>n.endsWith('_'+suffix));if(names.length!==1)throw Error('Ambiguous migration');
  await db.exec(await fs.readFile(path.join(directory,names[0]),'utf8'));
 }
 phase='restore-ledger-data';
 const tables={actors:'vera_actors',conversations:'vera_conversations',requests:'vera_requests',reports:'vera_reports',audit:'account_change_audit'};
 for(const [key,table]of Object.entries(tables))await insert('vancore_private.'+quote(table),data[key]);
 phase='verify-restored-values';
 const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
 for(const [key,table]of Object.entries(tables)){
  const rows=(await db.query('SELECT to_jsonb(t) AS value FROM vancore_private.'+quote(table)+' t')).rows.map(r=>r.value);
  if(JSON.stringify(rows.map(canonical).sort())!==JSON.stringify(data[key].map(canonical).sort()))throw Error('Restored values differ');
 }
 const restored=(await db.query("SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) AS fingerprint FROM public.users u")).rows[0].fingerprint;
 if(restored!==data.profile_fingerprint)throw Error('Profile fingerprint differs');
 phase='verify-owned-api-after-restore';await db.exec('GRANT SELECT,UPDATE ON public.users TO service_role;SET ROLE service_role');
 for(const actor of data.actors){if(!actor.user_id)continue;const result=(await db.query("SELECT public.vancore_vera('read',$1) AS result",[actor.user_id])).rows[0].result;if(!['empty','ready'].includes(result.state))throw Error('Restored API unavailable');}
 const report={status:'PASS',scope:'targeted-profile-and-vera-ledger-restore',sha256:crypto.createHash('sha256').update(raw).digest('hex'),profiles:data.profiles.length,...Object.fromEntries(Object.keys(tables).map(k=>[k,data[k].length])),exactValuesMatch:true,ownedApiReadable:true,hostedWrites:false,personalValuesPrinted:false,limitations:'Does not restore managed Auth, sessions, Storage objects or full infrastructure.'};
 await fs.writeFile(process.argv[4],JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.log(JSON.stringify({status:'FAIL',phase,code:error.code||null,personalValuesPrinted:false}));process.exitCode=1;}).finally(async()=>{if(db)await db.close();});
