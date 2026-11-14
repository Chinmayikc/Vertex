-- Allowlist only the 50 organizer-approved Build with Sarvam registrations.
-- Safe to run again: it validates the source, adds missing finalist IDs, and
-- refuses to remove or silently replace any previously allowlisted team.
BEGIN;
DO $$
DECLARE
  eid uuid;
  approved_count integer;
  unique_names integer;
  unique_emails integer;
BEGIN
  SELECT id INTO STRICT eid FROM public.events WHERE slug='build-with-sarvam';
  SELECT count(*) INTO approved_count
  FROM public.event_registrations
  WHERE event_id=eid AND status='approved';
  IF approved_count <> 50 THEN
    RAISE EXCEPTION 'Expected exactly 50 approved Build with Sarvam registrations; found %', approved_count;
  END IF;

  SELECT count(DISTINCT lower(btrim(form_data->>'team_name'))),
         count(DISTINCT lower(btrim(email)))
    INTO unique_names, unique_emails
  FROM public.event_registrations
  WHERE event_id=eid AND status='approved';
  IF unique_names <> 50 THEN RAISE EXCEPTION 'Approved team names are missing or duplicated'; END IF;
  IF unique_emails <> 50 THEN RAISE EXCEPTION 'Approved leader emails are missing or duplicated'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.event_id=eid AND r.status='approved'
      AND (nullif(btrim(r.email),'') IS NULL
        OR nullif(btrim(r.form_data->>'team_name'),'') IS NULL
        OR nullif(btrim(r.form_data->>'project_title'),'') IS NULL
        OR nullif(btrim(r.form_data->>'problem'),'') IS NULL
        OR nullif(btrim(r.form_data->>'track'),'') IS NULL
        OR nullif(btrim(r.form_data->>'solution'),'') IS NULL
        OR CASE
          WHEN jsonb_typeof(r.form_data->'members') = 'array'
            THEN jsonb_array_length(r.form_data->'members') <> 4
          ELSE true
        END)
  ) THEN RAISE EXCEPTION 'An approved registration is missing required team or idea data'; END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_registrations r
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(r.form_data->'members') = 'array'
        THEN r.form_data->'members' ELSE '[]'::jsonb END
    ) m
    WHERE r.event_id=eid AND r.status='approved'
    GROUP BY r.id, r.email
    HAVING count(*) FILTER (WHERE m->'is_lead'='true'::jsonb) <> 1
       OR count(*) FILTER (WHERE lower(btrim(m->>'email'))=lower(btrim(r.email))) <> 1
       OR count(*) FILTER (WHERE nullif(btrim(m->>'name'),'') IS NULL
                            OR nullif(btrim(m->>'email'),'') IS NULL) > 0
  ) THEN RAISE EXCEPTION 'Each approved team must have one leader matching its registration email'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_finalists f
    WHERE f.event_id=eid
      AND NOT EXISTS (
        SELECT 1 FROM public.event_registrations r
        WHERE r.id=f.team_id AND r.event_id=eid AND r.status='approved'
      )
  ) THEN RAISE EXCEPTION 'Existing allowlist differs from approved registrations; reconcile explicitly'; END IF;

  INSERT INTO public.finalist_settings(event_id) VALUES(eid) ON CONFLICT DO NOTHING;
  INSERT INTO public.event_finalists(event_id,team_id)
  SELECT eid,r.id FROM public.event_registrations r
  WHERE r.event_id=eid AND r.status='approved'
  ON CONFLICT DO NOTHING;
END $$;
COMMIT;
