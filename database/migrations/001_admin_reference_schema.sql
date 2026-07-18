BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE gym_equipment (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_number integer,
  name text NOT NULL,
  category text NOT NULL,
  quantity integer NOT NULL,
  unit text NOT NULL,
  plan_selectable boolean NOT NULL DEFAULT true,
  availability text NOT NULL DEFAULT 'Available',
  notes text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT gym_equipment_quantity_nonnegative CHECK (quantity >= 0),
  CONSTRAINT gym_equipment_category_valid CHECK (
    category IN (
      'Cardio Machine',
      'Strength Machine',
      'Free Weight',
      'Bench',
      'Functional Training',
      'Boxing',
      'Stretching and Recovery',
      'Supporting Accessory',
      'Storage',
      'Measurement'
    )
  ),
  CONSTRAINT gym_equipment_unit_valid CHECK (
    unit IN ('Unit', 'Set', 'Piece')
  ),
  CONSTRAINT gym_equipment_availability_valid CHECK (
    availability IN ('Available', 'Unavailable')
  )
);

CREATE TABLE exercises (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  default_sets integer,
  default_reps_or_duration text NOT NULL,
  instructions text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exercises_category_valid CHECK (
    category IN (
      'Chest',
      'Back',
      'Shoulders',
      'Legs',
      'Core',
      'Cardio',
      'Stretching',
      'Full Body',
      'Boxing'
    )
  ),
  CONSTRAINT exercises_difficulty_valid CHECK (
    difficulty IN ('Beginner', 'Intermediate', 'Advanced')
  ),
  CONSTRAINT exercises_default_sets_nonnegative CHECK (
    default_sets IS NULL OR default_sets >= 0
  ),
  CONSTRAINT exercises_status_valid CHECK (
    status IN ('Active', 'Inactive')
  )
);

CREATE TABLE body_goals (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  gender_display text NOT NULL,
  image_url text,
  workout_template_id integer,
  nutrition_template_id integer,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT body_goals_gender_display_valid CHECK (
    gender_display IN ('Male', 'Female', 'All')
  ),
  CONSTRAINT body_goals_status_valid CHECK (
    status IN ('Active', 'Inactive')
  )
);

CREATE TABLE workout_templates (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  body_goal_id integer NOT NULL,
  days_per_week integer NOT NULL,
  difficulty text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workout_templates_days_per_week_valid CHECK (
    days_per_week IN (3, 4, 5, 6)
  ),
  CONSTRAINT workout_templates_difficulty_valid CHECK (
    difficulty IN ('Beginner', 'Intermediate', 'Advanced')
  ),
  CONSTRAINT workout_templates_status_valid CHECK (
    status IN ('Active', 'Inactive')
  ),
  CONSTRAINT workout_templates_body_goal_fk FOREIGN KEY (body_goal_id)
    REFERENCES body_goals (id)
    ON DELETE RESTRICT
);

CREATE TABLE workout_template_days (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workout_template_id integer NOT NULL,
  day_number integer NOT NULL,
  day_type text NOT NULL,
  focus_category text NOT NULL,
  exercise_count integer NOT NULL,
  CONSTRAINT workout_template_days_template_fk FOREIGN KEY (workout_template_id)
    REFERENCES workout_templates (id)
    ON DELETE CASCADE,
  CONSTRAINT workout_template_days_day_number_valid CHECK (
    day_number BETWEEN 1 AND 7
  ),
  CONSTRAINT workout_template_days_day_type_valid CHECK (
    day_type IN ('Workout', 'Cardio', 'Stretching', 'Rest')
  ),
  CONSTRAINT workout_template_days_focus_category_valid CHECK (
    focus_category IN (
      'Chest',
      'Back',
      'Shoulders',
      'Legs',
      'Core',
      'Full Body',
      'Cardio',
      'Stretching',
      'Rest'
    )
  ),
  CONSTRAINT workout_template_days_exercise_count_nonnegative CHECK (
    exercise_count >= 0
  ),
  CONSTRAINT workout_template_days_unique_day UNIQUE (
    workout_template_id,
    day_number
  )
);

CREATE TABLE foods (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  meal_category text NOT NULL,
  serving_description text NOT NULL,
  calories integer NOT NULL,
  protein_grams numeric(6,2),
  allergen text,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT foods_meal_category_valid CHECK (
    meal_category IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink')
  ),
  CONSTRAINT foods_calories_nonnegative CHECK (
    calories >= 0
  ),
  CONSTRAINT foods_protein_grams_nonnegative CHECK (
    protein_grams IS NULL OR protein_grams >= 0
  ),
  CONSTRAINT foods_status_valid CHECK (
    status IN ('Active', 'Inactive')
  )
);

