-- Security hardening migration

-- 1) Ensure all public views run with SECURITY INVOKER (not definer)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT n.nspname AS schemaname, c.relname AS viewname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v' AND n.nspname = 'public'
  ) LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', r.schemaname, r.viewname);
  END LOOP;
END $$;

-- 2) Pin function search_path for trigger function(s)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
