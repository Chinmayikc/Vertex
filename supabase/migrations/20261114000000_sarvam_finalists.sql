-- Reuse the approved Build with Sarvam registrations. `team_id` in the finalist
-- tables is the existing event_registrations.id for this event.
ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_event_id_id_unique UNIQUE(event_id,id);
CREATE TABLE public.finalist_settings (
 event_id uuid PRIMARY KEY REFERENCES public.events(id),
 dashboard_enabled boolean NOT NULL DEFAULT false,
 submissions_enabled boolean NOT NULL DEFAULT false,
 opens_at timestamptz, closes_at timestamptz,
 upload_storage_limit_bytes bigint NOT NULL DEFAULT 500000000 CHECK(upload_storage_limit_bytes BETWEEN 250000000 AND 1000000000),
 organizer_contact text NOT NULL DEFAULT 'Contact the Vertex event organizers using the contact details in your selection email.',
 CHECK (NOT submissions_enabled OR (dashboard_enabled AND opens_at IS NOT NULL AND closes_at > opens_at))
);
CREATE TABLE public.event_finalists (
 event_id uuid NOT NULL REFERENCES public.finalist_settings(event_id),
 team_id uuid NOT NULL,
 confirmed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(event_id,team_id),
 FOREIGN KEY(event_id,team_id) REFERENCES public.event_registrations(event_id,id)
);
CREATE TABLE public.finalist_uploads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_id uuid NOT NULL, team_id uuid NOT NULL, user_id uuid NOT NULL REFERENCES auth.users(id),
 object_key text NOT NULL UNIQUE, file_name text NOT NULL, file_size integer NOT NULL CHECK(file_size BETWEEN 1 AND 5000000),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '2 hours',
 consumed_at timestamptz, deleted_at timestamptz,
 FOREIGN KEY(event_id,team_id) REFERENCES public.event_finalists(event_id,team_id)
);
CREATE TABLE public.final_project_submissions (
 event_id uuid NOT NULL, team_id uuid NOT NULL,
 upload_id uuid NOT NULL UNIQUE REFERENCES public.finalist_uploads(id),
 project_url text NOT NULL, demo_url text NOT NULL, github_url text NOT NULL, video_url text NOT NULL,
 deck_key text NOT NULL, deck_name text NOT NULL, deck_size integer NOT NULL CHECK(deck_size BETWEEN 1 AND 5000000),
 created_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(event_id,team_id),
 FOREIGN KEY(event_id,team_id) REFERENCES public.event_finalists(event_id,team_id)
);
-- All access goes through authenticated server functions. No browser CRUD or Storage policies.
ALTER TABLE public.finalist_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_finalists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finalist_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_project_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.finalist_settings,public.event_finalists,public.finalist_uploads,public.final_project_submissions FROM anon,authenticated;
GRANT ALL ON public.finalist_settings,public.event_finalists,public.finalist_uploads,public.final_project_submissions TO service_role;
INSERT INTO storage.buckets(id,name,public,file_size_limit) VALUES ('finalist-decks','finalist-decks',false,5000000);

