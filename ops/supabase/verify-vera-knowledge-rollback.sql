BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE method jsonb; saved jsonb; selected jsonb; scenario jsonb; actor uuid; client_id uuid; conv uuid:=gen_random_uuid(); turn_id uuid:=gen_random_uuid(); started jsonb; body text:=repeat('QA-only public source text, not actual law. ',40); credits_before integer; refs integer;
BEGIN
 SELECT id INTO actor FROM public.users WHERE role='admin' ORDER BY id LIMIT 1;
 SELECT id,credits INTO client_id,credits_before FROM public.users WHERE role='client' AND plan='starter' AND credits>0 ORDER BY id LIMIT 1;
 IF actor IS NULL OR client_id IS NULL THEN RAISE EXCEPTION 'Acceptance identities unavailable';END IF;
 method:=public.vancore_vera_knowledge('method','{"sourceId":"vancore-business-method"}');
 IF method->>'content' NOT LIKE '%cash flow%' THEN RAISE EXCEPTION 'Business methodology missing';END IF;
 saved:=public.vancore_vera_knowledge('ingest',jsonb_build_object('sourceId','bg-obligations','url','https://justice.government.bg/home/normdoc/2121934337','content',body,'sha256',repeat('b',64),'chunks',jsonb_build_array(jsonb_build_object('label','QA-only article','body','QA-only synthetic public contract terms for knowledge ROLLBACK acceptance.'))));
 selected:=public.vancore_vera_knowledge('select',jsonb_build_object('sourceId','bg-obligations','versionId',saved->>'versionId','query','contract terms'));
 IF jsonb_array_length(selected->'chunks')<>1 THEN RAISE EXCEPTION 'Archived full-text retrieval unavailable';END IF;
 BEGIN PERFORM public.vancore_vera_knowledge('ingest',jsonb_build_object('sourceId','bg-obligations','url','https://attacker.invalid','content',body,'sha256',repeat('b',64),'chunks','[]'::jsonb));RAISE EXCEPTION 'Forged source accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 PERFORM public.vancore_vera('open',client_id,NULL,conv);
 started:=public.vancore_vera('begin',client_id,NULL,conv,turn_id,'{"message":"QA-only synthetic case: 17 orders.","expectedVersion":0}');
 BEGIN PERFORM public.vancore_vera('finish',client_id,NULL,conv,turn_id,jsonb_build_object('lease',started->>'lease','reply','QA-only AI reply','mode','ai','knowledgeRefs',jsonb_build_array(gen_random_uuid())));RAISE EXCEPTION 'Unknown provenance accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 IF (SELECT credits FROM public.users WHERE id=client_id)<>credits_before THEN RAISE EXCEPTION 'Rejected provenance consumed a question';END IF;
 PERFORM public.vancore_vera('finish',client_id,NULL,conv,turn_id,jsonb_build_object('lease',started->>'lease','reply','QA-only AI reply','mode','ai','model','synthetic-rollback-only','knowledgeRefs',jsonb_build_array(method->>'versionId')));
 SELECT count(*) INTO refs FROM vancore_private.vera_request_knowledge WHERE request_id=turn_id AND version_id=(method->>'versionId')::uuid;
 IF refs<>1 THEN RAISE EXCEPTION 'Answer provenance not saved';END IF;
 scenario:=public.vancore_vera_knowledge('scenario','{"scenarioId":"dialogue-greeting-v1"}',actor);
 PERFORM public.vancore_vera_knowledge('evaluation',jsonb_build_object('scenarioId','dialogue-greeting-v1','lease',scenario->>'lease','mode','limited','output','QA-only result; no real model call.','checks',jsonb_build_object('rollbackFixture',true)),actor);
 IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_evaluation_runs WHERE actor_id=actor AND human_review_status='pending') THEN RAISE EXCEPTION 'Evaluation archival unavailable';END IF;
 BEGIN PERFORM public.vancore_vera_knowledge('scenario','{"scenarioId":"dialogue-greeting-v1"}',client_id);RAISE EXCEPTION 'Client evaluation accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
DO $$ DECLARE t text;BEGIN
 IF has_function_privilege('anon','public.vancore_vera_knowledge(text,jsonb,uuid)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_vera_knowledge(text,jsonb,uuid)','EXECUTE') OR has_function_privilege('authenticated','vancore_private.vera_casework_v1(text,uuid,text,uuid,uuid,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Unsafe browser RPC grants';END IF;
 FOREACH t IN ARRAY ARRAY['vera_knowledge_sources','vera_knowledge_versions','vera_knowledge_chunks','vera_knowledge_checks','vera_request_knowledge','vera_evaluation_scenarios','vera_evaluation_runs'] LOOP
  IF has_table_privilege('anon','vancore_private.'||t,'SELECT') OR has_table_privilege('authenticated','vancore_private.'||t,'SELECT') OR has_table_privilege('service_role','vancore_private.'||t,'UPDATE') OR has_table_privilege('service_role','vancore_private.'||t,'DELETE') THEN RAISE EXCEPTION 'Unsafe corpus grant';END IF;
 END LOOP;
END $$;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','writesCommitted',false,'profiles',count(*),'profileFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')),
 'versions',(SELECT count(*) FROM vancore_private.vera_knowledge_versions),'evaluationRuns',(SELECT count(*) FROM vancore_private.vera_evaluation_runs),'caseKnowledgeLinks',(SELECT count(*) FROM vancore_private.vera_request_knowledge)) AS verification FROM public.users u;
