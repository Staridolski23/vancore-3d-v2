// Targeted offline restore, not a managed Supabase/Auth backup. Never prints rows.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {PGlite}=require(path.join(process.env.VANCORE_QA_RUNTIME||path.resolve(__dirname,'../ops/qa-runtime'),'node_modules/@electric-sql/pglite'));
const quote=value=>'"'+value.replaceAll('"','""')+'"';
let phase='read-backup',database;
(async()=>{
 const raw=await fs.readFile(process.argv[2],'utf8'),snapshot=JSON.parse(raw);
 if(snapshot.project!=='wqvhivuyvzdbuguuojhk'||!snapshot.rls||!Array.isArray(snapshot.rows))throw Error('Invalid backup');
 if(snapshot.column_acls.some(column=>column.acl!==null))throw Error('Explicit column ACL restore needs review');
 database=new PGlite();phase='create-isolated-fixture';
 await database.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA vancore_private;
 GRANT USAGE ON SCHEMA public,auth,vancore_private TO anon,authenticated,service_role;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
 SET TIME ZONE 'UTC';`);
 const columns=[...snapshot.columns].sort((a,b)=>a.position-b.position);
 await database.exec('CREATE TABLE public.users('+columns.map(column=>quote(column.name)+' '+column.type+(column.default?' DEFAULT '+column.default:'')+(column.not_null?' NOT NULL':'')).join(',')+')');
 phase='restore-profile-data';
 for(const row of snapshot.rows)await database.query('INSERT INTO public.users('+columns.map(column=>quote(column.name)).join(',')+') VALUES('+columns.map((_,i)=>'$'+(i+1)).join(',')+')',columns.map(column=>row[column.name]));
 for(const constraint of snapshot.constraints||[])await database.exec('ALTER TABLE public.users ADD CONSTRAINT '+quote(constraint.name)+' '+constraint.definition);
 for(const fn of snapshot.functions||[])await database.exec(fn.definition);
 const migrationDirectory=path.resolve(__dirname,'../supabase/migrations');
 const migrationNames=(await fs.readdir(migrationDirectory)).filter(name=>/^\d{14}_account_change_audit\.sql$/.test(name));
 if(migrationNames.length!==1)throw Error('Ambiguous account migration');
 const accountMigration=await fs.readFile(path.join(migrationDirectory,migrationNames[0]),'utf8');
 const baselineHasAccountAudit=(snapshot.triggers||[]).some(trigger=>trigger.includes('vancore_touch_profile_updated_at'));
 if(baselineHasAccountAudit)await database.exec(accountMigration);
 for(const trigger of snapshot.triggers||[])if(!baselineHasAccountAudit||!trigger.includes('vancore_touch_profile_updated_at'))await database.exec(trigger);
 await database.exec('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY');
 for(const policy of snapshot.policies||[])await database.exec('CREATE POLICY '+quote(policy.policyname)+' ON public.users AS '+policy.permissive+' FOR '+policy.cmd+' TO '+policy.roles.map(role=>role==='public'?'PUBLIC':quote(role)).join(',')+(policy.qual?' USING ('+policy.qual+')':'')+(policy.with_check?' WITH CHECK ('+policy.with_check+')':''));
 for(const grant of snapshot.grants||[])if(['anon','authenticated','service_role'].includes(grant.grantee))await database.exec('GRANT '+grant.privilege_type+' ON public.users TO '+quote(grant.grantee));
 const fingerprint=async()=>(await database.query("SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) AS fingerprint FROM public.users u")).rows[0].fingerprint;
 phase='compare-restored-data';if(await fingerprint()!==snapshot.fingerprint)throw Error('Fingerprint mismatch');
 const guardSQL=await fs.readFile(path.resolve(__dirname,'../ops/supabase/verify-profile-privileges-rollback.sql'),'utf8');
 phase='verify-existing-guards';await database.exec(guardSQL);
 phase='apply-candidate-offline';
 if(!baselineHasAccountAudit)await database.exec(accountMigration);
 const verifyVera=process.argv.includes('--vera');
 if(verifyVera){const names=(await fs.readdir(migrationDirectory)).filter(name=>/^\d{14}_vera_conversations\.sql$/.test(name));if(names.length!==1)throw Error('Ambiguous Vera migration');await database.exec(await fs.readFile(path.join(migrationDirectory,names[0]),'utf8'));}
 phase='verify-guards-after-candidate';await database.exec(guardSQL);
 phase='verify-account-acceptance-rollback';await database.exec(await fs.readFile(path.resolve(__dirname,'../ops/supabase/verify-account-audit-rollback.sql'),'utf8'));
 if(verifyVera){phase='verify-vera-acceptance-rollback';await database.exec(await fs.readFile(path.resolve(__dirname,'../ops/supabase/verify-vera-rollback.sql'),'utf8'));}
 if(await fingerprint()!==snapshot.fingerprint)throw Error('Candidate changed profile data');
 const report={status:'PASS',scope:'targeted-profile-table-and-guard-dependencies',backupSha256:crypto.createHash('sha256').update(raw).digest('hex'),profiles:snapshot.rows.length,dataFingerprint:snapshot.fingerprint,restoredRowsMatch:true,existingRoleIsolationPassed:true,candidateMigrationPassed:true,protectedFieldTestsBeforeAndAfter:14,accountAcceptanceRollbackPassed:true,veraAcceptanceRollbackPassed:verifyVera,hostedWrites:false,clientValuesPrinted:false,limits:'Isolated identity/schema harness; not hosted Auth, sessions or a full managed database restore.'};
 await fs.writeFile(process.argv[3],JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.log(JSON.stringify({status:'FAIL',phase,code:error.code||null,clientValuesPrinted:false}));process.exitCode=1;}).finally(async()=>{if(database)await database.close();});
