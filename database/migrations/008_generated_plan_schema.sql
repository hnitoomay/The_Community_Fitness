BEGIN;

-- Generated plans are append-only historical records per user. A user
-- may have many archived or failed plans over time, but only one active
-- plan at once.
CREATE TABLE generated_plans (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  ai_assessment_id integer,
  body_goal_id integer NOT NULL,
  workout_template_id integer NOT NULL,
  nutrition_template_id integer NOT NULL,
  source_input_hash text NOT NULL,
  profile_snapshot jsonb NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL,
  workout_model_name text,
  nutrition_model_name text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT generated_plans_user_fk FOREIGN KEY (user_id)
    REFERENCES auth_users (id)
    ON DELETE CASCADE,
  CONSTRAINT generated_plans_ai_assessment_fk FOREIGN KEY (ai_assessment_id)
    REFERENCES ai_assessments (id)
    ON DELETE SET NULL,
  CONSTRAINT generated_plans_body_goal_fk FOREIGN KEY (body_goal_id)
    REFERENCES body_goals (id)
    ON DELETE RESTRICT,
  CONSTRAINT generated_plans_workout_template_fk FOREIGN KEY (workout_template_id)
    REFERENCES workout_templates (id)
    ON DELETE RESTRICT,
  CONSTRAINT generated_plans_nutrition_template_fk FOREIGN KEY (nutrition_template_id)
    REFERENCES nutrition_templates (id)
    ON DELETE RESTRICT,
  CONSTRAINT generated_plans_source_input_hash_not_blank CHECK (
    btrim(source_input_hash) <> ''
  ),
  CONSTRAINT generated_plans_profile_snapshot_object CHECK (
    jsonb_typeof(profile_snapshot) = 'object'
  ),
  CONSTRAINT generated_plans_date_range_valid CHECK (
    end_date >= start_date
  ),
  CONSTRAINT generated_plans_status_valid CHECK (
    status IN ('generating', 'active', 'failed', 'archived')
  ),
  CONSTRAINT generated_plans_workout_model_name_not_blank CHECK (
    workout_model_name IS NULL OR btrim(workout_model_name) <> ''
  ),
  CONSTRAINT generated_plans_nutrition_model_name_not_blank CHECK (
    nutrition_model_name IS NULL OR btrim(nutrition_model_name) <> ''
  )
);

-- Each plan stores one row per calendar date within the generated plan.
CREATE TABLE generated_plan_days (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id integer NOT NULL,
  plan_date date NOT NULL,
  week_number integer NOT NULL,
  day_number integer NOT NULL,
  day_type text NOT NULL,
  focus_category text,
  estimated_duration_minutes integer,
  workout_notes text,
  nutrition_notes text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT generated_plan_days_plan_fk FOREIGN KEY (plan_id)
    REFERENCES generated_plans (id)
    ON DELETE CASCADE,
  CONSTRAINT generated_plan_days_week_number_valid CHECK (
    week_number BETWEEN 1 AND 4
  ),
  CONSTRAINT generated_plan_days_day_number_valid CHECK (
    day_number BETWEEN 1 AND 7
  ),
  CONSTRAINT generated_plan_days_day_type_valid CHECK (
    day_type IN ('workout', 'cardio', 'stretching', 'rest')
  ),
  CONSTRAINT generated_plan_days_estimated_duration_nonnegative CHECK (
    estimated_duration_minutes IS NULL OR estimated_duration_minutes >= 0
  ),
  CONSTRAINT generated_plan_days_unique_plan_date UNIQUE (
    plan_id,
    plan_date
  )
);

-- Exercise rows preserve generated day sequencing while resolving
-- equipment requirements through the existing exercise-to-equipment-type
-- relationship at read time.
CREATE TABLE generated_plan_exercises (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_day_id integer NOT NULL,
  exercise_id integer NOT NULL,
  sequence_number integer NOT NULL,
  sets integer,
  repetitions text,
  duration_minutes integer,
  rest_seconds integer,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT generated_plan_exercises_plan_day_fk FOREIGN KEY (plan_day_id)
    REFERENCES generated_plan_days (id)
    ON DELETE CASCADE,
  CONSTRAINT generated_plan_exercises_exercise_fk FOREIGN KEY (exercise_id)
    REFERENCES exercises (id)
    ON DELETE RESTRICT,
  CONSTRAINT generated_plan_exercises_sequence_number_positive CHECK (
    sequence_number > 0
  ),
  CONSTRAINT generated_plan_exercises_sets_nonnegative CHECK (
    sets IS NULL OR sets >= 0
  ),
  CONSTRAINT generated_plan_exercises_duration_nonnegative CHECK (
    duration_minutes IS NULL OR duration_minutes >= 0
  ),
  CONSTRAINT generated_plan_exercises_rest_nonnegative CHECK (
    rest_seconds IS NULL OR rest_seconds >= 0
  ),
  CONSTRAINT generated_plan_exercises_unique_sequence UNIQUE (
    plan_day_id,
    sequence_number
  )
);

