-- Two bounded global provider counters, no customer text, identity or secrets.
CREATE TABLE vancore_private.vera_inference_budget (
 provider text PRIMARY KEY CHECK(provider IN('groq','cloudflare')),
 day date NOT NULL,used integer NOT NULL DEFAULT 0 CHECK(used>=0),requests integer NOT NULL DEFAULT 0 CHECK(requests>=0),
 minute_started timestamptz NOT NULL,minute_used integer NOT NULL DEFAULT 0 CHECK(minute_used>=0),minute_requests integer NOT NULL DEFAULT 0 CHECK(minute_requests>=0),
 cooldown_until timestamptz NOT NULL DEFAULT '-infinity',lease uuid,lease_until timestamptz
);
ALTER TABLE vancore_private.vera_inference_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON vancore_private.vera_inference_budget FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON vancore_private.vera_inference_budget TO service_role;
CREATE FUNCTION public.vancore_vera_inference_budget(p_action text,p_provider text,p_units integer DEFAULT 0,p_lease uuid DEFAULT NULL,p_retry integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE t timestamptz:=clock_timestamp();d date:=(t AT TIME ZONE 'UTC')::date;r vancore_private.vera_inference_budget;token uuid;daily_max integer;minute_max integer;request_max integer;
BEGIN
 IF p_provider NOT IN('groq','cloudflare') OR p_provider IS NULL OR p_action NOT IN('reserve','release') OR p_action IS NULL THEN RAISE EXCEPTION 'Invalid inference operation' USING ERRCODE='22023';END IF;
 IF p_action='release' THEN
  IF p_lease IS NULL OR p_retry IS NULL OR p_retry<0 OR p_retry>86400 THEN RAISE EXCEPTION 'Invalid inference release' USING ERRCODE='22023';END IF;
  UPDATE vancore_private.vera_inference_budget SET lease=NULL,lease_until=NULL,cooldown_until=greatest(cooldown_until,t+make_interval(secs=>p_retry)) WHERE provider=p_provider AND lease=p_lease;
  RETURN jsonb_build_object('allowed',FOUND);
 END IF;
 IF p_units IS NULL OR p_units<1 OR p_units>100000 THEN RAISE EXCEPTION 'Invalid inference reservation' USING ERRCODE='22023';END IF;
 INSERT INTO vancore_private.vera_inference_budget(provider,day,minute_started) VALUES(p_provider,d,t) ON CONFLICT(provider) DO NOTHING;
 SELECT * INTO r FROM vancore_private.vera_inference_budget WHERE provider=p_provider FOR UPDATE;
 IF r.day<>d THEN r.day:=d;r.used:=0;r.requests:=0;END IF;
 IF t>=r.minute_started+interval '60 seconds' THEN r.minute_started:=t;r.minute_used:=0;r.minute_requests:=0;END IF;
 IF r.cooldown_until>t THEN RETURN jsonb_build_object('allowed',false,'retryAfterSeconds',ceil(extract(epoch FROM r.cooldown_until-t)));END IF;
 IF r.lease IS NOT NULL AND r.lease_until>t THEN RETURN jsonb_build_object('allowed',false,'retryAfterSeconds',ceil(extract(epoch FROM r.lease_until-t)));END IF;
 daily_max:=CASE WHEN p_provider='cloudflare' THEN 8000 ELSE 100000 END;
 minute_max:=CASE WHEN p_provider='cloudflare' THEN 2000 ELSE 7500 END;
 request_max:=CASE WHEN p_provider='cloudflare' THEN 100 ELSE 300 END;
 IF r.used+p_units>daily_max OR r.requests>=request_max THEN RETURN jsonb_build_object('allowed',false,'retryAfterSeconds',ceil(extract(epoch FROM ((d+1)::timestamp AT TIME ZONE 'UTC')-t)));END IF;
 IF r.minute_used+p_units>minute_max OR r.minute_requests>=6 THEN RETURN jsonb_build_object('allowed',false,'retryAfterSeconds',60);END IF;
 token:=gen_random_uuid();
 UPDATE vancore_private.vera_inference_budget SET day=d,used=r.used+p_units,requests=r.requests+1,minute_started=r.minute_started,minute_used=r.minute_used+p_units,minute_requests=r.minute_requests+1,lease=token,lease_until=t+interval '75 seconds' WHERE provider=p_provider;
 RETURN jsonb_build_object('allowed',true,'lease',token);
END $$;
REVOKE ALL ON FUNCTION public.vancore_vera_inference_budget(text,text,integer,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera_inference_budget(text,text,integer,uuid,integer) TO service_role;
