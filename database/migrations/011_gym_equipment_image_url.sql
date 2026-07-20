BEGIN;

ALTER TABLE gym_equipment
ADD COLUMN IF NOT EXISTS image_url text;

COMMIT;