CREATE TABLE nutrition_templates (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  body_goal_id integer NOT NULL,
  meals_per_day integer NOT NULL,
  minimum_calories integer NOT NULL,
  maximum_calories integer NOT NULL,
  meal_structure text[] NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT nutrition_templates_body_goal_fk FOREIGN KEY (body_goal_id)
    REFERENCES body_goals (id)
    ON DELETE RESTRICT,
  CONSTRAINT nutrition_templates_meals_per_day_valid CHECK (
    meals_per_day IN (3, 4, 5)
  ),
  CONSTRAINT nutrition_templates_minimum_calories_nonnegative CHECK (
    minimum_calories >= 0
  ),
  CONSTRAINT nutrition_templates_maximum_calories_nonnegative CHECK (
    maximum_calories >= 0
  ),
  CONSTRAINT nutrition_templates_calorie_range_valid CHECK (
    maximum_calories >= minimum_calories
  ),
  CONSTRAINT nutrition_templates_meal_structure_valid CHECK (
    meal_structure <@ ARRAY[
      'Breakfast',
      'Lunch',
      'Dinner',
      'Snack',
      'Drink'
    ]::text[]
    AND cardinality(meal_structure) >= 1
  ),
  CONSTRAINT nutrition_templates_status_valid CHECK (
    status IN ('Active', 'Inactive')
  )
);

ALTER TABLE body_goals
ADD CONSTRAINT body_goals_workout_template_fk
  FOREIGN KEY (workout_template_id)
  REFERENCES workout_templates (id)
  ON DELETE SET NULL;

ALTER TABLE body_goals
ADD CONSTRAINT body_goals_nutrition_template_fk
  FOREIGN KEY (nutrition_template_id)
  REFERENCES nutrition_templates (id)
  ON DELETE SET NULL;

CREATE TABLE exercise_equipment (
  exercise_id integer NOT NULL,
  equipment_id integer NOT NULL,
  PRIMARY KEY (exercise_id, equipment_id),
  CONSTRAINT exercise_equipment_exercise_fk FOREIGN KEY (exercise_id)
    REFERENCES exercises (id)
    ON DELETE CASCADE,
  CONSTRAINT exercise_equipment_equipment_fk FOREIGN KEY (equipment_id)
    REFERENCES gym_equipment (id)
    ON DELETE RESTRICT
);

CREATE INDEX idx_gym_equipment_name ON gym_equipment (name);
CREATE INDEX idx_gym_equipment_category ON gym_equipment (category);
CREATE INDEX idx_gym_equipment_availability ON gym_equipment (availability);
CREATE INDEX idx_gym_equipment_plan_selectable ON gym_equipment (plan_selectable);

CREATE INDEX idx_exercises_name ON exercises (name);
CREATE INDEX idx_exercises_category ON exercises (category);
CREATE INDEX idx_exercises_difficulty ON exercises (difficulty);
CREATE INDEX idx_exercises_status ON exercises (status);

CREATE INDEX idx_exercise_equipment_equipment_id ON exercise_equipment (equipment_id);

CREATE INDEX idx_body_goals_label ON body_goals (label);
CREATE INDEX idx_body_goals_status ON body_goals (status);
CREATE INDEX idx_body_goals_workout_template_id ON body_goals (workout_template_id);
CREATE INDEX idx_body_goals_nutrition_template_id ON body_goals (nutrition_template_id);

CREATE INDEX idx_workout_templates_body_goal_id ON workout_templates (body_goal_id);
CREATE INDEX idx_workout_templates_status ON workout_templates (status);
CREATE INDEX idx_workout_template_days_template_id ON workout_template_days (workout_template_id);

CREATE INDEX idx_foods_name ON foods (name);
CREATE INDEX idx_foods_meal_category ON foods (meal_category);
CREATE INDEX idx_foods_status ON foods (status);

CREATE INDEX idx_nutrition_templates_body_goal_id ON nutrition_templates (body_goal_id);
CREATE INDEX idx_nutrition_templates_status ON nutrition_templates (status);

CREATE TRIGGER set_gym_equipment_updated_at
BEFORE UPDATE ON gym_equipment
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_exercises_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_body_goals_updated_at
BEFORE UPDATE ON body_goals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_workout_templates_updated_at
BEFORE UPDATE ON workout_templates
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_foods_updated_at
BEFORE UPDATE ON foods
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_nutrition_templates_updated_at
BEFORE UPDATE ON nutrition_templates
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
