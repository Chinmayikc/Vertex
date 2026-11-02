-- Keep the production event catalogue aligned with the workshop page and pass emails.
UPDATE public.events
SET event_date = '2026-11-06',
    start_time = '8:30 AM to 12:30 PM',
    location = 'SVB B009, REVA University, Bengaluru',
    published = true
WHERE slug = 'neural-networks-from-scratch';
