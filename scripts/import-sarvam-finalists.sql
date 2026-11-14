-- Run from the directory containing organizer-confirmed finalists.csv (header team_id).
-- psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f /path/to/scripts/import-sarvam-finalists.sql
BEGIN;
CREATE TEMP TABLE confirmed_ids(team_id uuid PRIMARY KEY);
\copy confirmed_ids FROM 'finalists.csv' WITH (FORMAT csv, HEADER true)
DO $$
DECLARE eid uuid;
BEGIN
 SELECT id INTO STRICT eid FROM public.events WHERE slug='build-with-sarvam';
 IF (SELECT count(*) FROM confirmed_ids)<>50 THEN RAISE EXCEPTION 'Expected exactly 50 confirmed team IDs'; END IF;
 IF EXISTS(SELECT 1 FROM confirmed_ids c LEFT JOIN public.hackathon_teams t ON t.id=c.team_id AND t.event_id=eid WHERE t.id IS NULL) THEN RAISE EXCEPTION 'Unknown team ID or wrong event; registrations were not changed'; END IF;
 IF EXISTS(SELECT lower(btrim(t.lead_email)) FROM confirmed_ids c JOIN public.hackathon_teams t ON t.id=c.team_id GROUP BY lower(btrim(t.lead_email)) HAVING count(*)<>1) THEN RAISE EXCEPTION 'Ambiguous normalized leader email'; END IF;
 IF EXISTS(SELECT 1 FROM confirmed_ids c JOIN public.hackathon_teams t ON t.id=c.team_id WHERE btrim(t.lead_email)='') THEN RAISE EXCEPTION 'Missing leader email'; END IF;
 IF EXISTS(SELECT 1 FROM public.event_finalists f WHERE f.event_id=eid AND NOT EXISTS(SELECT 1 FROM confirmed_ids c WHERE c.team_id=f.team_id)) THEN RAISE EXCEPTION 'Existing allowlist differs. Reconcile explicitly with organizers; no automatic removals'; END IF;
 INSERT INTO public.finalist_settings(event_id) VALUES(eid) ON CONFLICT DO NOTHING;
 INSERT INTO public.event_finalists(event_id,team_id) SELECT eid,team_id FROM confirmed_ids ON CONFLICT DO NOTHING;
END $$;
COMMIT;
