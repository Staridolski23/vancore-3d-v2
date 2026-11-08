-- Existing profile + ephemeral canonical case. Every row/credit change rolls back.
BEGIN;
SET LOCAL ROLE service_role;
SET LOCAL request.jwt.claim.role='service_role';
SET LOCAL request.jwt.claims='{"role":"service_role"}';
DO $$ DECLARE client uuid; actor uuid; conv uuid:=gen_random_uuid(); request uuid:=gen_random_uuid(); first jsonb; saved jsonb; history jsonb; brief jsonb; version timestamptz; BEGIN
 SELECT id INTO STRICT client FROM public.users WHERE role='client' ORDER BY id LIMIT 1;
 SELECT id INTO STRICT actor FROM public.users WHERE role='admin' ORDER BY id LIMIT 1;
 first:=public.vancore_vera('open',client,NULL,conv);
 IF first->'conversation'->>'id'<>conv::text THEN RAISE EXCEPTION 'Conversation ownership setup failed'; END IF;
 first:=public.vancore_vera('begin',client,NULL,conv,request,'{"message":"Synthetic restore acceptance case","expectedVersion":0}');
 IF first->>'state'<>'generate' THEN RAISE EXCEPTION 'Expected generation reservation'; END IF;
 saved:=public.vancore_vera('finish',client,NULL,conv,request,jsonb_build_object('lease',first->>'lease','reply','Synthetic limited acceptance answer','mode','limited'));
 IF saved->>'state'<>'complete' OR (saved->'requests'->0->>'charged')::boolean THEN RAISE EXCEPTION 'Limited answer charge is invalid'; END IF;
 IF public.vancore_vera('begin',client,NULL,conv,request,'{"message":"Synthetic restore acceptance case","expectedVersion":0}')->>'state'<>'complete' THEN RAISE EXCEPTION 'Idempotent retry failed'; END IF;
 history:=public.vancore_vera('read',client,NULL,conv);
 IF jsonb_array_length(history->'requests')<>1 THEN RAISE EXCEPTION 'Restore duplicated request'; END IF;
 brief:=public.vancore_vera('report',client,NULL,conv);
 IF brief->>'state'<>'report_saved' THEN RAISE EXCEPTION 'Brief save failed'; END IF;
 BEGIN
  PERFORM public.vancore_vera('read',actor,NULL,conv);
  RAISE EXCEPTION 'Cross-owner read unexpectedly accepted';
 EXCEPTION WHEN no_data_found THEN NULL; END;
 SELECT updated_at INTO version FROM public.users WHERE id=client;
 saved:=public.vancore_admin_update_account(actor,client,'{"plan":"payg","subscription_status":"active"}',version,'Synthetic activation test; ROLLBACK');
 IF (saved->'account'->>'credits')::integer<>500 OR (saved->'account'->>'subscription_end')::timestamptz<clock_timestamp()+interval '80 days' THEN RAISE EXCEPTION 'PAYG activation failed'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF has_function_privilege('anon','public.vancore_vera(text,uuid,text,uuid,uuid,jsonb)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_vera(text,uuid,text,uuid,uuid,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Unsafe browser RPC grant'; END IF;
 IF has_table_privilege('authenticated','vancore_private.vera_requests','SELECT') OR has_table_privilege('service_role','vancore_private.vera_reports','UPDATE') OR has_table_privilege('service_role','vancore_private.vera_reports','DELETE') THEN RAISE EXCEPTION 'Unsafe history/report grants'; END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','writesCommitted',false,'profileCount',count(*),'profileFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')),
 'veraActors',(SELECT count(*) FROM vancore_private.vera_actors),'veraConversations',(SELECT count(*) FROM vancore_private.vera_conversations),'veraRequests',(SELECT count(*) FROM vancore_private.vera_requests),'veraReports',(SELECT count(*) FROM vancore_private.vera_reports),'auditRows',(SELECT count(*) FROM vancore_private.account_change_audit)) AS verification FROM public.users u;
