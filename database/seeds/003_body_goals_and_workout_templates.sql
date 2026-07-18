BEGIN;

CREATE TEMP TABLE body_goal_seed_temp (
  label text NOT NULL,
  description text NOT NULL,
  gender_display text NOT NULL,
  image_url text,
  status text NOT NULL
) ON COMMIT DROP;

INSERT INTO body_goal_seed_temp (
  label,
  description,
  gender_display,
  image_url,
  status
)
VALUES
  (
    'Weight Loss',
    'Reduce body weight with steady cardio-focused training and repeatable weekly structure.',
    'All',
    NULL,
    'Active'
  ),
  (
    'Lean and Toned',
    'Build a leaner and more defined shape through balanced training cardio and mobility.',
    'All',
    NULL,
    'Active'
  ),
  (
    'General Fitness',
    'Improve daily energy baseline strength and weekly exercise consistency.',
    'All',
    NULL,
    'Active'
  ),
  (
    'Athletic Body',
    'Develop a more performance-oriented physique with conditioning agility and core support.',
    'All',
    NULL,
    'Active'
  ),
  (
    'Muscle Gain',
    'Increase muscle mass with beginner-friendly split training and recovery spacing.',
    'All',
    NULL,
    'Active'
  ),
  (
    'Strength Focus',
    'Build foundational strength through compound movement categories and controlled recovery.',
    'All',
    NULL,
    'Active'
  );

WITH updated_body_goals AS (
  UPDATE body_goals AS bg
  SET
    description = seed.description,
    gender_display = seed.gender_display,
    image_url = seed.image_url,
    status = seed.status
  FROM body_goal_seed_temp AS seed
  WHERE bg.label = seed.label
  RETURNING bg.label
)
INSERT INTO body_goals (
  label,
  description,
  gender_display,
  image_url,
  status
)
SELECT
  seed.label,
  seed.description,
  seed.gender_display,
  seed.image_url,
  seed.status
FROM body_goal_seed_temp AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM body_goals AS bg
  WHERE bg.label = seed.label
);

CREATE TEMP TABLE workout_template_seed_temp (
  template_name text NOT NULL,
  body_goal_label text NOT NULL,
  days_per_week integer NOT NULL,
  difficulty text NOT NULL,
  notes text,
  status text NOT NULL
) ON COMMIT DROP;

INSERT INTO workout_template_seed_temp (
  template_name,
  body_goal_label,
  days_per_week,
  difficulty,
  notes,
  status
)
VALUES
  (
    'Beginner Weight Loss Weekly Foundation',
    'Weight Loss',
    6,
    'Beginner',
    'Cardio-forward weekly structure with repeatable full body sessions and low-friction recovery.',
    'Active'
  ),
  (
    'Beginner Lean and Toned Balance',
    'Lean and Toned',
    5,
    'Beginner',
    'Balanced split with strength conditioning and mobility support.',
    'Active'
  ),
  (
    'Beginner General Fitness Weekly Foundation',
    'General Fitness',
    4,
    'Beginner',
    'Simple weekly rhythm built around consistency and recovery.',
    'Active'
  ),
  (
    'Beginner Athletic Body Performance Base',
    'Athletic Body',
    6,
    'Beginner',
    'Performance-oriented week mixing conditioning lower body power and trunk work.',
    'Active'
  ),
  (
    'Beginner Muscle Gain Split',
    'Muscle Gain',
    5,
    'Beginner',
    'Beginner hypertrophy split with separate muscle-group emphasis and spaced recovery.',
    'Active'
  ),
  (
    'Beginner Strength Focus Compound Base',
    'Strength Focus',
    4,
    'Beginner',
    'Compound-pattern strength week with deliberate rest spacing.',
    'Active'
  );

WITH updated_workout_templates AS (
  UPDATE workout_templates AS wt
  SET
    body_goal_id = bg.id,
    days_per_week = seed.days_per_week,
    difficulty = seed.difficulty,
    notes = seed.notes,
    status = seed.status
  FROM workout_template_seed_temp AS seed
  JOIN body_goals AS bg
    ON bg.label = seed.body_goal_label
  WHERE wt.name = seed.template_name
  RETURNING wt.name
)
INSERT INTO workout_templates (
  name,
  body_goal_id,
  days_per_week,
  difficulty,
  notes,
  status
)
SELECT
  seed.template_name,
  bg.id,
  seed.days_per_week,
  seed.difficulty,
  seed.notes,
  seed.status
FROM workout_template_seed_temp AS seed
JOIN body_goals AS bg
  ON bg.label = seed.body_goal_label
WHERE NOT EXISTS (
  SELECT 1
  FROM workout_templates AS wt
  WHERE wt.name = seed.template_name
);

UPDATE body_goals AS bg
SET workout_template_id = wt.id
FROM workout_template_seed_temp AS seed
JOIN workout_templates AS wt
  ON wt.name = seed.template_name
WHERE bg.label = seed.body_goal_label
  AND bg.workout_template_id IS DISTINCT FROM wt.id;

CREATE TEMP TABLE workout_template_day_seed_temp (
  template_name text NOT NULL,
  day_number integer NOT NULL,
  day_type text NOT NULL,
  focus_category text NOT NULL,
  exercise_count integer NOT NULL
) ON COMMIT DROP;

