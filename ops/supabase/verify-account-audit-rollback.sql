-- Hosted function/grant acceptance. No account/audit changes are committed.
BEGIN;
SET LOCAL request.jwt.claim.role='service_role';
SET LOCAL request.jwt.claims='{"role":"service_role"}';
SET LOCAL ROLE service_role;
DO $$ DECLARE actor uuid; target public.users%ROWTYPE; result jsonb; before_count bigint; BEGIN
 SELECT id INTO STRICT actor FROM public.users WHERE role='admin' ORDER BY id LIMIT 1;
 SELECT * INTO STRICT target FROM public.users WHERE role='client' ORDER BY id LIMIT 1;
 SELECT count(*) INTO before_count FROM vancore_private.account_change_audit;
 result:=public.vancore_admin_update_account(actor,target.id,jsonb_build_object('creditDelta',1),target.updated_at,'Disposable acceptance test; ROLLBACK');
 IF (result->'account'->>'credits')::integer<>coalesce(target.credits,0)+1 OR result->>'auditId' IS NULL THEN RAISE EXCEPTION 'Account/audit transaction acceptance failed'; END IF;
 IF (SELECT count(*) FROM vancore_private.account_change_audit)<>before_count+1 THEN RAISE EXCEPTION 'Missing audit record'; END IF;
 IF jsonb_array_length(public.vancore_admin_account_audit(actor,target.id))<1 THEN RAISE EXCEPTION 'Audit read failed'; END IF;
 BEGIN
  PERFORM public.vancore_admin_update_account(actor,target.id,'{"creditDelta":1}'::jsonb,target.updated_at,NULL);
  RAISE EXCEPTION 'Stale revision unexpectedly accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 BEGIN
  PERFORM public.vancore_admin_update_account(target.id,target.id,'{"role":"admin"}'::jsonb,target.updated_at,NULL);
  RAISE EXCEPTION 'Forged administrator unexpectedly accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF has_function_privilege('anon','public.vancore_admin_update_account(uuid,uuid,jsonb,timestamptz,text)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_admin_update_account(uuid,uuid,jsonb,timestamptz,text)','EXECUTE') THEN RAISE EXCEPTION 'Public mutation RPC grant is unsafe'; END IF;
 IF has_function_privilege('anon','public.vancore_admin_account_audit(uuid,uuid)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_admin_account_audit(uuid,uuid)','EXECUTE') THEN RAISE EXCEPTION 'Public audit RPC grant is unsafe'; END IF;
 IF has_table_privilege('authenticated','vancore_private.account_change_audit','SELECT') OR has_table_privilege('service_role','vancore_private.account_change_audit','DELETE') OR has_table_privilege('service_role','vancore_private.account_change_audit','UPDATE') OR has_table_privilege('service_role','vancore_private.account_change_audit','TRUNCATE') THEN RAISE EXCEPTION 'Audit grants are unsafe'; END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','accountAndAuditAtomic',true,'staleRevisionRejected',true,'forgedActorRejected',true,'publicRpcDenied',true,'auditAppendOnlyForService',true,'writesCommitted',false,'auditRows',(SELECT count(*) FROM vancore_private.account_change_audit),'profileCount',count(*),'dataFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,''))) AS verification FROM public.users u;
