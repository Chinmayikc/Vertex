INSERT INTO public.events (
  slug,
  title,
  event_date,
  location,
  tag,
  description,
  published,
  schedule_tba,
  workspace_kind
)
VALUES (
  'hackathon-workspace',
  'Vertex Global Hackathon 2026',
  '2026-10-16',
  'REVA University - Virtual and On-Site',
  'Hackathon',
  'A shared innovation sprint across four tracks with online and on-site phases.',
  true,
  false,
  'hackathon'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.event_workspaces (
  event_id,
  registration_open,
  min_team_size,
  max_team_size,
  rules,
  submissions_open,
  published
)
SELECT
  id,
  true,
  1,
  4,
  'Individual participants and teams of up to four builders may register.',
  false,
  true
FROM public.events
WHERE slug = 'hackathon-workspace'
ON CONFLICT (event_id) DO NOTHING;