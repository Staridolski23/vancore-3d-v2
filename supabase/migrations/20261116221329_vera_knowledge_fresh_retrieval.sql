-- Database-first research uses an explicitly dated, bounded-age preserved source.
ALTER TABLE vancore_private.vera_knowledge_checks ALTER COLUMN checked_at SET DEFAULT clock_timestamp();
-- Correct the initially incomplete CELEX URL before this source has any versions.
UPDATE vancore_private.vera_knowledge_sources SET url='https://eur-lex.europa.eu/eli/reg/2016/679/'
 WHERE id='eu-gdpr' AND url='https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02016R0679'
 AND NOT EXISTS(SELECT 1 FROM vancore_private.vera_knowledge_versions WHERE source_id='eu-gdpr');
DO $$BEGIN IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_knowledge_sources WHERE id='eu-gdpr' AND url='https://eur-lex.europa.eu/eli/reg/2016/679/') THEN RAISE EXCEPTION 'Existing GDPR provenance requires operator review';END IF;END $$;
CREATE FUNCTION public.vancore_vera_knowledge_fresh(p_source text,p_query text,p_articles jsonb DEFAULT '[]')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE observation vancore_private.vera_knowledge_checks; version vancore_private.vera_knowledge_versions; selected jsonb;
BEGIN
 IF current_user<>'service_role' THEN RAISE EXCEPTION 'Server role required' USING ERRCODE='42501';END IF;
 IF length(coalesce(p_query,'')) NOT BETWEEN 1 AND 6000 OR jsonb_typeof(p_articles) IS DISTINCT FROM 'array' OR jsonb_array_length(p_articles)>24 THEN RAISE EXCEPTION 'Invalid retrieval query' USING ERRCODE='22023';END IF;
 IF NOT EXISTS(SELECT 1 FROM vancore_private.vera_knowledge_sources WHERE id=p_source AND enabled AND area='legal') THEN RAISE EXCEPTION 'Unknown approved legal source' USING ERRCODE='22023';END IF;
 SELECT * INTO observation FROM vancore_private.vera_knowledge_checks WHERE source_id=p_source ORDER BY checked_at DESC,id DESC LIMIT 1;
 IF NOT FOUND OR observation.outcome<>'retrieved' OR observation.checked_at<clock_timestamp()-interval '24 hours' OR observation.checked_at>clock_timestamp() THEN RETURN jsonb_build_object('available',false);END IF;
 SELECT * INTO version FROM vancore_private.vera_knowledge_versions WHERE id=observation.version_id AND source_id=p_source;
 IF NOT FOUND THEN RETURN jsonb_build_object('available',false);END IF;
 selected:=public.vancore_vera_knowledge('select',jsonb_build_object('sourceId',p_source,'versionId',version.id,'query',p_query,'articles',p_articles));
 RETURN selected||jsonb_build_object('available',true,'sha256',version.sha256,'retrievedAt',observation.checked_at,'reviewStatus',version.review_status);
END $$;
REVOKE ALL ON FUNCTION public.vancore_vera_knowledge_fresh(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.vancore_vera_knowledge_fresh(text,text,jsonb) TO service_role;
