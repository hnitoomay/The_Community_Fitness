BEGIN;

-- Each authenticated user owns at most one profile row. The profile
-- references Better Auth users and can optionally reference a body goal.
CREATE TABLE client_profiles (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  full_name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  avatar_url text,
  selected_body_goal_id integer,
  onboarding_completed boolean NOT NULL DEFAULT false,
  preferred_language text NOT NULL DEFAULT 'my',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT client_profiles_user_id_unique UNIQUE (user_id),
  CONSTRAINT client_profiles_user_fk FOREIGN KEY (user_id)
    REFERENCES auth_users (id)
    ON DELETE CASCADE,
  CONSTRAINT client_profiles_selected_body_goal_fk FOREIGN KEY (selected_body_goal_id)
    REFERENCES body_goals (id)
    ON DELETE SET NULL,
  CONSTRAINT client_profiles_full_name_not_blank CHECK (
    btrim(full_name) <> ''
  ),
  CONSTRAINT client_profiles_age_positive CHECK (
    age > 0
  ),
  CONSTRAINT client_profiles_gender_not_blank CHECK (
    btrim(gender) <> ''
  ),
  CONSTRAINT client_profiles_preferred_language_not_blank CHECK (
    btrim(preferred_language) <> ''
  )
);

-- Measurement history is append-only per user. Multiple rows are allowed
-- so body progress can be tracked over time.
CREATE TABLE body_measurements (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  height_cm numeric(6,2) NOT NULL,
  weight_kg numeric(6,2) NOT NULL,
  waist_cm numeric(6,2) NOT NULL,
  chest_cm numeric(6,2) NOT NULL,
  hip_cm numeric(6,2) NOT NULL,
  arm_cm numeric(6,2) NOT NULL,
  thigh_cm numeric(6,2) NOT NULL,
  body_fat_percent numeric(5,2),
  measured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT body_measurements_user_fk FOREIGN KEY (user_id)
    REFERENCES auth_users (id)
    ON DELETE CASCADE,
  CONSTRAINT body_measurements_height_cm_positive CHECK (
    height_cm > 0
  ),
  CONSTRAINT body_measurements_weight_kg_positive CHECK (
    weight_kg > 0
  ),
  CONSTRAINT body_measurements_waist_cm_positive CHECK (
    waist_cm > 0
  ),
  CONSTRAINT body_measurements_chest_cm_positive CHECK (
    chest_cm > 0
  ),
  CONSTRAINT body_measurements_hip_cm_positive CHECK (
    hip_cm > 0
  ),
  CONSTRAINT body_measurements_arm_cm_positive CHECK (
    arm_cm > 0
  ),
  CONSTRAINT body_measurements_thigh_cm_positive CHECK (
    thigh_cm > 0
  ),
  CONSTRAINT body_measurements_body_fat_percent_positive CHECK (
    body_fat_percent IS NULL OR body_fat_percent > 0
  )
);

-- Each authenticated user owns one current preference record. Arrays are
-- used for multi-select preference fields without losing structure.
CREATE TABLE client_preferences (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  medical_conditions text[] NOT NULL DEFAULT ARRAY[]::text[],
  other_health_condition text,
  disliked_exercises text[],
  food_allergies text[],
  food_restrictions text[],
  disliked_foods text[],
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT client_preferences_user_id_unique UNIQUE (user_id),
  CONSTRAINT client_preferences_user_fk FOREIGN KEY (user_id)
    REFERENCES auth_users (id)
    ON DELETE CASCADE,
  CONSTRAINT client_preferences_other_health_condition_not_blank CHECK (
    other_health_condition IS NULL OR btrim(other_health_condition) <> ''
  )
);

CREATE INDEX idx_client_profiles_selected_body_goal_id
  ON client_profiles (selected_body_goal_id);

CREATE INDEX idx_client_profiles_onboarding_completed
  ON client_profiles (onboarding_completed);

CREATE INDEX idx_body_measurements_user_id
  ON body_measurements (user_id);

CREATE INDEX idx_body_measurements_user_id_measured_at
  ON body_measurements (user_id, measured_at DESC);

CREATE TRIGGER set_client_profiles_updated_at
BEFORE UPDATE ON client_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_client_preferences_updated_at
BEFORE UPDATE ON client_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMENT ON TABLE client_profiles IS
  'One-to-one client profile for each Better Auth user, with an optional selected body goal.';

COMMENT ON COLUMN client_profiles.user_id IS
  'References auth_users.id. Deleting the auth user deletes the owned client profile.';

COMMENT ON COLUMN client_profiles.selected_body_goal_id IS
  'Optional selected goal referencing body_goals.id. If the goal is deleted, the profile keeps the user and clears the goal.';

COMMENT ON TABLE body_measurements IS
  'Historical body measurements owned by an auth user. Multiple rows per user are preserved over time.';

COMMENT ON COLUMN body_measurements.user_id IS
  'References auth_users.id so measurement history belongs to an authenticated user.';

COMMENT ON TABLE client_preferences IS
  'One-to-one current preference record for each Better Auth user, storing health and food-related choices.';

COMMENT ON COLUMN client_preferences.user_id IS
  'References auth_users.id. Deleting the auth user deletes the owned preference record.';

COMMIT;
