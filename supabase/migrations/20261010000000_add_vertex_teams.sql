-- Add the current Vertex team structure without changing existing member assignments.
INSERT INTO public.teams (id, name, code, blurb, sort_order)
VALUES
  (
    'creative-design',
    'Creative and Design',
    'CRD',
    'Shapes the visual language of Vertex across campaigns, products, and events.',
    6
  ),
  (
    'social-media',
    'Social Media',
    'SOC',
    'Tells the Vertex story and keeps the community connected across social channels.',
    7
  ),
  (
    'core-editor',
    'Core Editor',
    'EDT',
    'Edits, refines, and publishes the words that represent Vertex.',
    8
  ),
  (
    'associate',
    'Associate',
    'ASC',
    'Supports teams across the club and helps turn ideas into consistent execution.',
    9
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    code = EXCLUDED.code,
    blurb = EXCLUDED.blurb,
    sort_order = EXCLUDED.sort_order;
