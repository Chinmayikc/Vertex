-- Editor and Design are application-only preferences. They are intentionally
-- not added to the public teams directory, so applications need to accept
-- these values without requiring matching rows in public.teams.
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_team_first_fkey,
  DROP CONSTRAINT IF EXISTS applications_team_second_fkey;
