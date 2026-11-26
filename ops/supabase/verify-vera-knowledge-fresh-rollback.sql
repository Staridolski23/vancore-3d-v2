BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE body text:=repeat('QA-only synthetic source for dated retrieval; not law. ',30);saved jsonb;selected jsonb;
BEGIN
 saved:=public.vancore_vera_knowledge('ingest',jsonb_build_object('sourceId','bg-obligations','url','https://justice.government.bg/home/normdoc/2121934337','content',body,'sha256',repeat('c',64),'chunks',jsonb_build_array(jsonb_build_object('label','QA-only article','body','QA-only synthetic contract text for dated source retrieval; not actual law.'))));
 selected:=public.vancore_vera_knowledge_fresh('bg-obligations','synthetic contract','[]');
 IF selected->>'available'<>'true' OR selected->>'versionId' IS DISTINCT FROM saved->>'versionId' OR jsonb_array_length(selected->'chunks')<>1 THEN RAISE EXCEPTION 'Dated preserved source unavailable';END IF;
 PERFORM public.vancore_vera_knowledge('unavailable','{"sourceId":"bg-obligations"}');
 selected:=public.vancore_vera_knowledge_fresh('bg-obligations','synthetic contract','[]');
 IF selected->>'available'<>'false' THEN RAISE EXCEPTION 'Failed source observation ignored';END IF;
END $$;
RESET ROLE;
DO $$BEGIN
 IF has_function_privilege('anon','public.vancore_vera_knowledge_fresh(text,text,jsonb)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_vera_knowledge_fresh(text,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Unsafe browser retrieval privilege';END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','writesCommitted',false,'profileFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')),'sourceVersions',(SELECT count(*) FROM vancore_private.vera_knowledge_versions),'sourceChunks',(SELECT count(*) FROM vancore_private.vera_knowledge_chunks)) AS verification FROM public.users u;
