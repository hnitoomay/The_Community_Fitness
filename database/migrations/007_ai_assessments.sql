BEGIN;

-- Assessment history is append-only per user. Multiple snapshots are kept
-- so generated analysis can be reviewed over time.
CREATE TABLE ai_assessments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id text NOT NULL,
  body_goal_id integer,
  profile_snapshot jsonb NOT NULL,
  input_hash text NOT NULL,
  assessment jsonb NOT NULL,
  language text NOT NULL DEFAULT 'my',
  model_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_assessments_user_fk FOREIGN KEY (user_id)
    REFERENCES auth_users (id)
    ON DELETE CASCADE,
  CONSTRAINT ai_assessments_body_goal_fk FOREIGN KEY (body_goal_id)
    REFERENCES body_goals (id)
    ON DELETE SET NULL,
  CONSTRAINT ai_assessments_profile_snapshot_object CHECK (
    jsonb_typeof(profile_snapshot) = 'object'
  ),
  CONSTRAINT ai_assessments_assessment_object CHECK (
    jsonb_typeof(assessment) = 'object'
  ),
  CONSTRAINT ai_assessments_input_hash_not_blank CHECK (
    btrim(input_hash) <> ''
  ),
  CONSTRAINT ai_assessments_language_not_blank CHECK (
    btrim(language) <> ''
  ),
  CONSTRAINT ai_assessments_model_name_not_blank CHECK (
    btrim(model_name) <> ''
  )
);

CREATE INDEX idx_ai_assessments_user_id
  ON ai_assessments (user_id);

CREATE INDEX idx_ai_assessments_created_at
  ON ai_assessments (created_at DESC);

CREATE INDEX idx_ai_assessments_input_hash
  ON ai_assessments (input_hash);

COMMENT ON TABLE ai_assessments IS
  'Historical AI assessment records for authenticated users, preserving profile snapshots, input hashes, and generated assessment payloads.';

COMMENT ON COLUMN ai_assessments.user_id IS
  'References auth_users.id. Deleting the auth user deletes the owned assessment history.';

COMMENT ON COLUMN ai_assessments.body_goal_id IS
  'Optional reference to body_goals.id captured for the assessment context. If the goal is deleted, the historical assessment remains and the reference is cleared.';

COMMENT ON COLUMN ai_assessments.profile_snapshot IS
  'JSON object snapshot of the user profile and related inputs used to generate the assessment.';

COMMENT ON COLUMN ai_assessments.assessment IS
  'JSON object payload storing the generated assessment result.';

COMMIT;
