-- Additive canonical Vera store. No historical conversation/report rows change.
CREATE TABLE vancore_private.vera_actors (
 owner_key text PRIMARY KEY, user_id uuid UNIQUE REFERENCES public.users(id),
 anonymous_credits integer NOT NULL DEFAULT 5 CHECK (anonymous_credits>=0),
 starter_used integer NOT NULL DEFAULT 0 CHECK (starter_used BETWEEN 0 AND 5),
 lead jsonb, expires_at timestamptz,
 rate_started timestamptz NOT NULL DEFAULT clock_timestamp(), rate_requests integer NOT NULL DEFAULT 0,
 CHECK ((user_id IS NOT NULL AND owner_key='user:'||user_id::text AND expires_at IS NULL) OR
        (user_id IS NULL AND owner_key ~ '^anon:[a-f0-9]{64}$' AND expires_at IS NOT NULL))
);
CREATE TABLE vancore_private.vera_conversations (
 id uuid PRIMARY KEY, owner_key text NOT NULL REFERENCES vancore_private.vera_actors(owner_key),
 title text NOT NULL DEFAULT 'New conversation', version bigint NOT NULL DEFAULT 0,
 active_request uuid, created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX vera_conversations_owner_time ON vancore_private.vera_conversations(owner_key,updated_at DESC,id);
CREATE TABLE vancore_private.vera_requests (
 id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES vancore_private.vera_conversations(id),
 message text NOT NULL CHECK(length(message) BETWEEN 1 AND 6000),
 status text NOT NULL CHECK(status IN ('generating','complete','failed')),
 reply text CHECK(length(reply)<=16000), mode text CHECK(mode IN ('ai','limited')), model text CHECK(length(model)<=150),
 lease uuid NOT NULL, lease_expires_at timestamptz NOT NULL, uses_credit boolean NOT NULL,
 credit_plan text NOT NULL,
 charged boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 completed_at timestamptz
);
CREATE INDEX vera_requests_conversation_time ON vancore_private.vera_requests(conversation_id,created_at,id);
CREATE INDEX vera_requests_pending ON vancore_private.vera_requests(conversation_id,lease_expires_at) WHERE status='generating';
CREATE TABLE vancore_private.vera_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES vancore_private.vera_conversations(id),
 version bigint NOT NULL,title text NOT NULL,content jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(conversation_id,version)
);
CREATE INDEX vera_reports_conversation_time ON vancore_private.vera_reports(conversation_id,created_at DESC,id);
ALTER TABLE vancore_private.vera_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON vancore_private.vera_actors,vancore_private.vera_conversations,vancore_private.vera_requests FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON vancore_private.vera_actors,vancore_private.vera_conversations,vancore_private.vera_requests TO service_role;
REVOKE ALL ON vancore_private.vera_reports FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON vancore_private.vera_reports TO service_role;

