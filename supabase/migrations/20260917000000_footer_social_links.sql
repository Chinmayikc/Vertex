CREATE TABLE public.site_social_links (
  id text PRIMARY KEY,
  href text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_social_links TO authenticated;
GRANT ALL ON public.site_social_links TO service_role;

ALTER TABLE public.site_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site social links are public"
  ON public.site_social_links FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage site social links"
  ON public.site_social_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_social_links_updated_at BEFORE UPDATE ON public.site_social_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_social_links (id, href)
VALUES ('instagram', 'https://www.instagram.com/vertex.reva/');
