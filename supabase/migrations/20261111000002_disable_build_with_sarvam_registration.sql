-- Keep the Build with Sarvam registration control disabled in the database.
UPDATE public.event_operation_settings AS settings
SET registration_open = false
FROM public.events AS events
WHERE settings.event_id = events.id
  AND events.slug = 'build-with-sarvam';
