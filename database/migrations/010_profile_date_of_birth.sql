ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_profiles_date_of_birth_not_future'
  ) THEN
    ALTER TABLE client_profiles
      ADD CONSTRAINT client_profiles_date_of_birth_not_future
      CHECK (date_of_birth IS NULL OR date_of_birth <= CURRENT_DATE);
  END IF;
END
$$;

COMMENT ON COLUMN client_profiles.date_of_birth IS
  'Calendar-date birth date for deriving current age without storing a timestamp. Must not be in the future.';
