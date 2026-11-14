-- Account-owned case notes, evidence, immutable AI drafts and explicit handoffs.
ALTER TABLE vancore_private.vera_requests ADD COLUMN kind text NOT NULL DEFAULT 'conversation' CHECK(kind IN ('conversation','analysis'));
ALTER TABLE vancore_private.vera_requests ADD COLUMN context_version bigint;
CREATE TABLE vancore_private.vera_case_memory(conversation_id uuid PRIMARY KEY REFERENCES vancore_private.vera_conversations(id),notes text NOT NULL CHECK(length(notes)<=6000),updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE vancore_private.vera_analyses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_id uuid UNIQUE NOT NULL REFERENCES vancore_private.vera_requests(id),conversation_id uuid NOT NULL REFERENCES vancore_private.vera_conversations(id),source_version bigint NOT NULL,content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND octet_length(content::text)<=60000),notes_snapshot text NOT NULL,model text,created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX vera_analyses_conversation_time ON vancore_private.vera_analyses(conversation_id,created_at DESC);
CREATE TABLE vancore_private.vera_handoffs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),analysis_id uuid NOT NULL UNIQUE REFERENCES vancore_private.vera_analyses(id),requested_by uuid NOT NULL REFERENCES public.users(id),assigned_to uuid REFERENCES public.users(id),status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','in_review','needs_info','completed','cancelled')),version bigint NOT NULL DEFAULT 0,client_message text NOT NULL CHECK(length(client_message)<=2000),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX vera_handoffs_assignment_time ON vancore_private.vera_handoffs(assigned_to,created_at DESC);
CREATE TABLE vancore_private.vera_handoff_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),handoff_id uuid NOT NULL REFERENCES vancore_private.vera_handoffs(id),actor_id uuid NOT NULL REFERENCES public.users(id),event text NOT NULL,details jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX vera_handoff_events_handoff ON vancore_private.vera_handoff_events(handoff_id,created_at);
CREATE TABLE vancore_private.vera_consultant_reviews(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),analysis_id uuid NOT NULL REFERENCES vancore_private.vera_analyses(id),reviewer_id uuid NOT NULL REFERENCES public.users(id),body text NOT NULL CHECK(length(body) BETWEEN 40 AND 12000),created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE INDEX vera_consultant_reviews_analysis ON vancore_private.vera_consultant_reviews(analysis_id,created_at DESC);
ALTER TABLE vancore_private.vera_case_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_handoff_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vancore_private.vera_consultant_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON vancore_private.vera_case_memory,vancore_private.vera_analyses,vancore_private.vera_handoffs,vancore_private.vera_handoff_events,vancore_private.vera_consultant_reviews FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON vancore_private.vera_case_memory,vancore_private.vera_handoffs TO service_role;
GRANT SELECT,INSERT ON vancore_private.vera_analyses,vancore_private.vera_handoff_events,vancore_private.vera_consultant_reviews TO service_role;

