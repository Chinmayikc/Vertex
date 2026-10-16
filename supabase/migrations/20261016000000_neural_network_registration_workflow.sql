-- Neural Networks workshop registration workflow.
-- Public registration is handled by a validated server function; only admins
-- can read or update these rows through the Data API.

CREATE TABLE IF NOT EXISTS public.neural_network_workshop_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  srn text NOT NULL,
  department text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  year text NOT NULL,
  attend_reason text NOT NULL,
  expectation text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tracking_token text NOT NULL DEFAULT encode(gen_random_bytes(18), 'hex'),
  qr_token text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_in_at timestamptz,
  checked_in_by uuid,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neural_network_workshop_registrations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tracking_token text,
  ADD COLUMN IF NOT EXISTS qr_token text,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS checked_in_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.neural_network_workshop_registrations
SET tracking_token = encode(gen_random_bytes(18), 'hex')
WHERE tracking_token IS NULL;

ALTER TABLE public.neural_network_workshop_registrations
  ALTER COLUMN tracking_token SET DEFAULT encode(gen_random_bytes(18), 'hex'),
  ALTER COLUMN tracking_token SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'neural_network_registrations_status_check'
  ) THEN
    ALTER TABLE public.neural_network_workshop_registrations
      ADD CONSTRAINT neural_network_registrations_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS neural_network_registrations_tracking_token_idx
  ON public.neural_network_workshop_registrations (tracking_token);
CREATE UNIQUE INDEX IF NOT EXISTS neural_network_registrations_qr_token_idx
  ON public.neural_network_workshop_registrations (qr_token)
  WHERE qr_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS neural_network_registrations_email_idx
  ON public.neural_network_workshop_registrations (lower(email));
CREATE INDEX IF NOT EXISTS neural_network_registrations_status_idx
  ON public.neural_network_workshop_registrations (status);

DROP TRIGGER IF EXISTS neural_network_workshop_registrations_updated_at
  ON public.neural_network_workshop_registrations;
CREATE TRIGGER neural_network_workshop_registrations_updated_at
  BEFORE UPDATE ON public.neural_network_workshop_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, UPDATE, DELETE ON public.neural_network_workshop_registrations TO authenticated;
GRANT ALL ON public.neural_network_workshop_registrations TO service_role;
REVOKE ALL ON public.neural_network_workshop_registrations FROM anon;
ALTER TABLE public.neural_network_workshop_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read neural network workshop registrations"
  ON public.neural_network_workshop_registrations;
CREATE POLICY "Admins read neural network workshop registrations"
  ON public.neural_network_workshop_registrations
  FOR SELECT TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin')));

DROP POLICY IF EXISTS "Admins update neural network workshop registrations"
  ON public.neural_network_workshop_registrations;
CREATE POLICY "Admins update neural network workshop registrations"
  ON public.neural_network_workshop_registrations
  FOR UPDATE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin')))
  WITH CHECK ((select public.has_role((select auth.uid()), 'admin')));

DROP POLICY IF EXISTS "Admins delete neural network workshop registrations"
  ON public.neural_network_workshop_registrations;
CREATE POLICY "Admins delete neural network workshop registrations"
  ON public.neural_network_workshop_registrations
  FOR DELETE TO authenticated
  USING ((select public.has_role((select auth.uid()), 'admin')));
