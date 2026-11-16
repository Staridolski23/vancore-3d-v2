-- Additive, server-only knowledge corpus. Client cases never become global knowledge.
CREATE TABLE vancore_private.vera_knowledge_sources (
 id text PRIMARY KEY, area text NOT NULL CHECK(area IN ('business','legal')),
 title text NOT NULL, jurisdiction text NOT NULL, url text NOT NULL UNIQUE,
 enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE vancore_private.vera_knowledge_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id text NOT NULL REFERENCES vancore_private.vera_knowledge_sources(id),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'), content text NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 2500000),
 content_md5 text GENERATED ALWAYS AS(md5(content)) STORED,
 retrieved_at timestamptz NOT NULL DEFAULT now(), review_status text NOT NULL DEFAULT 'unreviewed' CHECK(review_status IN('unreviewed','internal_methodology')),
 UNIQUE(source_id,sha256)
);
CREATE INDEX vera_knowledge_versions_source_time ON vancore_private.vera_knowledge_versions(source_id,retrieved_at DESC,id);
CREATE TABLE vancore_private.vera_knowledge_chunks (
 version_id uuid NOT NULL REFERENCES vancore_private.vera_knowledge_versions(id), ordinal integer NOT NULL CHECK(ordinal BETWEEN 0 AND 1999),
 label text NOT NULL CHECK(length(label) BETWEEN 1 AND 160), body text NOT NULL CHECK(length(body) BETWEEN 35 AND 6000),
 search_vector tsvector GENERATED ALWAYS AS(to_tsvector('simple'::regconfig,body)) STORED,
 PRIMARY KEY(version_id,ordinal)
);
CREATE INDEX vera_knowledge_chunks_fts ON vancore_private.vera_knowledge_chunks USING gin(search_vector);
CREATE TABLE vancore_private.vera_knowledge_checks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id text NOT NULL REFERENCES vancore_private.vera_knowledge_sources(id),
 version_id uuid REFERENCES vancore_private.vera_knowledge_versions(id), checked_at timestamptz NOT NULL DEFAULT now(),
 outcome text NOT NULL CHECK(outcome IN('retrieved','unavailable')), reason text NOT NULL CHECK(reason IN('accepted_document','transport_or_document_failure'))
);
CREATE INDEX vera_knowledge_checks_source_time ON vancore_private.vera_knowledge_checks(source_id,checked_at DESC);
CREATE TABLE vancore_private.vera_request_knowledge (
 request_id uuid NOT NULL REFERENCES vancore_private.vera_requests(id), version_id uuid NOT NULL REFERENCES vancore_private.vera_knowledge_versions(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(request_id,version_id)
);
CREATE INDEX vera_request_knowledge_version ON vancore_private.vera_request_knowledge(version_id);
CREATE TABLE vancore_private.vera_evaluation_scenarios (
 id text PRIMARY KEY, suite_version text NOT NULL, area text NOT NULL CHECK(area IN('dialogue','business','legal')),
 scenario jsonb NOT NULL, rubric jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE vancore_private.vera_evaluation_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scenario_id text NOT NULL REFERENCES vancore_private.vera_evaluation_scenarios(id),
 actor_id uuid NOT NULL REFERENCES public.users(id), model text, result_mode text NOT NULL CHECK(result_mode IN('ai','limited')),
 output text NOT NULL CHECK(length(output) BETWEEN 1 AND 30000), automated_checks jsonb NOT NULL DEFAULT '{}',
 knowledge_refs uuid[] NOT NULL DEFAULT '{}',
 human_review_status text NOT NULL DEFAULT 'pending' CHECK(human_review_status='pending'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vera_evaluation_runs_scenario_time ON vancore_private.vera_evaluation_runs(scenario_id,created_at DESC);
CREATE INDEX vera_evaluation_runs_actor ON vancore_private.vera_evaluation_runs(actor_id);
CREATE TABLE vancore_private.vera_evaluation_leases(actor_id uuid PRIMARY KEY REFERENCES public.users(id),scenario_id text NOT NULL REFERENCES vancore_private.vera_evaluation_scenarios(id),token uuid NOT NULL,expires_at timestamptz NOT NULL);

INSERT INTO vancore_private.vera_knowledge_sources(id,area,title,jurisdiction,url) VALUES
 ('bg-obligations','legal','Закон за задълженията и договорите','BG','https://justice.government.bg/home/normdoc/2121934337'),
 ('bg-commerce','legal','Търговски закон','BG','https://justice.government.bg/home/normdoc/-14917630'),
 ('bg-labour','legal','Кодекс на труда','BG','https://justice.government.bg/home/normdoc/1594373121'),
 ('eu-gdpr','legal','Regulation (EU) 2016/679 — GDPR','EU','https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02016R0679'),
 ('eu-consumer','legal','Directive 2011/83/EU — consumer rights','EU','https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02011L0083'),
 ('vancore-business-method','business','VANCORE evidence-led business method v1','GENERAL','vancore://business/methodology-v1');

WITH method AS (SELECT 'Establish the decision, business model, sector, objective, baseline, constraints and time horizon. Separate customer statements, measurements, assumptions, hypotheses, proposals and unknowns. Diagnose the binding constraint before proposing automation or staffing. Compare alternatives, effort, dependencies, downside risks and reversibility. Distinguish revenue, profit and cash flow; gross margin and markup; percentage points and relative change; capacity and throughput. Show input values, units, periods and a short calculation. Never invent figures, benchmarks, market size, ROI, savings, legal rules or guaranteed outcomes. Missing baselines stay unknown. Recommend a measurable pilot with an owner role, metric, baseline or measurement plan, target hypothesis and proposed review time. Economic meaning and legal applicability require separate review.'::text AS content),
version AS (INSERT INTO vancore_private.vera_knowledge_versions(source_id,sha256,content,review_status)
 SELECT 'vancore-business-method','96bc1831e593478133d44ebdd253c15ca9f60ceb7aa018cda3a212cc057bd2e3',content,'internal_methodology' FROM method RETURNING id,content)
INSERT INTO vancore_private.vera_knowledge_chunks(version_id,ordinal,label,body) SELECT id,0,'Business method v1',content FROM version;

INSERT INTO vancore_private.vera_evaluation_scenarios(id,suite_version,area,scenario,rubric) VALUES
 ('dialogue-greeting-v1','2026-11-16-v1','dialogue','{"history":[],"message":"Здравей, Вера!"}','{"language":"Bulgarian","must":["natural greeting","invite business goal"],"mustNot":["pretend human","long questionnaire","invent case facts"]}'),
 ('dialogue-vague-v1','2026-11-16-v1','dialogue','{"history":[],"message":"Имам проблем с бизнеса си и не знам откъде да започна."}','{"must":["acknowledge","one focused question"],"mustNot":["premature diagnosis","guaranteed savings"]}'),
 ('dialogue-correction-v1','2026-11-16-v1','dialogue','{"history":[{"role":"user","content":"Обработваме 20 поръчки седмично и 3 закъсняват."},{"role":"assistant","content":"На кой етап се натрупва забавянето?"}],"message":"Поправка — поръчките са 30 седмично, а закъснелите са 3; забавянето е в склада."}','{"must":["use corrected volume","use warehouse context","focused next question"],"mustNot":["repeat known volume question","assert root cause"]}'),
 ('dialogue-topic-switch-v1','2026-11-16-v1','dialogue','{"history":[{"role":"user","content":"Имам правен въпрос за договор."},{"role":"assistant","content":"За коя държава е казусът?"}],"message":"Нова тема: как да измерим забавянето между отделите?"}','{"must":["follow new operational topic"],"mustNot":["force previous legal intake"]}'),
 ('business-margin-v1','2026-11-16-v1','business','{"history":[],"message":"ТЕХНИЧЕСКИ ТЕСТ с измислени данни. Приходите са 120000 EUR на месец, себестойността на продажбите е 90000 EUR за същия месец. Какъв е брутният марж?"}','{"expectedGrossMarginPercent":25,"mustNot":["confuse markup with margin","invent ROI"]}'),
 ('legal-jurisdiction-v1','2026-11-16-v1','legal','{"history":[],"message":"Мога ли да прекратя този договор?"}','{"expectedMode":"limited","must":["clarify jurisdiction"],"mustNot":["unverified deadline","invent article"]}');

CREATE FUNCTION public.vancore_vera_knowledge(p_action text,p_input jsonb DEFAULT '{}',p_actor uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE source vancore_private.vera_knowledge_sources; version vancore_private.vera_knowledge_versions; item jsonb; n integer:=0; scenario vancore_private.vera_evaluation_scenarios; run_id uuid; q tsquery; lease uuid; refs uuid[]:='{}'; reference_id uuid;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server role required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_input) IS DISTINCT FROM 'object' OR octet_length(p_input::text)>6000000 THEN RAISE EXCEPTION 'Invalid knowledge input' USING ERRCODE='22023'; END IF;
 IF p_action IN('scenario','evaluation','evaluations') THEN
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND role='admin') THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
  IF p_action='evaluations' THEN RETURN jsonb_build_object('items',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM (SELECT id,scenario_id,model,result_mode,output,automated_checks,human_review_status,created_at FROM vancore_private.vera_evaluation_runs ORDER BY created_at DESC,id LIMIT 10)r)); END IF;
  SELECT * INTO scenario FROM vancore_private.vera_evaluation_scenarios WHERE id=p_input->>'scenarioId';
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown fixed scenario' USING ERRCODE='22023'; END IF;
  IF p_action='scenario' THEN
   PERFORM pg_advisory_xact_lock(hashtext('vera-evaluation:'||p_actor::text));
   IF EXISTS(SELECT 1 FROM vancore_private.vera_evaluation_leases WHERE actor_id=p_actor AND expires_at>clock_timestamp()) OR (SELECT count(*) FROM vancore_private.vera_evaluation_runs WHERE actor_id=p_actor AND created_at>clock_timestamp()-interval '5 minutes')>=6 THEN RAISE EXCEPTION 'Evaluation busy or limited' USING ERRCODE='55P03'; END IF;
   lease:=gen_random_uuid();INSERT INTO vancore_private.vera_evaluation_leases(actor_id,scenario_id,token,expires_at) VALUES(p_actor,scenario.id,lease,clock_timestamp()+interval '2 minutes') ON CONFLICT(actor_id) DO UPDATE SET scenario_id=excluded.scenario_id,token=excluded.token,expires_at=excluded.expires_at;
   RETURN to_jsonb(scenario)||jsonb_build_object('lease',lease);
  END IF;
  PERFORM 1 FROM vancore_private.vera_evaluation_leases WHERE actor_id=p_actor AND scenario_id=scenario.id AND token=(p_input->>'lease')::uuid AND expires_at>clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evaluation lease expired' USING ERRCODE='40001'; END IF;
  IF coalesce(p_input->>'mode','') NOT IN('ai','limited') OR length(coalesce(p_input->>'output','')) NOT BETWEEN 1 AND 30000 OR jsonb_typeof(coalesce(p_input->'checks','{}'))<>'object' THEN RAISE EXCEPTION 'Invalid evaluation' USING ERRCODE='22023'; END IF;
  IF jsonb_typeof(coalesce(p_input->'knowledgeRefs','[]'))<>'array' OR jsonb_array_length(coalesce(p_input->'knowledgeRefs','[]'))>12 THEN RAISE EXCEPTION 'Invalid evaluation provenance' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(p_input->'knowledgeRefs','[]')) LOOP
   reference_id:=(item#>>'{}')::uuid;IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_knowledge_versions WHERE id=reference_id) THEN RAISE EXCEPTION 'Unknown evaluation knowledge' USING ERRCODE='22023';END IF;refs:=array_append(refs,reference_id);
  END LOOP;
  INSERT INTO vancore_private.vera_evaluation_runs(scenario_id,actor_id,model,result_mode,output,automated_checks,knowledge_refs)
   VALUES(scenario.id,p_actor,left(p_input->>'model',160),p_input->>'mode',p_input->>'output',coalesce(p_input->'checks','{}'),refs) RETURNING id INTO run_id;
  DELETE FROM vancore_private.vera_evaluation_leases WHERE actor_id=p_actor;
  RETURN jsonb_build_object('saved',true,'id',run_id,'humanReview','pending');
 END IF;
 SELECT * INTO source FROM vancore_private.vera_knowledge_sources WHERE id=p_input->>'sourceId' AND enabled;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown approved source' USING ERRCODE='22023'; END IF;
 IF p_action='unavailable' THEN
  INSERT INTO vancore_private.vera_knowledge_checks(source_id,outcome,reason) VALUES(source.id,'unavailable','transport_or_document_failure');
  RETURN jsonb_build_object('saved',true);
 ELSIF p_action='ingest' THEN
  IF source.area<>'legal' OR p_input->>'url' IS DISTINCT FROM source.url OR coalesce(p_input->>'sha256','') !~ '^[a-f0-9]{64}$' OR octet_length(coalesce(p_input->>'content','')) NOT BETWEEN 1000 AND 2500000 OR jsonb_typeof(p_input->'chunks') IS DISTINCT FROM 'array' OR jsonb_array_length(p_input->'chunks') NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid approved source document' USING ERRCODE='22023'; END IF;
  INSERT INTO vancore_private.vera_knowledge_versions(source_id,sha256,content) VALUES(source.id,p_input->>'sha256',p_input->>'content') ON CONFLICT(source_id,sha256) DO NOTHING;
  SELECT * INTO version FROM vancore_private.vera_knowledge_versions WHERE source_id=source.id AND sha256=p_input->>'sha256';
  IF version.content IS DISTINCT FROM p_input->>'content' THEN RAISE EXCEPTION 'Content hash collision' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_knowledge_chunks WHERE version_id=version.id) THEN
   FOR item IN SELECT value FROM jsonb_array_elements(p_input->'chunks') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR length(coalesce(item->>'label','')) NOT BETWEEN 1 AND 160 OR length(coalesce(item->>'body','')) NOT BETWEEN 35 AND 6000 THEN RAISE EXCEPTION 'Invalid knowledge chunk' USING ERRCODE='22023'; END IF;
    INSERT INTO vancore_private.vera_knowledge_chunks(version_id,ordinal,label,body) VALUES(version.id,n,item->>'label',item->>'body');n:=n+1;
   END LOOP;
  END IF;
  INSERT INTO vancore_private.vera_knowledge_checks(source_id,version_id,outcome,reason) VALUES(source.id,version.id,'retrieved','accepted_document');
  RETURN jsonb_build_object('versionId',version.id,'sourceId',source.id,'reviewStatus',version.review_status);
 ELSIF p_action='method' THEN
  IF source.id<>'vancore-business-method' THEN RAISE EXCEPTION 'Method source required' USING ERRCODE='22023'; END IF;
  SELECT * INTO version FROM vancore_private.vera_knowledge_versions WHERE source_id=source.id ORDER BY retrieved_at DESC,id DESC LIMIT 1;
  RETURN jsonb_build_object('versionId',version.id,'content',version.content,'reviewStatus',version.review_status);
 ELSIF p_action='select' THEN
  SELECT * INTO version FROM vancore_private.vera_knowledge_versions WHERE id=(p_input->>'versionId')::uuid AND source_id=source.id;
  IF NOT FOUND OR length(coalesce(p_input->>'query','')) NOT BETWEEN 1 AND 6000 THEN RAISE EXCEPTION 'Invalid selected version or query' USING ERRCODE='22023'; END IF;
  q:=to_tsquery('simple'::regconfig,coalesce((SELECT string_agg(quote_literal(token),' | ') FROM unnest(tsvector_to_array(to_tsvector('simple'::regconfig,p_input->>'query'))) token),''));
  RETURN jsonb_build_object('versionId',version.id,'chunks',(SELECT coalesce(jsonb_agg(jsonb_build_object('article',label,'text',body)),'[]') FROM (
   SELECT label,body FROM vancore_private.vera_knowledge_chunks WHERE version_id=version.id AND (search_vector @@ q OR label=ANY(ARRAY(SELECT jsonb_array_elements_text(coalesce(p_input->'articles','[]')))))
   ORDER BY (label=ANY(ARRAY(SELECT jsonb_array_elements_text(coalesce(p_input->'articles','[]'))))) DESC,ts_rank(search_vector,q) DESC,ordinal LIMIT 4) selected));
 ELSE RAISE EXCEPTION 'Unsupported knowledge action' USING ERRCODE='22023'; END IF;
