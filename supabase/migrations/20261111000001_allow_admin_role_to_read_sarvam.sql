-- Keep the Sarvam-specific restrictive RLS guard aligned with the app's
-- canonical admin role while preserving the explicit hackathon allowlist.
DO $$
BEGIN
  IF to_regprocedure('public.is_hackathon_admin()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION public.is_hackathon_admin()
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
        DECLARE allowlisted boolean;
        BEGIN
          IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
            RETURN true;
          END IF;

          IF pg_catalog.to_regclass('public.admin_emails') IS NULL THEN
            RETURN false;
          END IF;

          EXECUTE $query$
            SELECT EXISTS (
              SELECT 1
              FROM auth.users u
              JOIN public.admin_emails a
                ON lower(btrim(u.email)) = lower(btrim(a.email))
              WHERE u.id = auth.uid()
                AND u.email_confirmed_at IS NOT NULL
            )
          $query$ INTO allowlisted;

          RETURN allowlisted;
        END;
      $body$;
    $fn$;
  ELSE
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.is_hackathon_admin()
      RETURNS boolean
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
        DECLARE allowlisted boolean;
        BEGIN
          IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
            RETURN true;
          END IF;

          IF pg_catalog.to_regclass('public.admin_emails') IS NULL THEN
            RETURN false;
          END IF;

          EXECUTE $query$
            SELECT EXISTS (
              SELECT 1
              FROM auth.users u
              JOIN public.admin_emails a
                ON lower(btrim(u.email)) = lower(btrim(a.email))
              WHERE u.id = auth.uid()
                AND u.email_confirmed_at IS NOT NULL
            )
          $query$ INTO allowlisted;

          RETURN allowlisted;
        END;
      $body$;
    $fn$;
  END IF;
END
$$;

REVOKE EXECUTE ON FUNCTION public.is_hackathon_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_hackathon_admin() TO authenticated, service_role;
