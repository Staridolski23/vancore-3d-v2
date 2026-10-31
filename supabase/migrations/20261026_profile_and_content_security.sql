-- Additive compatibility and access-control repair. No client records are deleted.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vat_id text DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'); $$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'consultant')); $$;

-- These old policies queried users from inside its own RLS policy, causing recursion.
ALTER POLICY "Admins can update all profiles" ON public.users
  USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Admins can view all profiles" ON public.users
  USING (public.is_admin());

-- The previous policy was named 'Service role' but actually applied to PUBLIC.
ALTER POLICY "Service role can manage content" ON public.site_content
  TO service_role USING (true) WITH CHECK (true);

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

CREATE OR REPLACE TRIGGER vancore_guard_profile_privileges
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.vancore_guard_profile_privileges();

COMMIT;
