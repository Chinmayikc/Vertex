-- Keep the BUILD WITH SARVAM workspace rules aligned with the public event desk.
UPDATE public.event_workspaces
SET
  rules = 'Teams must have 2–4 members. The winning team receives 25K worth of Sarvam API credits. Every participant receives 500 API credits.',
  updated_at = now()
WHERE event_id = (SELECT id FROM public.events WHERE slug = 'build-with-sarvam');
