-- Preserve the existing ledger and all history; retire anonymous access at the
-- database boundary too, so an older application cannot reopen visitor access.
ALTER FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) RENAME TO vera_ledger_v1;
ALTER FUNCTION public.vera_ledger_v1(text,uuid,text,uuid,uuid,jsonb) SET SCHEMA vancore_private;
REVOKE ALL ON FUNCTION vancore_private.vera_ledger_v1(text,uuid,text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_ledger_v1(text,uuid,text,uuid,uuid,jsonb) TO service_role;

CREATE FUNCTION public.vancore_vera(p_action text,p_user uuid DEFAULT NULL,p_cap text DEFAULT NULL,p_conversation uuid DEFAULT NULL,p_request uuid DEFAULT NULL,p_input jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user<>'service_role' OR p_user IS NULL OR p_cap IS NOT NULL THEN
  RAISE EXCEPTION 'Registered account required' USING ERRCODE='42501';
 END IF;
 RETURN vancore_private.vera_ledger_v1(p_action,p_user,NULL,p_conversation,p_request,p_input);
END $$;
REVOKE ALL ON FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) TO service_role;