CREATE FUNCTION vancore_private.vera_case_view(p_user uuid,p_conversation uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user<>'service_role' OR NOT EXISTS(SELECT 1 FROM vancore_private.vera_conversations WHERE id=p_conversation AND owner_key='user:'||p_user::text) THEN RAISE EXCEPTION 'Case not found' USING ERRCODE='P0002'; END IF;
 RETURN jsonb_build_object('caseNotes',coalesce((SELECT notes FROM vancore_private.vera_case_memory WHERE conversation_id=p_conversation),''),
  'analyses',(SELECT coalesce(jsonb_agg(to_jsonb(a)),'[]') FROM (SELECT id,source_version,content->>'title' AS title,created_at FROM vancore_private.vera_analyses WHERE conversation_id=p_conversation ORDER BY created_at DESC,id LIMIT 20)a),
  'handoffs',(SELECT coalesce(jsonb_agg(to_jsonb(h)),'[]') FROM (SELECT h.id,h.analysis_id,h.status,h.version,h.created_at,h.updated_at FROM vancore_private.vera_handoffs h JOIN vancore_private.vera_analyses a ON a.id=h.analysis_id WHERE a.conversation_id=p_conversation AND h.requested_by=p_user ORDER BY h.created_at DESC LIMIT 20)h));
END $$;
REVOKE ALL ON FUNCTION vancore_private.vera_case_view(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_case_view(uuid,uuid) TO service_role;

CREATE FUNCTION vancore_private.vera_evidence(p_user uuid,p_conversation uuid,p_query text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE evidence jsonb; total integer;
BEGIN
 IF current_user<>'service_role' OR NOT EXISTS(SELECT 1 FROM vancore_private.vera_conversations WHERE id=p_conversation AND owner_key='user:'||p_user::text) THEN RAISE EXCEPTION 'Case not found' USING ERRCODE='P0002'; END IF;
 SELECT count(*) INTO total FROM vancore_private.vera_requests WHERE conversation_id=p_conversation AND status='complete';
 -- Retrieve older relevant source statements as well as the opening context.
 -- All statements remain unverified user evidence, never trusted instructions.
 SELECT coalesce(jsonb_agg(jsonb_build_object('requestId',id,'statement',left(message,1500),'truncated',length(message)>1500,'createdAt',created_at) ORDER BY created_at,id),'[]') INTO evidence FROM (
  SELECT r.* FROM vancore_private.vera_requests r WHERE r.conversation_id=p_conversation AND r.status='complete' AND r.kind='conversation'
  ORDER BY (SELECT count(*) FROM unnest(tsvector_to_array(to_tsvector('simple',r.message))) word WHERE word=ANY(tsvector_to_array(to_tsvector('simple',left(coalesce(p_query,''),1000))))) DESC,
    CASE WHEN r.id IN (SELECT id FROM vancore_private.vera_requests WHERE conversation_id=p_conversation AND status='complete' AND kind='conversation' ORDER BY created_at,id LIMIT 2) THEN 0 WHEN r.message ~ '[0-9]' THEN 1 ELSE 2 END,r.created_at DESC,r.id LIMIT 12
 ) source;
 RETURN jsonb_build_object('notes',coalesce((SELECT notes FROM vancore_private.vera_case_memory WHERE conversation_id=p_conversation),''),'sources',evidence,'totalCompletedRequests',total,'selectedSources',jsonb_array_length(evidence),'scope','Selected statements from this case; not a complete transcript. All user claims are unverified. Later explicit corrections supersede earlier values; ask if ambiguous.');
END $$;
REVOKE ALL ON FUNCTION vancore_private.vera_evidence(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION vancore_private.vera_evidence(uuid,uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.vancore_vera(p_action text,p_user uuid DEFAULT NULL,p_cap text DEFAULT NULL,p_conversation uuid DEFAULT NULL,p_request uuid DEFAULT NULL,p_input jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; selected uuid; current_case vancore_private.vera_conversations%ROWTYPE; turn vancore_private.vera_requests%ROWTYPE; draft vancore_private.vera_analyses%ROWTYPE; transfer vancore_private.vera_handoffs%ROWTYPE; fact jsonb; expected bigint; desired_kind text;
BEGIN
 IF current_user<>'service_role' OR p_user IS NULL OR p_cap IS NOT NULL THEN RAISE EXCEPTION 'Registered account required' USING ERRCODE='42501'; END IF;
 IF p_input IS NULL OR jsonb_typeof(p_input)<>'object' THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='22023'; END IF;
 IF p_action='analysis_list' THEN
  PERFORM vancore_private.vera_ledger_v1('read',p_user);
  RETURN jsonb_build_object('state','analysis_list','analyses',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT a.id,a.conversation_id,a.source_version,a.content->>'title' AS title,a.created_at FROM vancore_private.vera_analyses a JOIN vancore_private.vera_conversations c ON c.id=a.conversation_id WHERE c.owner_key='user:'||p_user::text ORDER BY a.created_at DESC,a.id LIMIT 50)q));
 END IF;
 IF p_action='analysis_read' THEN
  SELECT a.* INTO draft FROM vancore_private.vera_analyses a JOIN vancore_private.vera_conversations c ON c.id=a.conversation_id WHERE a.id=p_request AND c.owner_key='user:'||p_user::text;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE='P0002'; END IF;
  RETURN jsonb_build_object('state','analysis','analysis',to_jsonb(draft),'reviews',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT id,body,created_at FROM vancore_private.vera_consultant_reviews WHERE analysis_id=draft.id ORDER BY created_at DESC LIMIT 10)r));
 END IF;
 IF p_action IN ('memory','handoff','cancel_handoff') THEN
  result:=vancore_private.vera_ledger_v1('read',p_user,NULL,p_conversation);
  SELECT * INTO current_case FROM vancore_private.vera_conversations WHERE id=p_conversation AND owner_key='user:'||p_user::text FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case not found' USING ERRCODE='P0002'; END IF;
  IF p_action='memory' THEN
   IF jsonb_typeof(p_input->'expectedVersion') IS DISTINCT FROM 'number' OR (p_input->>'expectedVersion') !~ '^[0-9]{1,15}$' OR jsonb_typeof(p_input->'notes') IS DISTINCT FROM 'string' OR length(p_input->>'notes')>6000 THEN RAISE EXCEPTION 'Invalid notes' USING ERRCODE='22023'; END IF;
   IF current_case.version<>(p_input->>'expectedVersion')::bigint OR current_case.active_request IS NOT NULL THEN RAISE EXCEPTION 'Case changed; reload' USING ERRCODE='40001'; END IF;
   INSERT INTO vancore_private.vera_case_memory(conversation_id,notes) VALUES(p_conversation,p_input->>'notes') ON CONFLICT(conversation_id) DO UPDATE SET notes=excluded.notes,updated_at=clock_timestamp();
   UPDATE vancore_private.vera_conversations SET version=version+1,updated_at=clock_timestamp() WHERE id=p_conversation;
  ELSIF p_action='handoff' THEN
   IF p_input->'shareWithTeam' IS DISTINCT FROM 'true'::jsonb OR jsonb_typeof(p_input->'message') IS DISTINCT FROM 'string' OR length(p_input->>'message')>2000 THEN RAISE EXCEPTION 'Explicit sharing choice required' USING ERRCODE='22023'; END IF;
   SELECT * INTO draft FROM vancore_private.vera_analyses WHERE id=p_request AND conversation_id=p_conversation;
   IF NOT FOUND THEN RAISE EXCEPTION 'Report not found' USING ERRCODE='P0002'; END IF;
   INSERT INTO vancore_private.vera_handoffs(analysis_id,requested_by,client_message) VALUES(draft.id,p_user,p_input->>'message') ON CONFLICT(analysis_id) DO NOTHING RETURNING * INTO transfer;
   IF FOUND THEN INSERT INTO vancore_private.vera_handoff_events(handoff_id,actor_id,event,details) VALUES(transfer.id,p_user,'requested',jsonb_build_object('analysisId',draft.id,'shareScope','selected-report-and-quoted-evidence'));
   ELSE
    SELECT * INTO transfer FROM vancore_private.vera_handoffs WHERE analysis_id=draft.id AND requested_by=p_user FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Handoff not found' USING ERRCODE='P0002'; END IF;
    IF transfer.status='cancelled' THEN
     IF NOT p_input ? 'expectedVersion' THEN RETURN result||jsonb_build_object('state','handoff_cancelled')||vancore_private.vera_case_view(p_user,p_conversation); END IF;
     IF transfer.version::text IS DISTINCT FROM p_input->>'expectedVersion' THEN RAISE EXCEPTION 'Handoff changed; reload' USING ERRCODE='40001'; END IF;
     UPDATE vancore_private.vera_handoffs SET status='requested',assigned_to=NULL,client_message=p_input->>'message',version=version+1,updated_at=clock_timestamp() WHERE id=transfer.id;
     INSERT INTO vancore_private.vera_handoff_events(handoff_id,actor_id,event,details) VALUES(transfer.id,p_user,'requested_again',jsonb_build_object('analysisId',draft.id,'shareScope','selected-report-and-quoted-evidence'));
    END IF;
   END IF;
  ELSE
   SELECT * INTO transfer FROM vancore_private.vera_handoffs WHERE id=p_request AND requested_by=p_user AND analysis_id IN(SELECT id FROM vancore_private.vera_analyses WHERE conversation_id=p_conversation) FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Handoff not found' USING ERRCODE='P0002'; END IF;
   IF transfer.version::text IS DISTINCT FROM p_input->>'expectedVersion' OR transfer.status='completed' THEN RAISE EXCEPTION 'Handoff changed or completed' USING ERRCODE='40001'; END IF;
   IF transfer.status<>'cancelled' THEN
    UPDATE vancore_private.vera_handoffs SET status='cancelled',version=version+1,updated_at=clock_timestamp() WHERE id=transfer.id;
    INSERT INTO vancore_private.vera_handoff_events(handoff_id,actor_id,event,details) VALUES(transfer.id,p_user,'cancelled','{}');
   END IF;
  END IF;
  result:=vancore_private.vera_ledger_v1('read',p_user,NULL,p_conversation);
  RETURN result||jsonb_build_object('state',CASE p_action WHEN 'memory' THEN 'memory_saved' WHEN 'handoff' THEN 'handoff_saved' ELSE 'handoff_cancelled' END)||vancore_private.vera_case_view(p_user,p_conversation);
 END IF;
 IF p_action='begin' THEN
  desired_kind:=coalesce(p_input->>'kind','conversation');IF desired_kind NOT IN ('conversation','analysis') THEN RAISE EXCEPTION 'Invalid request kind' USING ERRCODE='22023'; END IF;
  SELECT r.* INTO turn FROM vancore_private.vera_requests r JOIN vancore_private.vera_conversations c ON c.id=r.conversation_id WHERE r.id=p_request AND c.owner_key='user:'||p_user::text;
  IF FOUND AND turn.kind<>desired_kind THEN RAISE EXCEPTION 'Request changed' USING ERRCODE='40001'; END IF;
 END IF;
 IF p_action='finish' THEN
  SELECT r.* INTO turn FROM vancore_private.vera_requests r JOIN vancore_private.vera_conversations c ON c.id=r.conversation_id WHERE r.id=p_request AND c.id=p_conversation AND c.owner_key='user:'||p_user::text;
  IF turn.kind='analysis' AND turn.status<>'complete' AND p_input->>'mode'='ai' THEN
   IF jsonb_typeof(p_input->'analysis') IS DISTINCT FROM 'object' OR jsonb_typeof(p_input->'analysis'->'facts') IS DISTINCT FROM 'array' OR octet_length((p_input->'analysis')::text)>50000 THEN RAISE EXCEPTION 'Invalid report' USING ERRCODE='22023'; END IF;
   FOR fact IN SELECT value FROM jsonb_array_elements(p_input->'analysis'->'facts') LOOP
    IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_requests WHERE conversation_id=p_conversation AND id::text=fact->>'sourceRequestId' AND status='complete' AND kind='conversation' AND length(coalesce(fact->>'quote',''))>0 AND position(fact->>'quote' IN message)>0) THEN RAISE EXCEPTION 'Unsupported report evidence' USING ERRCODE='22023'; END IF;
   END LOOP;
  END IF;
 END IF;
 result:=vancore_private.vera_ledger_v1(p_action,p_user,NULL,p_conversation,p_request,p_input);
 IF p_action='begin' AND result->>'state'='generate' THEN
  UPDATE vancore_private.vera_requests SET kind=desired_kind,context_version=(SELECT version-1 FROM vancore_private.vera_conversations WHERE id=p_conversation) WHERE id=p_request;
  RETURN result||jsonb_build_object('caseMemory',vancore_private.vera_evidence(p_user,p_conversation,p_input->>'message'));
 END IF;
 IF p_action='finish' AND result->>'state'='complete' AND turn.kind='analysis' AND p_input->>'mode'='ai' AND turn.status<>'complete' THEN
  INSERT INTO vancore_private.vera_analyses(request_id,conversation_id,source_version,content,notes_snapshot,model) VALUES(p_request,p_conversation,turn.context_version,p_input->'analysis',coalesce((SELECT notes FROM vancore_private.vera_case_memory WHERE conversation_id=p_conversation),''),p_input->>'model') ON CONFLICT(request_id) DO NOTHING;
 END IF;
 selected:=(result->'conversation'->>'id')::uuid;
 IF selected IS NOT NULL THEN result:=result||vancore_private.vera_case_view(p_user,selected); END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) TO service_role;