-- Meal items preserve meal ordering within a generated plan day while
-- referencing reusable foods from the existing foods table.
CREATE TABLE generated_plan_meal_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_day_id integer NOT NULL,
  meal_type text NOT NULL,
  food_id integer NOT NULL,
  sequence_number integer NOT NULL,
  serving_description text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT generated_plan_meal_items_plan_day_fk FOREIGN KEY (plan_day_id)
    REFERENCES generated_plan_days (id)
    ON DELETE CASCADE,
  CONSTRAINT generated_plan_meal_items_food_fk FOREIGN KEY (food_id)
    REFERENCES foods (id)
    ON DELETE RESTRICT,
  CONSTRAINT generated_plan_meal_items_meal_type_valid CHECK (
    meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink')
  ),
  CONSTRAINT generated_plan_meal_items_sequence_number_positive CHECK (
    sequence_number > 0
  ),
  CONSTRAINT generated_plan_meal_items_unique_sequence UNIQUE (
    plan_day_id,
    meal_type,
    sequence_number
  )
);

CREATE INDEX idx_generated_plans_user_id
  ON generated_plans (user_id);

CREATE INDEX idx_generated_plans_ai_assessment_id
  ON generated_plans (ai_assessment_id);

CREATE INDEX idx_generated_plans_body_goal_id
  ON generated_plans (body_goal_id);

CREATE INDEX idx_generated_plans_workout_template_id
  ON generated_plans (workout_template_id);

CREATE INDEX idx_generated_plans_nutrition_template_id
  ON generated_plans (nutrition_template_id);

CREATE INDEX idx_generated_plans_status
  ON generated_plans (status);

CREATE INDEX idx_generated_plans_start_date
  ON generated_plans (start_date);

CREATE UNIQUE INDEX idx_generated_plans_one_active_per_user
  ON generated_plans (user_id)
  WHERE status = 'active';

CREATE INDEX idx_generated_plan_days_plan_id
  ON generated_plan_days (plan_id);

CREATE INDEX idx_generated_plan_days_plan_date
  ON generated_plan_days (plan_date);

CREATE INDEX idx_generated_plan_days_day_type
  ON generated_plan_days (day_type);

CREATE INDEX idx_generated_plan_exercises_plan_day_id
  ON generated_plan_exercises (plan_day_id);

CREATE INDEX idx_generated_plan_exercises_exercise_id
  ON generated_plan_exercises (exercise_id);

CREATE INDEX idx_generated_plan_meal_items_plan_day_id
  ON generated_plan_meal_items (plan_day_id);

CREATE INDEX idx_generated_plan_meal_items_food_id
  ON generated_plan_meal_items (food_id);

CREATE INDEX idx_generated_plan_meal_items_meal_type
  ON generated_plan_meal_items (meal_type);

CREATE TRIGGER set_generated_plans_updated_at
BEFORE UPDATE ON generated_plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMENT ON TABLE generated_plans IS
  'Historical generated one-month plan records for authenticated users. Multiple plans are preserved over time, with only one active plan allowed per user.';

COMMENT ON COLUMN generated_plans.user_id IS
  'References auth_users.id. Deleting the auth user deletes the owned generated plan history.';

COMMENT ON COLUMN generated_plans.ai_assessment_id IS
  'Optional reference to ai_assessments.id used when the generated plan was based on a saved AI assessment. If the assessment is deleted, the plan history remains and this reference is cleared.';

COMMENT ON COLUMN generated_plans.body_goal_id IS
  'References body_goals.id used for this generated plan. Deletion is restricted while plans still reference the goal.';

COMMENT ON COLUMN generated_plans.workout_template_id IS
  'References workout_templates.id used as the workout structure source for this generated plan. Deletion is restricted while plans still reference the template.';

COMMENT ON COLUMN generated_plans.nutrition_template_id IS
  'References nutrition_templates.id used as the nutrition structure source for this generated plan. Deletion is restricted while plans still reference the template.';

COMMENT ON COLUMN generated_plans.profile_snapshot IS
  'JSON object snapshot of the normalized client profile inputs used to generate this plan version.';

COMMENT ON TABLE generated_plan_days IS
  'Per-day generated plan records belonging to a generated_plans row. Each plan_date appears at most once within a plan.';

COMMENT ON COLUMN generated_plan_days.plan_id IS
  'References generated_plans.id. Deleting a generated plan deletes its generated day rows.';

COMMENT ON TABLE generated_plan_exercises IS
  'Ordered exercise rows for a generated plan day. Equipment names are not stored here and should be resolved through exercise_equipment_requirements.';

COMMENT ON COLUMN generated_plan_exercises.plan_day_id IS
  'References generated_plan_days.id. Deleting a generated plan day deletes its generated exercise rows.';

COMMENT ON COLUMN generated_plan_exercises.exercise_id IS
  'References exercises.id. Deletion is restricted while generated plans still reference the exercise.';

COMMENT ON TABLE generated_plan_meal_items IS
  'Ordered meal item rows for a generated plan day. Multiple food items are allowed within the same meal type for the same day.';

COMMENT ON COLUMN generated_plan_meal_items.plan_day_id IS
  'References generated_plan_days.id. Deleting a generated plan day deletes its generated meal item rows.';

COMMENT ON COLUMN generated_plan_meal_items.food_id IS
  'References foods.id. Deletion is restricted while generated plans still reference the food.';

COMMIT;
