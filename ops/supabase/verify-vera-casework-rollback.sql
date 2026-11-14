BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE owner_id uuid; foreign_id uuid; staff_id uuid; conv uuid:=gen_random_uuid(); turn_id uuid:=gen_random_uuid(); report_turn uuid:=gen_random_uuid(); started jsonb; state jsonb; draft_id uuid; handoff_id uuid; content jsonb;
BEGIN
 SELECT id INTO owner_id FROM public.users WHERE role='client' AND plan='starter' AND credits>0 ORDER BY id LIMIT 1;
 SELECT id INTO foreign_id FROM public.users WHERE role='client' AND id<>owner_id ORDER BY id LIMIT 1;
 SELECT id INTO staff_id FROM public.users WHERE role='admin' ORDER BY id LIMIT 1;
 IF owner_id IS NULL OR foreign_id IS NULL OR staff_id IS NULL THEN RAISE EXCEPTION 'Acceptance identities unavailable'; END IF;
 PERFORM public.vancore_vera('open',owner_id,NULL,conv);
 state:=public.vancore_vera('memory',owner_id,NULL,conv,NULL,'{"notes":"QA-only notes; no customer facts.","expectedVersion":0}');
 IF state->>'caseNotes'<>'QA-only notes; no customer facts.' THEN RAISE EXCEPTION 'Notes not saved'; END IF;
 started:=public.vancore_vera('begin',owner_id,NULL,conv,turn_id,'{"message":"QA-only synthetic backlog is 17 orders.","expectedVersion":1}');
 PERFORM public.vancore_vera('finish',owner_id,NULL,conv,turn_id,jsonb_build_object('lease',started->>'lease','reply','Synthetic limited answer','mode','limited'));
 content:=jsonb_build_object('title','QA-only synthetic assessment','summary','A synthetic draft used for ROLLBACK acceptance.','facts',jsonb_build_array(jsonb_build_object('quote','QA-only synthetic backlog is 17 orders.','sourceRequestId',turn_id)),'unknowns',jsonb_build_array('Baseline waiting time'),'hypotheses',jsonb_build_array('Handoff may constrain flow'),'risks',jsonb_build_array('The queue may grow'),'actions',jsonb_build_array(jsonb_build_object('priority','P1','action','Measure waiting time','ownerRole','Operations lead','metric','Median wait; baseline unknown','timeframe','Proposed first week')),'questions',jsonb_build_array('Which handoff waits longest?'));
 started:=public.vancore_vera('begin',owner_id,NULL,conv,report_turn,'{"kind":"analysis","message":"QA-only structured assessment request","expectedVersion":3}');
 IF started->'caseMemory'->>'notes'<>'QA-only notes; no customer facts.' THEN RAISE EXCEPTION 'Case memory missing'; END IF;
 state:=public.vancore_vera('finish',owner_id,NULL,conv,report_turn,jsonb_build_object('lease',started->>'lease','reply','QA-only structured AI draft','mode','ai','model','synthetic-rollback-fixture','analysis',content));
 draft_id:=(state->'analyses'->0->>'id')::uuid; IF draft_id IS NULL THEN RAISE EXCEPTION 'Draft not saved'; END IF;
 BEGIN PERFORM public.vancore_vera('analysis_read',foreign_id,NULL,NULL,draft_id);RAISE EXCEPTION 'Foreign report accepted';EXCEPTION WHEN no_data_found THEN NULL;END;
 state:=public.vancore_vera('handoff',owner_id,NULL,conv,draft_id,'{"shareWithTeam":true,"message":"QA-only explicit sharing. ROLLBACK."}');
 handoff_id:=(state->'handoffs'->0->>'id')::uuid;
 PERFORM public.vancore_vera_handoffs(staff_id,'assign',handoff_id,jsonb_build_object('assignee',staff_id),0);
 PERFORM public.vancore_vera_handoffs(staff_id,'review',handoff_id,'{"body":"QA-only review: verify the source data and measure queue waiting time before selecting a target. ROLLBACK."}',1);
 state:=public.vancore_vera('analysis_read',owner_id,NULL,NULL,draft_id);
 IF jsonb_array_length(state->'reviews')<>1 THEN RAISE EXCEPTION 'Consultant review missing';END IF;
 BEGIN PERFORM public.vancore_vera_handoffs(foreign_id,'list');RAISE EXCEPTION 'Client staff access accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.vancore_vera('read',NULL,repeat('a',64));RAISE EXCEPTION 'Anonymous access accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF has_function_privilege('anon','public.vancore_vera_handoffs(uuid,text,uuid,jsonb,bigint)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_vera(text,uuid,text,uuid,uuid,jsonb)','EXECUTE') OR has_table_privilege('service_role','vancore_private.vera_analyses','UPDATE') OR has_table_privilege('service_role','vancore_private.vera_consultant_reviews','UPDATE') THEN RAISE EXCEPTION 'Unsafe browser or immutable-record grant';END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','writesCommitted',false,'profileCount',count(*),'profileFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')),
 'conversations',(SELECT count(*) FROM vancore_private.vera_conversations),'requests',(SELECT count(*) FROM vancore_private.vera_requests),'analyses',(SELECT count(*) FROM vancore_private.vera_analyses),'handoffs',(SELECT count(*) FROM vancore_private.vera_handoffs),'reviews',(SELECT count(*) FROM vancore_private.vera_consultant_reviews)) AS verification FROM public.users u;