CREATE FUNCTION public.vancore_vera_handoffs(p_actor uuid,p_action text,p_id uuid DEFAULT NULL,p_input jsonb DEFAULT '{}',p_expected_version bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor_role text; item vancore_private.vera_handoffs%ROWTYPE; assignee uuid; review_id uuid;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server access required' USING ERRCODE='42501'; END IF;
 SELECT role INTO actor_role FROM public.users WHERE id=p_actor;
 IF actor_role IS NULL OR actor_role NOT IN ('admin','consultant') THEN RAISE EXCEPTION 'Staff access required' USING ERRCODE='42501'; END IF;
 IF p_action='list' THEN RETURN jsonb_build_object('items',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT h.id,h.analysis_id,h.status,h.version,h.assigned_to,h.client_message,h.created_at,h.updated_at,a.content->>'title' AS title,u.name AS client_name,u.company AS client_company FROM vancore_private.vera_handoffs h JOIN vancore_private.vera_analyses a ON a.id=h.analysis_id JOIN public.users u ON u.id=h.requested_by WHERE actor_role='admin' OR (h.assigned_to=p_actor AND h.status<>'cancelled') ORDER BY h.created_at DESC,h.id LIMIT 100)q),
 'staff',CASE WHEN actor_role='admin' THEN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',coalesce(name,email),'role',role)),'[]') FROM public.users WHERE role IN ('admin','consultant')) ELSE '[]'::jsonb END); END IF;
 SELECT * INTO item FROM vancore_private.vera_handoffs WHERE id=p_id AND (actor_role='admin' OR assigned_to=p_actor) FOR UPDATE;
 IF NOT FOUND OR item.status='cancelled' THEN RAISE EXCEPTION 'Handoff not found' USING ERRCODE='P0002'; END IF;
 IF p_action='read' THEN RETURN jsonb_build_object('handoff',to_jsonb(item),'analysis',(SELECT to_jsonb(a) FROM vancore_private.vera_analyses a WHERE id=item.analysis_id),'reviews',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT id,body,created_at FROM vancore_private.vera_consultant_reviews WHERE analysis_id=item.analysis_id ORDER BY created_at DESC LIMIT 10)r)); END IF;
 IF item.version IS DISTINCT FROM p_expected_version OR item.status='completed' THEN RAISE EXCEPTION 'Handoff changed or completed' USING ERRCODE='40001'; END IF;
 IF p_action='assign' AND actor_role='admin' THEN
  BEGIN assignee:=(p_input->>'assignee')::uuid;EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid assignee' USING ERRCODE='22023';END;
  IF assignee IS NULL OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=assignee AND role IN ('admin','consultant')) THEN RAISE EXCEPTION 'Choose a current staff account' USING ERRCODE='22023'; END IF;
  UPDATE vancore_private.vera_handoffs SET assigned_to=assignee WHERE id=p_id;
 ELSIF p_action='status' AND p_input->>'status'='in_review' THEN
  UPDATE vancore_private.vera_handoffs SET status=p_input->>'status' WHERE id=p_id;
 ELSIF p_action='review' THEN
  IF jsonb_typeof(p_input->'body') IS DISTINCT FROM 'string' OR length(btrim(p_input->>'body')) NOT BETWEEN 40 AND 12000 THEN RAISE EXCEPTION 'Write the consultant review' USING ERRCODE='22023'; END IF;
  INSERT INTO vancore_private.vera_consultant_reviews(analysis_id,reviewer_id,body) VALUES(item.analysis_id,p_actor,btrim(p_input->>'body')) RETURNING id INTO review_id;
  UPDATE vancore_private.vera_handoffs SET status='completed' WHERE id=p_id;
 ELSE RAISE EXCEPTION 'Invalid staff action' USING ERRCODE='22023'; END IF;
 UPDATE vancore_private.vera_handoffs SET version=version+1,updated_at=clock_timestamp() WHERE id=p_id;
 INSERT INTO vancore_private.vera_handoff_events(handoff_id,actor_id,event,details) VALUES(p_id,p_actor,p_action,jsonb_build_object('previousStatus',item.status,'assignee',assignee,'reviewId',review_id));
 RETURN jsonb_build_object('saved',true,'handoff',(SELECT to_jsonb(h) FROM vancore_private.vera_handoffs h WHERE id=p_id));
END $$;
REVOKE ALL ON FUNCTION public.vancore_vera_handoffs(uuid,text,uuid,jsonb,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera_handoffs(uuid,text,uuid,jsonb,bigint) TO service_role;
