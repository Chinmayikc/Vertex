-- The registration form accepts standard national and international phone formats.
-- Keep the database constraint aligned with the UI and server-side validation.
ALTER TABLE public.neural_network_workshop_registrations
  DROP CONSTRAINT IF EXISTS neural_network_workshop_registrations_phone_check;

ALTER TABLE public.neural_network_workshop_registrations
  ADD CONSTRAINT neural_network_workshop_registrations_phone_check
  CHECK (phone ~ '^\\+?[0-9][0-9() -]{6,29}$');
