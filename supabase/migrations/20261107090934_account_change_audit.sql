-- Privileged account changes are atomic with their append-only audit record.
-- Called only by the verified Next server using service_role. No browser grant.
CREATE TABLE vancore_private.account_change_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL,
 target_id uuid NOT NULL,
 before_values jsonb NOT NULL,
 after_values jsonb NOT NULL,
 note text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE vancore_private.account_change_audit ENABLE ROW LEVEL SECURITY;
CREATE INDEX account_change_audit_target_time ON vancore_private.account_change_audit(target_id,created_at DESC,id);
REVOKE ALL ON vancore_private.account_change_audit FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA vancore_private TO service_role;
GRANT INSERT,SELECT ON vancore_private.account_change_audit TO service_role;

CREATE FUNCTION vancore_private.touch_profile_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN NEW.updated_at:=clock_timestamp(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION vancore_private.touch_profile_updated_at() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION vancore_private.touch_profile_updated_at() TO authenticated,service_role;
CREATE TRIGGER vancore_touch_profile_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION vancore_private.touch_profile_updated_at();

CREATE FUNCTION public.vancore_admin_update_account(p_actor uuid,p_target uuid,p_change jsonb,p_expected_updated_at timestamptz DEFAULT NULL,p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE previous public.users%ROWTYPE; changed public.users%ROWTYPE;
 before_state jsonb; after_state jsonb; next_credits bigint; audit_id uuid;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
 -- Serialize privileged changes, including concurrent last-admin decisions.
 PERFORM pg_catalog.pg_advisory_xact_lock(861026,701);
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND role='admin') THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
 IF p_change IS NULL OR jsonb_typeof(p_change)<>'object' OR p_change='{}'::jsonb OR
    EXISTS(SELECT 1 FROM jsonb_object_keys(p_change) k WHERE k NOT IN ('role','plan','credits','creditDelta','subscription_status')) OR
    length(coalesce(p_note,''))>500 THEN RAISE EXCEPTION 'Invalid account change' USING ERRCODE='22023'; END IF;
 IF (p_change ? 'role' AND (jsonb_typeof(p_change->'role')<>'string' OR p_change->>'role' NOT IN ('client','consultant','admin'))) OR
    (p_change ? 'plan' AND (jsonb_typeof(p_change->'plan')<>'string' OR p_change->>'plan' NOT IN ('starter','payg','professional','business'))) OR
    (p_change ? 'subscription_status' AND (jsonb_typeof(p_change->'subscription_status')<>'string' OR p_change->>'subscription_status' NOT IN ('free','active'))) OR
    (p_change ? 'plan' AND NOT p_change ? 'subscription_status') OR
    (p_change ? 'credits' AND p_change ? 'creditDelta') THEN RAISE EXCEPTION 'Invalid account change' USING ERRCODE='22023'; END IF;
 IF (p_change ? 'credits' AND (jsonb_typeof(p_change->'credits')<>'number' OR (p_change->>'credits') !~ '^(0|[1-9][0-9]{0,9})$')) OR
    (p_change ? 'creditDelta' AND (jsonb_typeof(p_change->'creditDelta')<>'number' OR (p_change->>'creditDelta') !~ '^-?(0|[1-9][0-9]{0,9})$')) THEN RAISE EXCEPTION 'Invalid credit amount' USING ERRCODE='22023'; END IF;
 SELECT * INTO previous FROM public.users WHERE id=p_target FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account not found' USING ERRCODE='P0002'; END IF;
 IF previous.updated_at IS DISTINCT FROM p_expected_updated_at THEN RAISE EXCEPTION 'Account changed; reload before retrying' USING ERRCODE='40001'; END IF;
 IF previous.role='admin' AND p_change ? 'role' AND p_change->>'role'<>'admin' THEN
  IF p_actor=p_target THEN RAISE EXCEPTION 'Another administrator must change your role' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE role='admin' AND id<>p_target) THEN RAISE EXCEPTION 'An administrator must remain' USING ERRCODE='22023'; END IF;
 END IF;
 next_credits:=CASE WHEN p_change ? 'credits' THEN (p_change->>'credits')::bigint ELSE coalesce(previous.credits,0)+coalesce((p_change->>'creditDelta')::bigint,0) END;
 IF next_credits<0 OR next_credits>2147483647 THEN RAISE EXCEPTION 'Credits out of range' USING ERRCODE='22023'; END IF;
 before_state:=jsonb_build_object('role',previous.role,'plan',previous.plan,'credits',previous.credits,'subscription_status',previous.subscription_status);
 after_state:=jsonb_build_object('role',coalesce(p_change->>'role',previous.role),'plan',coalesce(p_change->>'plan',previous.plan),'credits',next_credits,'subscription_status',coalesce(p_change->>'subscription_status',previous.subscription_status));
 IF before_state=after_state THEN RETURN jsonb_build_object('account',to_jsonb(previous),'auditId',NULL,'changed',false); END IF;
 UPDATE public.users SET role=after_state->>'role',plan=after_state->>'plan',credits=next_credits::integer,subscription_status=after_state->>'subscription_status',updated_at=clock_timestamp() WHERE id=p_target RETURNING * INTO changed;
 INSERT INTO vancore_private.account_change_audit(actor_id,target_id,before_values,after_values,note)
 VALUES(p_actor,p_target,before_state,after_state,nullif(btrim(p_note),'')) RETURNING id INTO audit_id;
 RETURN jsonb_build_object('account',to_jsonb(changed),'auditId',audit_id,'changed',true);
END $$;
REVOKE ALL ON FUNCTION public.vancore_admin_update_account(uuid,uuid,jsonb,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_admin_update_account(uuid,uuid,jsonb,timestamptz,text) TO service_role;

CREATE FUNCTION public.vancore_admin_account_audit(p_actor uuid,p_target uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE history jsonb;
BEGIN
 IF current_user<>'service_role' OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND role='admin') THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(recent) ORDER BY recent.created_at DESC,recent.id),'[]'::jsonb) INTO history FROM (
  SELECT a.id,a.actor_id,u.name AS actor_name,a.before_values,a.after_values,a.note,a.created_at
  FROM vancore_private.account_change_audit a LEFT JOIN public.users u ON u.id=a.actor_id
  WHERE a.target_id=p_target ORDER BY a.created_at DESC,a.id LIMIT 50
 ) recent;
 RETURN history;
END $$;
REVOKE ALL ON FUNCTION public.vancore_admin_account_audit(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_admin_account_audit(uuid,uuid) TO service_role;
