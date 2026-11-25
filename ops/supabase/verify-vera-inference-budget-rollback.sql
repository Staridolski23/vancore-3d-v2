BEGIN;
SET LOCAL ROLE service_role;
DO $$
DECLARE granted jsonb;blocked jsonb;
BEGIN
 -- Reset only aggregate counters inside this transaction; ROLLBACK preserves live values.
 INSERT INTO vancore_private.vera_inference_budget(provider,day,minute_started) VALUES('groq',(clock_timestamp() AT TIME ZONE 'UTC')::date,clock_timestamp()) ON CONFLICT(provider) DO NOTHING;
 UPDATE vancore_private.vera_inference_budget SET day=(clock_timestamp() AT TIME ZONE 'UTC')::date,used=0,requests=0,minute_used=0,minute_requests=0,minute_started=clock_timestamp(),cooldown_until='-infinity',lease=NULL,lease_until=NULL WHERE provider='groq';
 granted:=public.vancore_vera_inference_budget('reserve','groq',1000);
 IF granted->>'allowed'<>'true' THEN RAISE EXCEPTION 'Inference reservation failed';END IF;
 blocked:=public.vancore_vera_inference_budget('reserve','groq',1000);
 IF blocked->>'allowed'<>'false' THEN RAISE EXCEPTION 'Parallel inference admitted';END IF;
 blocked:=public.vancore_vera_inference_budget('release','groq',0,gen_random_uuid(),0);
 IF blocked->>'allowed'<>'false' THEN RAISE EXCEPTION 'Foreign inference lease released';END IF;
 blocked:=public.vancore_vera_inference_budget('release','groq',0,(granted->>'lease')::uuid,120);
 IF blocked->>'allowed'<>'true' THEN RAISE EXCEPTION 'Owned inference lease unavailable';END IF;
 blocked:=public.vancore_vera_inference_budget('reserve','groq',1000);
 IF blocked->>'allowed'<>'false' THEN RAISE EXCEPTION 'Provider cooldown ignored';END IF;
 IF (SELECT used FROM vancore_private.vera_inference_budget WHERE provider='groq')<>1000 THEN RAISE EXCEPTION 'Attempt budget was refunded';END IF;
END $$;
RESET ROLE;
DO $$BEGIN
 IF has_function_privilege('anon','public.vancore_vera_inference_budget(text,text,integer,uuid,integer)','EXECUTE') OR has_function_privilege('authenticated','public.vancore_vera_inference_budget(text,text,integer,uuid,integer)','EXECUTE') OR has_table_privilege('authenticated','vancore_private.vera_inference_budget','SELECT') OR has_table_privilege('service_role','vancore_private.vera_inference_budget','DELETE') THEN RAISE EXCEPTION 'Unsafe inference admission grant';END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','writesCommitted',false,'profiles',count(*),'profileFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'')),'inferenceProviderRows',(SELECT count(*) FROM vancore_private.vera_inference_budget),'requests',(SELECT count(*) FROM vancore_private.vera_requests)) verification FROM public.users u;
