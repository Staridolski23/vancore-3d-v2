-- Read-only metadata snapshot. Complements the private logical data export.
-- This does not read server files, change schema, or export session tokens.
SELECT jsonb_build_object(
  'captured_at', now(),
  'server_version', version(),
  'tables', (SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', c.relname, 'rls', c.relrowsecurity, 'force_rls', c.relforcerowsecurity, 'owner', pg_get_userbyid(c.relowner), 'acl', c.relacl)) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','auth','storage') AND c.relkind='r'),
  'columns', (SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'table', c.relname, 'name', a.attname, 'position', a.attnum, 'type', format_type(a.atttypid,a.atttypmod), 'not_null', a.attnotnull, 'identity', a.attidentity, 'generated', a.attgenerated, 'default', pg_get_expr(d.adbin,d.adrelid))) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE n.nspname IN ('public','auth','storage') AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped),
  'constraints', (SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'table', c.relname, 'name', k.conname, 'kind', k.contype, 'definition', pg_get_constraintdef(k.oid))) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','auth','storage')),
  'indexes', (SELECT jsonb_agg(to_jsonb(i)) FROM pg_indexes i WHERE schemaname IN ('public','auth','storage')),
  'policies', (SELECT jsonb_agg(to_jsonb(p)) FROM pg_policies p WHERE schemaname IN ('public','auth','storage')),
  'functions', (SELECT jsonb_agg(jsonb_build_object('signature', p.oid::regprocedure::text, 'definition', pg_get_functiondef(p.oid), 'owner', pg_get_userbyid(p.proowner), 'acl', p.proacl)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f'),
  'triggers', (SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'table', c.relname, 'name', t.tgname, 'definition', pg_get_triggerdef(t.oid))) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace fn ON fn.oid=p.pronamespace WHERE NOT t.tgisinternal AND (n.nspname='public' OR fn.nspname='public')),
  'enums', (SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', t.typname, 'label', e.enumlabel, 'order', e.enumsortorder)) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('public','auth','storage')),
  'grants', (SELECT jsonb_agg(to_jsonb(g)) FROM information_schema.role_table_grants g WHERE table_schema IN ('public','auth','storage')),
  'extensions', (SELECT jsonb_agg(jsonb_build_object('name', e.extname, 'version', e.extversion, 'schema', n.nspname)) FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace),
  'default_acls', (SELECT jsonb_agg(jsonb_build_object('schema', n.nspname, 'role', pg_get_userbyid(d.defaclrole), 'kind', d.defaclobjtype, 'acl', d.defaclacl)) FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE n.nspname IN ('public','auth','storage'))
) AS schema_snapshot;