CREATE FUNCTION vancore_private.vera_expiry(value text) RETURNS timestamptz
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RETURN nullif(value,'')::timestamptz;
EXCEPTION WHEN OTHERS THEN RETURN '-infinity'::timestamptz; END $$;
REVOKE ALL ON FUNCTION vancore_private.vera_expiry(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_expiry(text) TO service_role;

CREATE FUNCTION vancore_private.vera_quota(p_user uuid,p_owner text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; remaining integer; plan text:='starter'; valid_until timestamptz; unlimited boolean:=false; allowed boolean:=false;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
 IF p_user IS NULL THEN
  SELECT anonymous_credits,expires_at INTO remaining,valid_until FROM vancore_private.vera_actors WHERE owner_key=p_owner;
  remaining:=coalesce(remaining,5); allowed:=remaining>0 AND (valid_until IS NULL OR valid_until>clock_timestamp());
 ELSE
  SELECT * INTO u FROM public.users WHERE id=p_user;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
  plan:=u.plan; remaining:=greatest(coalesce(u.credits,0),0); valid_until:=vancore_private.vera_expiry(u.subscription_end);
  IF plan='starter' THEN remaining:=least(remaining,greatest(5-coalesce((SELECT starter_used FROM vancore_private.vera_actors WHERE owner_key=p_owner),0),0)); END IF;
  unlimited:=plan IN ('professional','business') AND u.subscription_status='active' AND (valid_until IS NULL OR valid_until>clock_timestamp());
  allowed:=unlimited OR (plan='starter' AND remaining>0) OR (plan='payg' AND u.subscription_status='active' AND valid_until>clock_timestamp() AND remaining>0);
 END IF;
 IF NOT coalesce(allowed,false) THEN remaining:=0; END IF;
 RETURN jsonb_build_object('plan',coalesce(plan,'unavailable'),'remaining',CASE WHEN unlimited THEN NULL ELSE remaining END,'unlimited',unlimited,'allowed',coalesce(allowed,false),'validUntil',valid_until);
END $$;
REVOKE ALL ON FUNCTION vancore_private.vera_quota(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_quota(uuid,text) TO service_role;

CREATE FUNCTION vancore_private.vera_view(p_owner text,p_conversation uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE selected vancore_private.vera_conversations%ROWTYPE; items jsonb; turns jsonb;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
 SELECT * INTO selected FROM vancore_private.vera_conversations WHERE owner_key=p_owner AND (p_conversation IS NULL OR id=p_conversation) ORDER BY updated_at DESC,id LIMIT 1;
 SELECT coalesce(jsonb_agg(to_jsonb(recent) ORDER BY recent.updated_at DESC,recent.id),'[]') INTO items FROM (
  SELECT id,title,version,created_at,updated_at FROM vancore_private.vera_conversations WHERE owner_key=p_owner ORDER BY updated_at DESC,id LIMIT 50
 ) recent;
 IF selected.id IS NULL THEN RETURN jsonb_build_object('conversation',NULL,'conversations',items,'requests','[]'::jsonb,'reports','[]'::jsonb); END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(recent) ORDER BY recent.created_at,recent.id),'[]') INTO turns FROM (
  SELECT id,message,status,reply,mode,model,charged,created_at,completed_at FROM vancore_private.vera_requests WHERE conversation_id=selected.id ORDER BY created_at DESC,id DESC LIMIT 100
 ) recent;
 RETURN jsonb_build_object('conversation',jsonb_build_object('id',selected.id,'title',selected.title,'version',selected.version,'pending',selected.active_request IS NOT NULL),
  'conversations',items,'requests',turns,'hasOlderRequests',(SELECT count(*)>100 FROM vancore_private.vera_requests WHERE conversation_id=selected.id),
  'reports',(SELECT coalesce(jsonb_agg(to_jsonb(recent) ORDER BY recent.created_at DESC,recent.id),'[]') FROM (SELECT r.id,r.conversation_id,r.title,r.version,r.created_at FROM vancore_private.vera_reports r JOIN vancore_private.vera_conversations c ON c.id=r.conversation_id WHERE c.owner_key=p_owner ORDER BY r.created_at DESC,r.id LIMIT 50) recent));
END $$;
REVOKE ALL ON FUNCTION vancore_private.vera_view(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_view(text,uuid) TO service_role;

CREATE FUNCTION public.vancore_vera(p_action text,p_user uuid DEFAULT NULL,p_cap text DEFAULT NULL,p_conversation uuid DEFAULT NULL,p_request uuid DEFAULT NULL,p_input jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE owner text; actor vancore_private.vera_actors%ROWTYPE; conversation vancore_private.vera_conversations%ROWTYPE;
 turn vancore_private.vera_requests%ROWTYPE; saved_report vancore_private.vera_reports%ROWTYPE; quota jsonb; context jsonb; held integer; lease_id uuid; value text; now_at timestamptz:=clock_timestamp();
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('read','open','begin','finish','report','report_read') OR p_input IS NULL OR jsonb_typeof(p_input) IS DISTINCT FROM 'object' OR (p_user IS NULL)=(p_cap IS NULL) OR (p_cap IS NOT NULL AND p_cap !~ '^[a-f0-9]{64}$') THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023'; END IF;
 owner:=CASE WHEN p_user IS NULL THEN 'anon:'||p_cap ELSE 'user:'||p_user::text END;
 IF p_user IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_user) THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
 IF p_action='open' THEN
  IF p_conversation IS NULL THEN RAISE EXCEPTION 'Conversation required' USING ERRCODE='22023'; END IF;
  IF p_user IS NULL AND NOT EXISTS(SELECT 1 FROM vancore_private.vera_actors WHERE owner_key=owner) THEN
   IF p_input->'lead'->'consentTerms' IS DISTINCT FROM 'true'::jsonb OR p_input->'lead'->'consentData' IS DISTINCT FROM 'true'::jsonb
    OR jsonb_typeof(p_input->'lead'->'name') IS DISTINCT FROM 'string' OR length(btrim(p_input->'lead'->>'name')) NOT BETWEEN 1 AND 150
    OR jsonb_typeof(p_input->'lead'->'email') IS DISTINCT FROM 'string' OR length(p_input->'lead'->>'email')>254 OR (p_input->'lead'->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    OR length(coalesce(p_input->'lead'->>'company',''))>200 OR length(coalesce(p_input->'lead'->>'phone',''))>80 THEN RAISE EXCEPTION 'Lead and explicit choices required' USING ERRCODE='22023'; END IF;
  END IF;
  INSERT INTO vancore_private.vera_actors(owner_key,user_id,expires_at,lead) VALUES(owner,p_user,CASE WHEN p_user IS NULL THEN now_at+interval '30 days' ELSE NULL END,
   CASE WHEN p_user IS NULL THEN jsonb_build_object('name',p_input->'lead'->>'name','email',p_input->'lead'->>'email','company',p_input->'lead'->>'company','phone',p_input->'lead'->>'phone','consentTerms',true,'consentData',true,'consentMarketing',p_input->'lead'->'consentMarketing'='true'::jsonb,'policyVersion','site-2026-11-08','capturedAt',now_at) ELSE NULL END) ON CONFLICT DO NOTHING;
 END IF;
 SELECT * INTO actor FROM vancore_private.vera_actors WHERE owner_key=owner FOR UPDATE;
 IF NOT FOUND THEN
  IF p_action='read' AND p_conversation IS NULL THEN RETURN jsonb_build_object('state','empty','quota',vancore_private.vera_quota(p_user,owner),'conversation',NULL,'conversations','[]'::jsonb,'requests','[]'::jsonb); END IF;
  RAISE EXCEPTION 'Conversation not found' USING ERRCODE='P0002';
 END IF;
 IF actor.expires_at<=now_at THEN RETURN jsonb_build_object('state','expired'); END IF;
 IF p_user IS NOT NULL THEN PERFORM 1 FROM public.users WHERE id=p_user FOR UPDATE; END IF;
 -- Expired generations never consumed credit. Fence their completions before retry.
 UPDATE vancore_private.vera_requests r SET status='failed' WHERE status='generating' AND lease_expires_at<=now_at AND EXISTS(SELECT 1 FROM vancore_private.vera_conversations c WHERE c.id=r.conversation_id AND c.owner_key=owner);
 UPDATE vancore_private.vera_conversations c SET active_request=NULL,version=version+1 WHERE owner_key=owner AND active_request IS NOT NULL AND NOT EXISTS(SELECT 1 FROM vancore_private.vera_requests r WHERE r.id=c.active_request AND r.status='generating');
 quota:=vancore_private.vera_quota(p_user,owner);
 IF p_action='report_read' THEN
  SELECT r.* INTO saved_report FROM vancore_private.vera_reports r JOIN vancore_private.vera_conversations c ON c.id=r.conversation_id WHERE r.id=p_request AND c.owner_key=owner;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE='P0002'; END IF;
  RETURN jsonb_build_object('state','report','report',to_jsonb(saved_report));
 END IF;
 IF p_action='open' THEN
  INSERT INTO vancore_private.vera_conversations(id,owner_key) VALUES(p_conversation,owner) ON CONFLICT DO NOTHING;
 END IF;
 IF p_conversation IS NOT NULL AND NOT EXISTS(SELECT 1 FROM vancore_private.vera_conversations WHERE id=p_conversation AND owner_key=owner) THEN RAISE EXCEPTION 'Conversation not found' USING ERRCODE='P0002'; END IF;
 IF p_action IN ('read','open') THEN RETURN jsonb_build_object('state','ready','quota',quota)||vancore_private.vera_view(owner,p_conversation); END IF;
 IF p_action='report' THEN
  SELECT * INTO conversation FROM vancore_private.vera_conversations WHERE id=p_conversation AND owner_key=owner FOR UPDATE;
  IF conversation.id IS NULL THEN RAISE EXCEPTION 'Conversation not found' USING ERRCODE='P0002'; END IF;
  IF conversation.active_request IS NOT NULL THEN RAISE EXCEPTION 'Wait for the current answer' USING ERRCODE='40001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_requests WHERE conversation_id=p_conversation AND status='complete') THEN RAISE EXCEPTION 'No completed conversation to report' USING ERRCODE='22023'; END IF;
  context:=vancore_private.vera_view(owner,p_conversation);
  INSERT INTO vancore_private.vera_reports(conversation_id,version,title,content) VALUES(p_conversation,conversation.version,conversation.title,
   jsonb_build_object('kind','preliminary-conversation-brief','conversationId',p_conversation,'conversationVersion',conversation.version,'sourceRequests',context->'requests','partialHistory',context->'hasOlderRequests','disclosure','User statements are unverified. Vera responses are preliminary AI analysis; limited responses are labelled. No independent assessment or human review has been completed.')) ON CONFLICT(conversation_id,version) DO NOTHING;
  SELECT * INTO saved_report FROM vancore_private.vera_reports WHERE conversation_id=p_conversation AND version=conversation.version;
  RETURN jsonb_build_object('state','report_saved','reportId',saved_report.id,'quota',quota)||vancore_private.vera_view(owner,p_conversation);
 END IF;
 IF p_request IS NULL OR p_conversation IS NULL THEN RAISE EXCEPTION 'Request and conversation required' USING ERRCODE='22023'; END IF;
 SELECT * INTO conversation FROM vancore_private.vera_conversations WHERE id=p_conversation AND owner_key=owner FOR UPDATE;
 SELECT * INTO turn FROM vancore_private.vera_requests WHERE id=p_request;
 IF turn.id IS NOT NULL AND turn.conversation_id<>p_conversation THEN RAISE EXCEPTION 'Request not found' USING ERRCODE='P0002'; END IF;
 IF p_action='begin' THEN
  value:=btrim(p_input->>'message');
  IF jsonb_typeof(p_input->'message')<>'string' OR coalesce(length(value),0) NOT BETWEEN 1 AND 6000 THEN RAISE EXCEPTION 'Invalid message' USING ERRCODE='22023'; END IF;
  IF turn.id IS NOT NULL AND turn.message<>value THEN RAISE EXCEPTION 'Request ID reused for another message' USING ERRCODE='40001'; END IF;
  IF turn.status='complete' THEN RETURN jsonb_build_object('state','complete','quota',quota,'requestId',turn.id)||vancore_private.vera_view(owner,p_conversation); END IF;
  IF conversation.active_request IS NOT NULL THEN RETURN jsonb_build_object('state','pending','retryAfterSeconds',3,'quota',quota)||vancore_private.vera_view(owner,p_conversation); END IF;
  IF (p_input->>'expectedVersion') IS DISTINCT FROM conversation.version::text THEN RAISE EXCEPTION 'Conversation changed' USING ERRCODE='40001'; END IF;
  IF NOT (quota->>'allowed')::boolean THEN RETURN jsonb_build_object('state','quota','quota',quota)||vancore_private.vera_view(owner,p_conversation); END IF;
  SELECT count(*) INTO held FROM vancore_private.vera_requests r JOIN vancore_private.vera_conversations c ON c.id=r.conversation_id WHERE c.owner_key=owner AND r.status='generating' AND r.uses_credit AND r.lease_expires_at>now_at;
  IF NOT (quota->>'unlimited')::boolean AND held>=(quota->>'remaining')::integer THEN RETURN jsonb_build_object('state','pending','retryAfterSeconds',3,'quota',quota)||vancore_private.vera_view(owner,p_conversation); END IF;
  IF actor.rate_started+interval '1 minute'<=now_at THEN UPDATE vancore_private.vera_actors SET rate_started=now_at,rate_requests=1 WHERE owner_key=owner;
  ELSIF actor.rate_requests>=20 THEN RETURN jsonb_build_object('state','rate_limited','retryAfterSeconds',60);
  ELSE UPDATE vancore_private.vera_actors SET rate_requests=rate_requests+1 WHERE owner_key=owner; END IF;
  lease_id:=gen_random_uuid();
  INSERT INTO vancore_private.vera_requests(id,conversation_id,message,status,lease,lease_expires_at,uses_credit,credit_plan) VALUES(p_request,p_conversation,value,'generating',lease_id,now_at+interval '2 minutes',NOT (quota->>'unlimited')::boolean,quota->>'plan')
   ON CONFLICT(id) DO UPDATE SET status='generating',reply=NULL,mode=NULL,model=NULL,charged=false,lease=excluded.lease,lease_expires_at=excluded.lease_expires_at,uses_credit=excluded.uses_credit,credit_plan=excluded.credit_plan,completed_at=NULL;
  UPDATE vancore_private.vera_conversations SET active_request=p_request,version=version+1,updated_at=now_at,title=CASE WHEN title='New conversation' THEN left(value,100) ELSE title END WHERE id=p_conversation;
  SELECT coalesce(jsonb_agg(part ORDER BY created_at,id,position),'[]') INTO context FROM (
   SELECT created_at,id,1 AS position,jsonb_build_object('role','user','content',left(message,1600)) AS part FROM (SELECT * FROM vancore_private.vera_requests WHERE conversation_id=p_conversation AND status='complete' ORDER BY created_at DESC,id DESC LIMIT 6) recent
   UNION ALL
   SELECT created_at,id,2,jsonb_build_object('role','assistant','content',left(reply,1600)) FROM (SELECT * FROM vancore_private.vera_requests WHERE conversation_id=p_conversation AND status='complete' ORDER BY created_at DESC,id DESC LIMIT 6) recent
  ) ordered;
  RETURN jsonb_build_object('state','generate','lease',lease_id,'history',context,'message',value,'quota',quota);
 END IF;
 IF turn.status='complete' THEN RETURN jsonb_build_object('state','complete','quota',quota,'requestId',turn.id)||vancore_private.vera_view(owner,p_conversation); END IF;
 IF turn.id IS NULL OR turn.status<>'generating' OR turn.lease::text IS DISTINCT FROM p_input->>'lease' OR conversation.active_request IS DISTINCT FROM p_request THEN RAISE EXCEPTION 'Generation expired or changed' USING ERRCODE='40001'; END IF;
 IF p_input->>'mode' IS NULL OR p_input->>'mode' NOT IN ('ai','limited') OR jsonb_typeof(p_input->'reply') IS DISTINCT FROM 'string' OR coalesce(length(btrim(p_input->>'reply')),0) NOT BETWEEN 1 AND 16000 THEN RAISE EXCEPTION 'Invalid provider result' USING ERRCODE='22023'; END IF;
 IF turn.uses_credit AND p_input->>'mode'='ai' THEN
  IF p_user IS NULL THEN UPDATE vancore_private.vera_actors SET anonymous_credits=anonymous_credits-1 WHERE owner_key=owner AND anonymous_credits>0;
  ELSE UPDATE public.users SET credits=credits-1 WHERE id=p_user AND credits>0; END IF;
  IF NOT FOUND THEN
   UPDATE vancore_private.vera_requests SET status='failed' WHERE id=p_request;
   UPDATE vancore_private.vera_conversations SET active_request=NULL,version=version+1 WHERE id=p_conversation;
   RETURN jsonb_build_object('state','quota','quota',quota)||vancore_private.vera_view(owner,p_conversation);
  END IF;
  IF p_user IS NOT NULL AND turn.credit_plan='starter' THEN UPDATE vancore_private.vera_actors SET starter_used=starter_used+1 WHERE owner_key=owner; END IF;
 END IF;
 UPDATE vancore_private.vera_requests SET status='complete',reply=p_input->>'reply',mode=p_input->>'mode',model=CASE WHEN p_input->>'mode'='ai' THEN left(p_input->>'model',150) ELSE NULL END,charged=turn.uses_credit AND p_input->>'mode'='ai',completed_at=now_at WHERE id=p_request;
 UPDATE vancore_private.vera_conversations SET active_request=NULL,version=version+1,updated_at=now_at WHERE id=p_conversation;
 RETURN jsonb_build_object('state','complete','requestId',p_request,'quota',vancore_private.vera_quota(p_user,owner))||vancore_private.vera_view(owner,p_conversation);
END $$;
REVOKE ALL ON FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) TO service_role;

CREATE FUNCTION vancore_private.vera_plan_changed() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF (OLD.plan,OLD.subscription_status,OLD.subscription_end) IS DISTINCT FROM (NEW.plan,NEW.subscription_status,NEW.subscription_end) THEN
  UPDATE vancore_private.vera_requests r SET status='failed' WHERE r.status='generating' AND EXISTS(SELECT 1 FROM vancore_private.vera_conversations c WHERE c.id=r.conversation_id AND c.owner_key='user:'||NEW.id::text);
  UPDATE vancore_private.vera_conversations SET active_request=NULL,version=version+1 WHERE owner_key='user:'||NEW.id::text AND active_request IS NOT NULL;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION vancore_private.vera_plan_changed() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_plan_changed() TO service_role;
CREATE TRIGGER vancore_vera_plan_changed AFTER UPDATE OF plan,subscription_status,subscription_end ON public.users FOR EACH ROW EXECUTE FUNCTION vancore_private.vera_plan_changed();

-- Confirmed PAYG activation/renewal is audited with its three-month expiry.
CREATE OR REPLACE FUNCTION public.vancore_admin_update_account(p_actor uuid,p_target uuid,p_change jsonb,p_expected_updated_at timestamptz DEFAULT NULL,p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE previous public.users%ROWTYPE; changed public.users%ROWTYPE;
 before_state jsonb; after_state jsonb; next_credits bigint; audit_id uuid; next_end text;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
 -- Serialize privileged changes, including concurrent last-admin decisions.
 PERFORM pg_catalog.pg_advisory_xact_lock(861026,701);
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND role='admin') THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
 IF p_change IS NULL OR jsonb_typeof(p_change)<>'object' OR p_change='{}'::jsonb OR
    EXISTS(SELECT 1 FROM jsonb_object_keys(p_change) k WHERE k NOT IN ('role','plan','credits','creditDelta','subscription_status','renewPayg')) OR
    length(coalesce(p_note,''))>500 THEN RAISE EXCEPTION 'Invalid account change' USING ERRCODE='22023'; END IF;
 IF (p_change ? 'renewPayg' AND p_change->'renewPayg' IS DISTINCT FROM 'true'::jsonb) THEN RAISE EXCEPTION 'Invalid renewal' USING ERRCODE='22023'; END IF;
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
 next_end:=previous.subscription_end;
 IF p_change->'renewPayg'='true'::jsonb AND (previous.plan IS DISTINCT FROM 'payg' OR (vancore_private.vera_expiry(previous.subscription_end)>clock_timestamp() AND coalesce(previous.credits,0)>0)) THEN RAISE EXCEPTION 'Renew only an expired or exhausted PAYG allocation' USING ERRCODE='22023'; END IF;
 IF (p_change->'renewPayg'='true'::jsonb) OR (p_change->>'plan'='payg' AND p_change->>'subscription_status'='active' AND (previous.plan IS DISTINCT FROM 'payg' OR (previous.subscription_status IS DISTINCT FROM 'active' AND (coalesce(vancore_private.vera_expiry(previous.subscription_end),'-infinity'::timestamptz)<=clock_timestamp() OR coalesce(previous.credits,0)=0)))) THEN
  IF coalesce(p_change->>'plan',previous.plan)<>'payg' OR coalesce(p_change->>'subscription_status',previous.subscription_status)<>'active' OR p_change ? 'credits' OR p_change ? 'creditDelta' THEN RAISE EXCEPTION 'Activate or renew PAYG separately from credit edits' USING ERRCODE='22023'; END IF;
  p_change:=p_change||jsonb_build_object('credits',500); next_end:=to_jsonb(clock_timestamp()+interval '3 months')#>>'{}';
 END IF;
 IF p_change->>'plan'='starter' AND previous.plan IS DISTINCT FROM 'starter' THEN
  p_change:=(p_change-'creditDelta')||jsonb_build_object('credits',least(greatest(coalesce(previous.credits,0),0),greatest(5-coalesce((SELECT starter_used FROM vancore_private.vera_actors WHERE user_id=p_target),0),0)));next_end:=NULL;
 END IF;
 IF p_change->>'plan' IN ('professional','business') AND previous.plan IS DISTINCT FROM p_change->>'plan' THEN next_end:=NULL; END IF;
 IF previous.role='admin' AND p_change ? 'role' AND p_change->>'role'<>'admin' THEN
  IF p_actor=p_target THEN RAISE EXCEPTION 'Another administrator must change your role' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE role='admin' AND id<>p_target) THEN RAISE EXCEPTION 'An administrator must remain' USING ERRCODE='22023'; END IF;
 END IF;
 next_credits:=CASE WHEN p_change ? 'credits' THEN (p_change->>'credits')::bigint ELSE coalesce(previous.credits,0)+coalesce((p_change->>'creditDelta')::bigint,0) END;
 IF next_credits<0 OR next_credits>2147483647 THEN RAISE EXCEPTION 'Credits out of range' USING ERRCODE='22023'; END IF;
 before_state:=jsonb_build_object('role',previous.role,'plan',previous.plan,'credits',previous.credits,'subscription_status',previous.subscription_status,'subscription_end',previous.subscription_end);
 after_state:=jsonb_build_object('role',coalesce(p_change->>'role',previous.role),'plan',coalesce(p_change->>'plan',previous.plan),'credits',next_credits,'subscription_status',coalesce(p_change->>'subscription_status',previous.subscription_status),'subscription_end',next_end);
 IF before_state=after_state THEN RETURN jsonb_build_object('account',to_jsonb(previous),'auditId',NULL,'changed',false); END IF;
 UPDATE public.users SET role=after_state->>'role',plan=after_state->>'plan',credits=next_credits::integer,subscription_status=after_state->>'subscription_status',subscription_end=next_end,updated_at=clock_timestamp() WHERE id=p_target RETURNING * INTO changed;
 INSERT INTO vancore_private.account_change_audit(actor_id,target_id,before_values,after_values,note)
 VALUES(p_actor,p_target,before_state,after_state,nullif(btrim(p_note),'')) RETURNING id INTO audit_id;
 RETURN jsonb_build_object('account',to_jsonb(changed),'auditId',audit_id,'changed',true);
END $$;
REVOKE ALL ON FUNCTION public.vancore_admin_update_account(uuid,uuid,jsonb,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_admin_update_account(uuid,uuid,jsonb,timestamptz,text) TO service_role;