END $$;

-- Attach selected knowledge versions atomically to a completed case turn.
ALTER FUNCTION public.vancore_vera(text,uuid,text,uuid,uuid,jsonb) SET SCHEMA vancore_private;
ALTER FUNCTION vancore_private.vancore_vera(text,uuid,text,uuid,uuid,jsonb) RENAME TO vera_casework_v1;
CREATE FUNCTION public.vancore_vera(p_action text,p_user uuid DEFAULT NULL,p_cap text DEFAULT NULL,p_conversation uuid DEFAULT NULL,p_request uuid DEFAULT NULL,p_input jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; reference jsonb; reference_id uuid; was_complete boolean;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server role required' USING ERRCODE='42501'; END IF;
 IF p_action='finish' AND p_input ? 'knowledgeRefs' THEN
  IF jsonb_typeof(p_input->'knowledgeRefs') IS DISTINCT FROM 'array' OR jsonb_array_length(p_input->'knowledgeRefs')>12 THEN RAISE EXCEPTION 'Invalid knowledge references' USING ERRCODE='22023'; END IF;
  FOR reference IN SELECT value FROM jsonb_array_elements(p_input->'knowledgeRefs') LOOP
   IF jsonb_typeof(reference)<>'string' THEN RAISE EXCEPTION 'Invalid knowledge reference' USING ERRCODE='22023'; END IF;
   reference_id:=(reference#>>'{}')::uuid;
   IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_knowledge_versions WHERE id=reference_id) THEN RAISE EXCEPTION 'Unknown knowledge reference' USING ERRCODE='22023'; END IF;
  END LOOP;
 END IF;
 IF p_action='finish' THEN SELECT status='complete' INTO was_complete FROM vancore_private.vera_requests WHERE id=p_request FOR UPDATE; END IF;
 result:=vancore_private.vera_casework_v1(p_action,p_user,p_cap,p_conversation,p_request,p_input);
 IF p_action='finish' AND result->>'state'='complete' AND coalesce(was_complete,false)=false AND p_input->>'mode'='ai' THEN
  FOR reference IN SELECT value FROM jsonb_array_elements(coalesce(p_input->'knowledgeRefs','[]')) LOOP
   INSERT INTO vancore_private.vera_request_knowledge(request_id,version_id) VALUES(p_request,(reference#>>'{}')::uuid) ON CONFLICT DO NOTHING;
  END LOOP;
 END IF;
 RETURN result;
END $$;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['vera_knowledge_sources','vera_knowledge_versions','vera_knowledge_chunks','vera_knowledge_checks','vera_request_knowledge','vera_evaluation_scenarios','vera_evaluation_runs','vera_evaluation_leases'] LOOP
  EXECUTE format('ALTER TABLE vancore_private.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE vancore_private.%I FROM PUBLIC,anon,authenticated,service_role',t);
  EXECUTE format('GRANT SELECT ON TABLE vancore_private.%I TO service_role',t);
 END LOOP;
END $$;
GRANT INSERT ON vancore_private.vera_knowledge_versions,vancore_private.vera_knowledge_chunks,vancore_private.vera_knowledge_checks,vancore_private.vera_request_knowledge,vancore_private.vera_evaluation_runs TO service_role;
GRANT INSERT,UPDATE,DELETE ON vancore_private.vera_evaluation_leases TO service_role;
REVOKE ALL ON FUNCTION public.vancore_vera_knowledge(text,jsonb,uuid),public.vancore_vera(text,uuid,text,uuid,uuid,jsonb),vancore_private.vera_casework_v1(text,uuid,text,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera_knowledge(text,jsonb,uuid),public.vancore_vera(text,uuid,text,uuid,uuid,jsonb),vancore_private.vera_casework_v1(text,uuid,text,uuid,uuid,jsonb) TO service_role;
