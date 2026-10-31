-- Code/ACL rollback only. No client data is restored, replaced or deleted.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER FUNCTION vancore_private.is_admin() SET SCHEMA public;
ALTER FUNCTION vancore_private.is_staff() SET SCHEMA public;
CREATE OR REPLACE FUNCTION public.vancore_guard_profile_privileges()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
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
ALTER FUNCTION public.handle_new_user() RESET search_path;
GRANT EXECUTE ON FUNCTION public.is_admin(), public.is_staff(),
  public.handle_new_user(), public.vancore_guard_profile_privileges()
  TO PUBLIC, anon, authenticated, service_role;
COMMIT;
