BEGIN;

CREATE TABLE IF NOT EXISTS body_goal_images (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body_goal_id integer NOT NULL,
  gender text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT body_goal_images_body_goal_fk FOREIGN KEY (body_goal_id)
    REFERENCES body_goals (id)
    ON DELETE CASCADE,
  CONSTRAINT body_goal_images_gender_valid CHECK (
    gender IN ('male', 'female', 'unisex')
  ),
  CONSTRAINT body_goal_images_body_goal_gender_unique UNIQUE (
    body_goal_id,
    gender
  )
);

INSERT INTO body_goal_images (
  body_goal_id,
  gender,
  image_url
)
SELECT
  bg.id,
  CASE
    WHEN bg.gender_display = 'Male' THEN 'male'
    WHEN bg.gender_display = 'Female' THEN 'female'
    ELSE 'unisex'
  END,
  bg.image_url
FROM body_goals AS bg
WHERE bg.image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM body_goal_images AS bgi
    WHERE bgi.body_goal_id = bg.id
      AND bgi.gender = CASE
        WHEN bg.gender_display = 'Male' THEN 'male'
        WHEN bg.gender_display = 'Female' THEN 'female'
        ELSE 'unisex'
      END
  );

CREATE INDEX IF NOT EXISTS idx_body_goal_images_body_goal_id
  ON body_goal_images (body_goal_id);

CREATE INDEX IF NOT EXISTS idx_body_goal_images_gender
  ON body_goal_images (gender);

CREATE TRIGGER set_body_goal_images_updated_at
BEFORE UPDATE ON body_goal_images
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE body_goals
  DROP CONSTRAINT IF EXISTS body_goals_gender_display_valid;

ALTER TABLE body_goals
  DROP COLUMN IF EXISTS gender_display;

ALTER TABLE body_goals
  DROP COLUMN IF EXISTS image_url;

COMMIT;
