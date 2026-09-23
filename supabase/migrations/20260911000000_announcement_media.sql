-- Optional media attached to a public announcement.
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'announcements_media_type_check'
      AND conrelid = 'public.announcements'::regclass
  ) THEN
    ALTER TABLE public.announcements
      ADD CONSTRAINT announcements_media_type_check
      CHECK (media_type IS NULL OR media_type IN ('image', 'video'));
  END IF;
END $$;
