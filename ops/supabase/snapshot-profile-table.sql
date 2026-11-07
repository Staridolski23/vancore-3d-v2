-- Read-only targeted logical backup. Save the result privately; it contains PII.
SELECT jsonb_build_object(
 'project','wqvhivuyvzdbuguuojhk','captured_at',now(),
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'position',a.attnum,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid='public.users'::regclass AND a.attnum>0 AND NOT a.attisdropped),
 'rows',(SELECT jsonb_agg(to_jsonb(u) ORDER BY id) FROM public.users u),
 'fingerprint',(SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')) FROM public.users u),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid))) FROM pg_constraint WHERE conrelid='public.users'::regclass),
 'policies',(SELECT jsonb_agg(to_jsonb(p)) FROM pg_policies p WHERE schemaname='public' AND tablename='users'),
 'grants',(SELECT jsonb_agg(to_jsonb(g)) FROM information_schema.role_table_grants g WHERE table_schema='public' AND table_name='users'),
 'rls',(SELECT relrowsecurity FROM pg_class WHERE oid='public.users'::regclass),
 'functions',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'definition',pg_get_functiondef(p.oid)) ORDER BY n.nspname DESC,p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='vancore_private' AND p.proname IN ('is_admin','is_staff')) OR (n.nspname='public' AND p.proname='vancore_guard_profile_privileges')),
 'triggers',(SELECT jsonb_agg(pg_get_triggerdef(oid)) FROM pg_trigger WHERE tgrelid='public.users'::regclass AND NOT tgisinternal),
 'column_acls',(SELECT jsonb_agg(jsonb_build_object('column',attname,'acl',attacl)) FROM pg_attribute WHERE attrelid='public.users'::regclass AND attnum>0 AND NOT attisdropped)
) AS snapshot;
