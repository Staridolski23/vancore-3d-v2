-- Actual hosted RLS/trigger acceptance. Every write is rolled back, even the
-- permitted no-op profile/admin updates. No identities or profile values print.
BEGIN;
DO $$ DECLARE client_id uuid; BEGIN
 SELECT id INTO STRICT client_id FROM public.users WHERE role='client' ORDER BY id LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',client_id::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',client_id,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE statement text; blocked integer:=0; changed integer; BEGIN
 IF vancore_private.is_admin() THEN RAISE EXCEPTION 'Client unexpectedly has administrator rights'; END IF;
 IF (SELECT count(*) FROM public.users)<>1 THEN RAISE EXCEPTION 'Client profile read isolation failed'; END IF;
 FOREACH statement IN ARRAY ARRAY[
  'UPDATE public.users SET role=''admin'' WHERE id=auth.uid()',
  'UPDATE public.users SET plan=''business'' WHERE id=auth.uid()',
  'UPDATE public.users SET credits=coalesce(credits,0)+1 WHERE id=auth.uid()',
  'UPDATE public.users SET subscription_status=''synthetic-test'' WHERE id=auth.uid()',
  'UPDATE public.users SET subscription_end=''2099-12-31'' WHERE id=auth.uid()',
  'UPDATE public.users SET email=''qa@example.invalid'' WHERE id=auth.uid()',
  'UPDATE public.users SET id=gen_random_uuid() WHERE id=auth.uid()'
 ] LOOP
  BEGIN
   EXECUTE statement;
   RAISE EXCEPTION 'Protected profile field unexpectedly writable';
  EXCEPTION WHEN insufficient_privilege THEN blocked:=blocked+1;
  END;
 END LOOP;
 IF blocked<>7 THEN RAISE EXCEPTION 'Protected-field test incomplete'; END IF;
 UPDATE public.users SET name=name,company=company,phone=phone,vat_id=vat_id WHERE id=auth.uid();
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'Permitted self profile update failed'; END IF;
 UPDATE public.users SET name=name WHERE id<>auth.uid();
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Foreign profile update isolation failed'; END IF;
END $$;
RESET ROLE;
DO $$ DECLARE admin_id uuid; BEGIN
 SELECT id INTO STRICT admin_id FROM public.users WHERE role='admin' ORDER BY id LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE changed integer; BEGIN
 IF NOT vancore_private.is_admin() THEN RAISE EXCEPTION 'Administrator rights unavailable'; END IF;
 UPDATE public.users SET credits=credits WHERE id=(SELECT id FROM public.users WHERE role='client' ORDER BY id LIMIT 1);
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'Authorized administrator write failed'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 PERFORM set_config('request.jwt.claim.sub','',true);
 PERFORM set_config('request.jwt.claim.role','anon',true);
 PERFORM set_config('request.jwt.claims','{"role":"anon"}',true);
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.users)<>0 THEN RAISE EXCEPTION 'Anonymous profile read isolation failed'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT jsonb_build_object('status','PASS','protectedFieldsBlocked',7,'ownProfileUpdate','PASS-rolled-back','foreignProfileUpdate','PASS-zero-rows','administratorUpdate','PASS-rolled-back','anonymousRead','PASS-zero-rows','writesCommitted',false,'profileCount',count(*),'dataFingerprint',md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,''))) AS verification FROM public.users u;
