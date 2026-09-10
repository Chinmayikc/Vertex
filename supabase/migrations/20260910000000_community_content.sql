-- Community content: accepted applications, event galleries, and announcement media.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text;

CREATE TABLE IF NOT EXISTS public.accepted_applications (
  application_id uuid PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  name text NOT NULL,
  usn text,
  year text,
  branch text,
  email text NOT NULL,
  phone text,
  team_first text,
  team_second text,
  why text,
  links text,
  notes text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accepted_applications TO authenticated;
GRANT ALL ON public.accepted_applications TO service_role;
ALTER TABLE public.accepted_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read accepted applications" ON public.accepted_applications FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_head_of(auth.uid(), team_first)
    OR public.is_head_of(auth.uid(), team_second)
  );
CREATE POLICY "Admins manage accepted applications" ON public.accepted_applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sync_accepted_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.accepted_applications (
      application_id, name, usn, year, branch, email, phone, team_first,
      team_second, why, links, notes, accepted_at, accepted_by
    ) VALUES (
      NEW.id, NEW.name, NEW.usn, NEW.year, NEW.branch, NEW.email, NEW.phone,
      NEW.team_first, NEW.team_second, NEW.why, NEW.links, NEW.notes,
      COALESCE((SELECT accepted_at FROM public.accepted_applications WHERE application_id = NEW.id), now()),
      auth.uid()
    )
    ON CONFLICT (application_id) DO UPDATE SET
      name = EXCLUDED.name,
      usn = EXCLUDED.usn,
      year = EXCLUDED.year,
      branch = EXCLUDED.branch,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      team_first = EXCLUDED.team_first,
      team_second = EXCLUDED.team_second,
      why = EXCLUDED.why,
      links = EXCLUDED.links,
      notes = EXCLUDED.notes,
      accepted_by = EXCLUDED.accepted_by;
  ELSE
    DELETE FROM public.accepted_applications WHERE application_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_sync_accepted ON public.applications;
CREATE TRIGGER applications_sync_accepted
  AFTER INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_accepted_application();

INSERT INTO public.accepted_applications (
  application_id, name, usn, year, branch, email, phone, team_first,
  team_second, why, links, notes
)
SELECT id, name, usn, year, branch, email, phone, team_first, team_second, why, links, notes
FROM public.applications
WHERE status = 'accepted'
ON CONFLICT (application_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Vertex moment',
  caption text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'poster')),
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_gallery TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_gallery TO authenticated;
GRANT ALL ON public.event_gallery TO service_role;
ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published event gallery is public" ON public.event_gallery FOR SELECT TO anon, authenticated
  USING (published = true);
CREATE POLICY "Admins manage event gallery" ON public.event_gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER event_gallery_updated_at BEFORE UPDATE ON public.event_gallery
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