-- Serialize upload reservations and finalization on the team; recheck the window at commit.
CREATE FUNCTION public.reserve_finalist_upload(p_event uuid,p_team uuid,p_user uuid,p_name text,p_size integer,p_id uuid)
RETURNS public.finalist_uploads LANGUAGE plpgsql SET search_path=public AS $$
DECLARE r public.finalist_uploads; cfg public.finalist_settings; used_bytes bigint;
BEGIN
 PERFORM 1 FROM public.event_registrations WHERE event_id=p_event AND id=p_team AND status='approved' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved finalist registration not found.'; END IF;
 PERFORM 1 FROM public.event_finalists WHERE event_id=p_event AND team_id=p_team;
 IF NOT FOUND THEN RAISE EXCEPTION 'This registration is not on the finalist allowlist.'; END IF;
 SELECT * INTO cfg FROM public.finalist_settings WHERE event_id=p_event FOR UPDATE;
 IF NOT FOUND OR NOT cfg.dashboard_enabled OR NOT cfg.submissions_enabled OR clock_timestamp()<cfg.opens_at OR clock_timestamp()>=cfg.closes_at THEN
  RAISE EXCEPTION 'Final submissions are closed.';
 END IF;
 SELECT coalesce(sum(file_size),0) INTO used_bytes FROM public.finalist_uploads WHERE event_id=p_event AND deleted_at IS NULL;
 IF used_bytes+p_size>cfg.upload_storage_limit_bytes THEN RAISE EXCEPTION 'Finalist upload storage budget is full. Contact the organizers.'; END IF;
 IF (SELECT count(*) FROM public.finalist_uploads WHERE event_id=p_event AND team_id=p_team AND consumed_at IS NULL AND expires_at>clock_timestamp() AND deleted_at IS NULL)>=3 THEN RAISE EXCEPTION 'Three uploads are already pending. Retry an existing upload or wait two hours.'; END IF;
 INSERT INTO public.finalist_uploads(id,event_id,team_id,user_id,object_key,file_name,file_size)
 VALUES(p_id,p_event,p_team,p_user,p_event::text||'/'||p_team::text||'/'||p_id::text,p_name,p_size) RETURNING * INTO r;
 RETURN r;
END $$;
CREATE FUNCTION public.commit_finalist_submission(p_event uuid,p_team uuid,p_user uuid,p_upload uuid,p_links jsonb)
RETURNS public.final_project_submissions LANGUAGE plpgsql SET search_path=public AS $$
DECLARE u public.finalist_uploads; r public.final_project_submissions;
BEGIN
 PERFORM 1 FROM public.event_registrations WHERE event_id=p_event AND id=p_team AND status='approved' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved finalist registration not found.'; END IF;
 PERFORM 1 FROM public.event_finalists WHERE event_id=p_event AND team_id=p_team;
 IF NOT FOUND THEN RAISE EXCEPTION 'This registration is not on the finalist allowlist.'; END IF;
 SELECT * INTO r FROM public.final_project_submissions WHERE event_id=p_event AND team_id=p_team AND upload_id=p_upload;
 IF FOUND THEN RETURN r; END IF;
 PERFORM 1 FROM public.finalist_settings WHERE event_id=p_event AND dashboard_enabled AND submissions_enabled AND clock_timestamp()>=opens_at AND clock_timestamp()<closes_at FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Final submissions are closed.'; END IF;
 SELECT * INTO u FROM public.finalist_uploads WHERE id=p_upload AND event_id=p_event AND team_id=p_team AND user_id=p_user AND consumed_at IS NULL AND deleted_at IS NULL AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Upload expired or unavailable.'; END IF;
 INSERT INTO public.final_project_submissions(event_id,team_id,upload_id,project_url,demo_url,github_url,video_url,deck_key,deck_name,deck_size)
 VALUES(p_event,p_team,p_upload,p_links->>'project',p_links->>'demo',p_links->>'github',p_links->>'video',u.object_key,u.file_name,u.file_size)
 ON CONFLICT(event_id,team_id) DO UPDATE SET upload_id=excluded.upload_id,project_url=excluded.project_url,demo_url=excluded.demo_url,github_url=excluded.github_url,video_url=excluded.video_url,deck_key=excluded.deck_key,deck_name=excluded.deck_name,deck_size=excluded.deck_size,submitted_at=clock_timestamp()
 RETURNING * INTO r;
 UPDATE public.finalist_uploads SET consumed_at=clock_timestamp() WHERE id=u.id;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.reserve_finalist_upload(uuid,uuid,uuid,text,integer,uuid),public.commit_finalist_submission(uuid,uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_finalist_upload(uuid,uuid,uuid,text,integer,uuid),public.commit_finalist_submission(uuid,uuid,uuid,uuid,jsonb) TO service_role;