INSERT INTO workout_template_day_seed_temp (
  template_name,
  day_number,
  day_type,
  focus_category,
  exercise_count
)
VALUES
  ('Beginner Weight Loss Weekly Foundation', 1, 'Workout', 'Full Body', 5),
  ('Beginner Weight Loss Weekly Foundation', 2, 'Cardio', 'Cardio', 4),
  ('Beginner Weight Loss Weekly Foundation', 3, 'Workout', 'Full Body', 5),
  ('Beginner Weight Loss Weekly Foundation', 4, 'Cardio', 'Cardio', 4),
  ('Beginner Weight Loss Weekly Foundation', 5, 'Workout', 'Legs', 5),
  ('Beginner Weight Loss Weekly Foundation', 6, 'Stretching', 'Stretching', 4),
  ('Beginner Weight Loss Weekly Foundation', 7, 'Rest', 'Rest', 0),
  ('Beginner Lean and Toned Balance', 1, 'Workout', 'Full Body', 5),
  ('Beginner Lean and Toned Balance', 2, 'Cardio', 'Cardio', 3),
  ('Beginner Lean and Toned Balance', 3, 'Workout', 'Legs', 5),
  ('Beginner Lean and Toned Balance', 4, 'Stretching', 'Stretching', 4),
  ('Beginner Lean and Toned Balance', 5, 'Workout', 'Shoulders', 4),
  ('Beginner Lean and Toned Balance', 6, 'Rest', 'Rest', 0),
  ('Beginner Lean and Toned Balance', 7, 'Rest', 'Rest', 0),
  ('Beginner General Fitness Weekly Foundation', 1, 'Workout', 'Full Body', 5),
  ('Beginner General Fitness Weekly Foundation', 2, 'Rest', 'Rest', 0),
  ('Beginner General Fitness Weekly Foundation', 3, 'Cardio', 'Cardio', 3),
  ('Beginner General Fitness Weekly Foundation', 4, 'Workout', 'Full Body', 5),
  ('Beginner General Fitness Weekly Foundation', 5, 'Rest', 'Rest', 0),
  ('Beginner General Fitness Weekly Foundation', 6, 'Stretching', 'Stretching', 4),
  ('Beginner General Fitness Weekly Foundation', 7, 'Workout', 'Core', 4),
  ('Beginner Athletic Body Performance Base', 1, 'Workout', 'Full Body', 5),
  ('Beginner Athletic Body Performance Base', 2, 'Cardio', 'Cardio', 4),
  ('Beginner Athletic Body Performance Base', 3, 'Workout', 'Legs', 5),
  ('Beginner Athletic Body Performance Base', 4, 'Rest', 'Rest', 0),
  ('Beginner Athletic Body Performance Base', 5, 'Workout', 'Full Body', 5),
  ('Beginner Athletic Body Performance Base', 6, 'Workout', 'Core', 4),
  ('Beginner Athletic Body Performance Base', 7, 'Stretching', 'Stretching', 4),
  ('Beginner Muscle Gain Split', 1, 'Workout', 'Chest', 5),
  ('Beginner Muscle Gain Split', 2, 'Workout', 'Legs', 5),
  ('Beginner Muscle Gain Split', 3, 'Rest', 'Rest', 0),
  ('Beginner Muscle Gain Split', 4, 'Workout', 'Back', 5),
  ('Beginner Muscle Gain Split', 5, 'Workout', 'Shoulders', 4),
  ('Beginner Muscle Gain Split', 6, 'Workout', 'Core', 4),
  ('Beginner Muscle Gain Split', 7, 'Rest', 'Rest', 0),
  ('Beginner Strength Focus Compound Base', 1, 'Workout', 'Legs', 5),
  ('Beginner Strength Focus Compound Base', 2, 'Rest', 'Rest', 0),
  ('Beginner Strength Focus Compound Base', 3, 'Workout', 'Chest', 5),
  ('Beginner Strength Focus Compound Base', 4, 'Rest', 'Rest', 0),
  ('Beginner Strength Focus Compound Base', 5, 'Workout', 'Back', 5),
  ('Beginner Strength Focus Compound Base', 6, 'Workout', 'Shoulders', 4),
  ('Beginner Strength Focus Compound Base', 7, 'Rest', 'Rest', 0);

WITH updated_template_days AS (
  UPDATE workout_template_days AS wtd
  SET
    day_type = seed.day_type,
    focus_category = seed.focus_category,
    exercise_count = seed.exercise_count
  FROM workout_template_day_seed_temp AS seed
  JOIN workout_templates AS wt
    ON wt.name = seed.template_name
  WHERE wtd.workout_template_id = wt.id
    AND wtd.day_number = seed.day_number
  RETURNING wtd.workout_template_id, wtd.day_number
)
INSERT INTO workout_template_days (
  workout_template_id,
  day_number,
  day_type,
  focus_category,
  exercise_count
)
SELECT
  wt.id,
  seed.day_number,
  seed.day_type,
  seed.focus_category,
  seed.exercise_count
FROM workout_template_day_seed_temp AS seed
JOIN workout_templates AS wt
  ON wt.name = seed.template_name
WHERE NOT EXISTS (
  SELECT 1
  FROM workout_template_days AS wtd
  WHERE wtd.workout_template_id = wt.id
    AND wtd.day_number = seed.day_number
);

COMMIT;
