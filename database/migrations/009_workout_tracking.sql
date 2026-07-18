BEGIN;

-- Generated plan records remain immutable historical outputs. Workout
-- completion state is stored separately so users can track progress
-- without changing the originally generated plan structure.
CREATE TABLE workout_sessions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  plan_id integer NOT NULL,
  plan_day_id integer NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  difficulty_rating integer,
  pain_reported boolean NOT NULL DEFAULT false,
  feedback_note text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workout_sessions_user_fk FOREIGN KEY (user_id)
    REFERENCES auth_users (id)
    ON DELETE CASCADE,
  CONSTRAINT workout_sessions_plan_fk FOREIGN KEY (plan_id)
    REFERENCES generated_plans (id)
    ON DELETE CASCADE,
  CONSTRAINT workout_sessions_plan_day_fk FOREIGN KEY (plan_day_id)
    REFERENCES generated_plan_days (id)
    ON DELETE CASCADE,
  CONSTRAINT workout_sessions_user_plan_day_unique UNIQUE (
    user_id,
    plan_day_id
  ),
  CONSTRAINT workout_sessions_status_valid CHECK (
    status IN ('in_progress', 'completed', 'skipped')
  ),
  CONSTRAINT workout_sessions_difficulty_rating_valid CHECK (
    difficulty_rating IS NULL OR difficulty_rating BETWEEN 1 AND 5
  ),
  CONSTRAINT workout_sessions_feedback_note_not_blank CHECK (
    feedback_note IS NULL OR btrim(feedback_note) <> ''
  ),
  CONSTRAINT workout_sessions_completed_at_requires_completed_status CHECK (
    completed_at IS NULL OR status = 'completed'
  ),
  CONSTRAINT workout_sessions_completed_status_supports_completed_at CHECK (
    status <> 'completed' OR completed_at IS NULL OR completed_at >= COALESCE(started_at, completed_at)
  ),
  CONSTRAINT workout_sessions_started_before_completed CHECK (
    started_at IS NULL OR completed_at IS NULL OR completed_at >= started_at
  )
);

-- Exercise logs are also stored separately from generated plan exercise
-- rows so completion details do not mutate the original generated plan.
CREATE TABLE workout_exercise_logs (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workout_session_id integer NOT NULL,
  generated_plan_exercise_id integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_sets integer,
  actual_repetitions text,
  note text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT workout_exercise_logs_session_fk FOREIGN KEY (workout_session_id)
    REFERENCES workout_sessions (id)
    ON DELETE CASCADE,
  CONSTRAINT workout_exercise_logs_generated_plan_exercise_fk FOREIGN KEY (generated_plan_exercise_id)
    REFERENCES generated_plan_exercises (id)
    ON DELETE RESTRICT,
  CONSTRAINT workout_exercise_logs_session_exercise_unique UNIQUE (
    workout_session_id,
    generated_plan_exercise_id
  ),
  CONSTRAINT workout_exercise_logs_completed_sets_nonnegative CHECK (
    completed_sets IS NULL OR completed_sets >= 0
  ),
  CONSTRAINT workout_exercise_logs_actual_repetitions_not_blank CHECK (
    actual_repetitions IS NULL OR btrim(actual_repetitions) <> ''
  ),
  CONSTRAINT workout_exercise_logs_note_not_blank CHECK (
    note IS NULL OR btrim(note) <> ''
  ),
  CONSTRAINT workout_exercise_logs_completed_at_requires_completion CHECK (
    completed_at IS NULL OR completed = true
  )
);

CREATE INDEX idx_workout_sessions_user_id
  ON workout_sessions (user_id);

CREATE INDEX idx_workout_sessions_plan_id
  ON workout_sessions (plan_id);

CREATE INDEX idx_workout_sessions_plan_day_id
  ON workout_sessions (plan_day_id);

CREATE INDEX idx_workout_sessions_status
  ON workout_sessions (status);

CREATE INDEX idx_workout_sessions_user_status
  ON workout_sessions (user_id, status);

CREATE INDEX idx_workout_sessions_completed_at
  ON workout_sessions (completed_at);

CREATE INDEX idx_workout_exercise_logs_workout_session_id
  ON workout_exercise_logs (workout_session_id);

CREATE INDEX idx_workout_exercise_logs_generated_plan_exercise_id
  ON workout_exercise_logs (generated_plan_exercise_id);

CREATE INDEX idx_workout_exercise_logs_completed
  ON workout_exercise_logs (completed);

CREATE INDEX idx_workout_exercise_logs_completed_at
  ON workout_exercise_logs (completed_at);

CREATE TRIGGER set_workout_sessions_updated_at
BEFORE UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER set_workout_exercise_logs_updated_at
BEFORE UPDATE ON workout_exercise_logs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

COMMENT ON TABLE workout_sessions IS
  'Workout completion sessions for generated plan days. Generated plans remain unchanged while user progress, feedback, and completion state are stored separately.';

COMMENT ON COLUMN workout_sessions.user_id IS
  'References auth_users.id. Deleting the auth user deletes the owned workout session history.';

COMMENT ON COLUMN workout_sessions.plan_id IS
  'References generated_plans.id. Deleting a generated plan deletes its workout sessions, while the plan data itself remains immutable until deletion.';

COMMENT ON COLUMN workout_sessions.plan_day_id IS
  'References generated_plan_days.id. At most one session is allowed per user and generated plan day.';

COMMENT ON COLUMN workout_sessions.status IS
  'Lifecycle state for the tracked workout session: in_progress, completed, or skipped.';

COMMENT ON TABLE workout_exercise_logs IS
  'Per-exercise workout completion details linked to a workout session. These logs preserve original generated plan exercises and store actual completion separately.';

COMMENT ON COLUMN workout_exercise_logs.workout_session_id IS
  'References workout_sessions.id. Deleting a workout session deletes its exercise completion logs.';

COMMENT ON COLUMN workout_exercise_logs.generated_plan_exercise_id IS
  'References generated_plan_exercises.id with delete restriction so generated plan exercise history cannot be removed while tracking data still references it.';

COMMIT;


