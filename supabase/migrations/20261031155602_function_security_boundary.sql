-- Preserve helper OIDs so existing RLS policies keep their dependencies.
-- This schema must remain outside the Data API's exposed schema list.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE SCHEMA IF NOT EXISTS vancore_private;
REVOKE ALL ON SCHEMA vancore_private FROM PUBLIC;
GRANT USAGE ON SCHEMA vancore_private TO anon, authenticated, service_role;

ALTER FUNCTION public.is_admin() SET SCHEMA vancore_private;
ALTER FUNCTION public.is_staff() SET SCHEMA vancore_private;
REVOKE ALL ON FUNCTION vancore_private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION vancore_private.is_staff() FROM PUBLIC;
-- The invoker needs EXECUTE for RLS. The helpers only inspect auth.uid();
-- placing them outside the exposed schemas removes their public RPC endpoint.
GRANT EXECUTE ON FUNCTION vancore_private.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION vancore_private.is_staff() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.vancore_guard_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT vancore_private.is_admin() THEN
    IF (to_jsonb(NEW) - ARRAY['name','company','phone','vat_id','updated_at'])
       IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['name','company','phone','vat_id','updated_at']) THEN
      RAISE EXCEPTION 'Only administrators can change account privileges and billing fields'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- The signup trigger only uses qualified public.users; an empty search_path
-- removes object-shadowing risk without changing profile initialization.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.vancore_guard_profile_privileges() FROM PUBLIC, anon, authenticated;

COMMIT;
