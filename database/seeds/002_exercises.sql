BEGIN;

CREATE TEMP TABLE exercise_seed_temp (
  name text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  default_sets integer,
  default_reps_or_duration text NOT NULL,
  instructions text NOT NULL,
  status text NOT NULL,
  image_url text
) ON COMMIT DROP;

INSERT INTO exercise_seed_temp (
  name,
  category,
  difficulty,
  default_sets,
  default_reps_or_duration,
  instructions,
  status,
  image_url
)
VALUES
    -- Chest
    ('Push-Up', 'Chest', 'Beginner', 3, '10-15 reps', 'Keep your body straight and lower until your chest is near the floor.', 'Active', NULL),
    ('Dumbbell Bench Press', 'Chest', 'Intermediate', 4, '8-12 reps', 'Press the dumbbells up from chest level and lower with control.', 'Active', NULL),
    ('Incline Dumbbell Press', 'Chest', 'Intermediate', 4, '8-12 reps', 'Press the dumbbells up on an incline bench and lower slowly.', 'Active', NULL),
    ('Decline Dumbbell Press', 'Chest', 'Intermediate', 4, '8-12 reps', 'Press the dumbbells up from a decline bench and keep your wrists stacked.', 'Active', NULL),
    ('Dumbbell Fly', 'Chest', 'Intermediate', 3, '10-12 reps', 'Open your arms wide with a soft elbow bend and bring the dumbbells back together.', 'Active', NULL),
    ('Smith Machine Bench Press', 'Chest', 'Intermediate', 4, '8-10 reps', 'Lower the bar to mid chest and press straight up.', 'Active', NULL),
    ('Cable Chest Fly', 'Chest', 'Intermediate', 3, '12-15 reps', 'Bring the handles together in front of your chest and return with control.', 'Active', NULL),

    -- Back
    ('Superman', 'Back', 'Beginner', 3, '12-15 reps', 'Lift your arms and legs slightly off the floor and pause briefly.', 'Active', NULL),
    ('Bird Dog', 'Back', 'Beginner', 3, '10 reps per side', 'Reach opposite arm and leg long while keeping your hips steady.', 'Active', NULL),
    ('TRX Row', 'Back', 'Beginner', 3, '10-12 reps', 'Lean back with straight body alignment and pull your chest toward the handles.', 'Active', NULL),
    ('Dumbbell Bent-Over Row', 'Back', 'Intermediate', 4, '8-12 reps', 'Hinge at the hips and pull the dumbbells toward your lower ribs.', 'Active', NULL),
    ('One-Arm Dumbbell Row', 'Back', 'Intermediate', 3, '10 reps per side', 'Support one hand on a bench and row the dumbbell to your hip.', 'Active', NULL),
    ('EZ Bar Bent-Over Row', 'Back', 'Intermediate', 4, '8-12 reps', 'Hinge forward and pull the bar toward your upper waist.', 'Active', NULL),
    ('Lat Pulldown', 'Back', 'Beginner', 3, '10-12 reps', 'Pull the handle to your upper chest and keep your shoulders down.', 'Active', NULL),

    -- Shoulders
    ('Arm Circles', 'Shoulders', 'Beginner', 2, '30 seconds each direction', 'Make small controlled circles and keep your shoulders relaxed.', 'Active', NULL),
    ('Pike Push-Up', 'Shoulders', 'Intermediate', 3, '8-10 reps', 'Keep your hips high and lower the top of your head toward the floor.', 'Active', NULL),
    ('Shoulder Press Machine', 'Shoulders', 'Beginner', 3, '10-12 reps', 'Press the handles overhead and return to shoulder level with control.', 'Active', NULL),
    ('Dumbbell Shoulder Press', 'Shoulders', 'Intermediate', 4, '8-12 reps', 'Press the dumbbells overhead without arching your lower back.', 'Active', NULL),
    ('Dumbbell Lateral Raise', 'Shoulders', 'Beginner', 3, '12-15 reps', 'Raise the dumbbells to shoulder height with a soft elbow bend.', 'Active', NULL),
    ('Dumbbell Reverse Fly', 'Shoulders', 'Intermediate', 3, '12-15 reps', 'Hinge forward and open your arms out to the sides.', 'Active', NULL),

    -- Legs
    ('Bodyweight Squat', 'Legs', 'Beginner', 3, '12-15 reps', 'Sit your hips back and stand up while keeping your chest tall.', 'Active', NULL),
    ('Resistance Loop Lateral Walk', 'Legs', 'Beginner', 3, '12 steps each way', 'Keep tension on the loop and step side to side with control.', 'Active', NULL),
    ('Abductor Machine', 'Legs', 'Beginner', 3, '12-15 reps', 'Press the pads outward and return slowly to the start.', 'Active', NULL),
    ('Leg Press Machine', 'Legs', 'Beginner', 4, '10-12 reps', 'Drive the platform away through your heels and lower under control.', 'Active', NULL),
    ('Smith Machine Squat', 'Legs', 'Intermediate', 4, '8-10 reps', 'Sit down into the squat and press back up through your heels.', 'Active', NULL),
    ('Leg Extension Machine', 'Legs', 'Beginner', 3, '12-15 reps', 'Straighten your knees fully and lower the pad slowly.', 'Active', NULL),
    ('Dumbbell Romanian Deadlift', 'Legs', 'Intermediate', 4, '8-12 reps', 'Hinge at the hips and keep the dumbbells close to your legs.', 'Active', NULL),
    ('Kettlebell Goblet Squat', 'Legs', 'Beginner', 4, '10-12 reps', 'Hold the kettlebell at chest height and squat with an upright torso.', 'Active', NULL),
    ('Barbell Back Squat', 'Legs', 'Advanced', 4, '6-8 reps', 'Brace your core and squat to a comfortable depth before driving up.', 'Active', NULL),
    ('Dumbbell Walking Lunge', 'Legs', 'Intermediate', 3, '10 steps per leg', 'Step forward into each lunge and keep your torso tall.', 'Active', NULL),

    -- Core
    ('Forearm Plank', 'Core', 'Beginner', 3, '30-45 seconds', 'Keep your body in a straight line and brace your midsection.', 'Active', NULL),
    ('Dead Bug', 'Core', 'Beginner', 3, '10 reps per side', 'Lower opposite arm and leg while keeping your lower back down.', 'Active', NULL),
    ('Mountain Climber', 'Core', 'Beginner', 3, '30 seconds', 'Drive your knees forward one at a time with steady control.', 'Active', NULL),
    ('Russian Twist', 'Core', 'Beginner', 3, '16 total reps', 'Rotate side to side while keeping your chest lifted.', 'Active', NULL),
    ('Medicine Ball Russian Twist', 'Core', 'Intermediate', 3, '16 total reps', 'Hold the ball close and rotate your shoulders side to side.', 'Active', NULL),
    ('BOSU Crunch', 'Core', 'Intermediate', 3, '15 reps', 'Crunch up from the BOSU and lower slowly without pulling your neck.', 'Active', NULL),
    ('Cable Wood Chop', 'Core', 'Intermediate', 3, '12 reps per side', 'Rotate through your torso and pull the handle across your body.', 'Active', NULL),

    -- Cardio
    ('Treadmill Walking', 'Cardio', 'Beginner', 1, '15-20 minutes', 'Walk at a steady pace that lets you keep good posture.', 'Active', NULL),
    ('Treadmill Intervals', 'Cardio', 'Intermediate', 1, '12-15 minutes', 'Alternate one faster minute with one easy minute.', 'Active', NULL),
    ('Stationary Bike', 'Cardio', 'Beginner', 1, '15-20 minutes', 'Pedal at a comfortable pace and keep your shoulders relaxed.', 'Active', NULL),
    ('Cross Trainer Steady Pace', 'Cardio', 'Beginner', 1, '15-20 minutes', 'Move at an even rhythm and keep pressure through the handles.', 'Active', NULL),
    ('Jump Rope', 'Cardio', 'Beginner', 5, '1 minute rounds', 'Stay light on your feet and keep the rope turns smooth.', 'Active', NULL),
    ('Ladder Machine Climb', 'Cardio', 'Intermediate', 1, '10-15 minutes', 'Climb with steady steps and avoid leaning heavily on the rails.', 'Active', NULL),
    ('Agility Ladder Quick Steps', 'Cardio', 'Beginner', 4, '20 seconds', 'Move your feet quickly through the ladder while staying balanced.', 'Active', NULL),
    ('Agility Cone Shuffle', 'Cardio', 'Beginner', 4, '20 seconds', 'Shuffle between cones with short fast steps and low hips.', 'Active', NULL),

    -- Stretching
    ('Yoga Stretching', 'Stretching', 'Beginner', 1, '5-10 minutes', 'Move slowly through easy stretches and breathe evenly.', 'Active', NULL),
    ('Hamstring Stretch', 'Stretching', 'Beginner', 2, '30 seconds per side', 'Lengthen the back of the leg without rounding your back.', 'Active', NULL),
    ('Hip Flexor Stretch', 'Stretching', 'Beginner', 2, '30 seconds per side', 'Tuck your hips slightly and ease forward until you feel the front hip stretch.', 'Active', NULL),
    ('Child''s Pose', 'Stretching', 'Beginner', 2, '30-45 seconds', 'Sit back toward your heels and relax your arms forward.', 'Active', NULL),
    ('Foam Roller Upper Back', 'Stretching', 'Beginner', 2, '45 seconds', 'Roll slowly over the upper back and pause on tight areas.', 'Active', NULL),

    -- Full Body
    ('Burpee', 'Full Body', 'Intermediate', 3, '8-10 reps', 'Move from squat to plank and jump up in one smooth sequence.', 'Active', NULL),
    ('Kettlebell Deadlift', 'Full Body', 'Beginner', 4, '10-12 reps', 'Hinge at the hips and stand tall while keeping the kettlebell close.', 'Active', NULL),
    ('Kettlebell Swing', 'Full Body', 'Advanced', 4, '12-15 reps', 'Drive the swing with your hips and keep your back neutral.', 'Active', NULL),
    ('Dumbbell Thruster', 'Full Body', 'Intermediate', 3, '10-12 reps', 'Squat with the dumbbells then press them overhead as you stand.', 'Active', NULL),
    ('Slam Ball Slam', 'Full Body', 'Intermediate', 4, '10-12 reps', 'Lift the ball overhead and slam it down using your whole body.', 'Active', NULL),
    ('Battle Rope Waves', 'Full Body', 'Intermediate', 4, '20 seconds', 'Create even rope waves by driving your arms up and down.', 'Active', NULL),
    ('Step Board Toe Taps', 'Full Body', 'Beginner', 4, '20 seconds', 'Tap the board quickly with alternating feet while staying light.', 'Active', NULL),
    ('Plyo Box Step-Up', 'Full Body', 'Beginner', 3, '10 reps per leg', 'Step fully onto the box and stand tall before stepping down.', 'Active', NULL),
    ('Fixed Barbell Romanian Deadlift', 'Full Body', 'Intermediate', 4, '8-12 reps', 'Hinge from the hips and keep the bar close to your thighs.', 'Active', NULL),

    -- Boxing
    ('Shadow Boxing', 'Boxing', 'Beginner', 3, '1 minute rounds', 'Throw light punches in the air while staying on your toes.', 'Active', NULL),
    ('Boxing Bag Punches', 'Boxing', 'Beginner', 4, '30 seconds', 'Throw straight punches into the bag and reset your guard each time.', 'Active', NULL),
    ('Heavy Bag Intervals', 'Boxing', 'Intermediate', 5, '1 minute rounds', 'Work the bag hard for each round and keep your guard up.', 'Active', NULL),
    ('Boxing Pad Straight Punch Drill', 'Boxing', 'Intermediate', 4, '45 seconds', 'Throw crisp straight punches into the pad and return to guard.', 'Active', NULL),
    ('Kick Pad Knee Strikes', 'Boxing', 'Intermediate', 4, '10 reps per side', 'Drive the knee forward into the pad and reset your stance.', 'Active', NULL),
    ('Shield Guard Punch Drill', 'Boxing', 'Intermediate', 4, '45 seconds', 'Throw controlled power punches into the shield and keep your feet set.', 'Active', NULL),
    ('Boxing Footwork Steps', 'Boxing', 'Beginner', 4, '30 seconds', 'Step forward back and side to side while keeping your guard up.', 'Active', NULL);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exercises'
      AND column_name = 'image_url'
  ) THEN
    WITH updated_exercises AS (
      UPDATE exercises AS e
      SET
        category = es.category,
        difficulty = es.difficulty,
        default_sets = es.default_sets,
        default_reps_or_duration = es.default_reps_or_duration,
        instructions = es.instructions,
        status = es.status,
        image_url = es.image_url
      FROM exercise_seed_temp AS es
      WHERE e.name = es.name
      RETURNING e.name
    )
    INSERT INTO exercises (
      name,
      category,
      difficulty,
      default_sets,
      default_reps_or_duration,
      instructions,
      status,
      image_url
    )
    SELECT
      es.name,
      es.category,
      es.difficulty,
      es.default_sets,
      es.default_reps_or_duration,
      es.instructions,
      es.status,
      es.image_url
    FROM exercise_seed_temp AS es
    WHERE NOT EXISTS (
      SELECT 1
      FROM exercises AS e
      WHERE e.name = es.name
    );
  ELSE
    WITH updated_exercises AS (
      UPDATE exercises AS e
      SET
        category = es.category,
        difficulty = es.difficulty,
        default_sets = es.default_sets,
        default_reps_or_duration = es.default_reps_or_duration,
        instructions = es.instructions,
        status = es.status
      FROM exercise_seed_temp AS es
      WHERE e.name = es.name
      RETURNING e.name
    )
    INSERT INTO exercises (
      name,
      category,
      difficulty,
      default_sets,
      default_reps_or_duration,
      instructions,
      status
    )
    SELECT
      es.name,
      es.category,
      es.difficulty,
      es.default_sets,
      es.default_reps_or_duration,
      es.instructions,
      es.status
    FROM exercise_seed_temp AS es
    WHERE NOT EXISTS (
      SELECT 1
      FROM exercises AS e
      WHERE e.name = es.name
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'exercise_equipment_requirements'
  ) THEN
    EXECUTE $requirements$
      WITH mapping_seed (
        exercise_name,
        equipment_source_number
      ) AS (
        VALUES
          ('Dumbbell Bench Press', 16),
          ('Dumbbell Bench Press', 18),
          ('Dumbbell Bench Press', 20),
          ('Dumbbell Bench Press', 22),
          ('Dumbbell Bench Press', 24),
          ('Dumbbell Bench Press', 26),
          ('Dumbbell Bench Press', 27),
          ('Dumbbell Bench Press', 47),
          ('Incline Dumbbell Press', 16),
          ('Incline Dumbbell Press', 18),
          ('Incline Dumbbell Press', 20),
          ('Incline Dumbbell Press', 22),
          ('Incline Dumbbell Press', 24),
          ('Incline Dumbbell Press', 26),
          ('Incline Dumbbell Press', 27),
          ('Incline Dumbbell Press', 48),
          ('Decline Dumbbell Press', 16),
          ('Decline Dumbbell Press', 18),
          ('Decline Dumbbell Press', 20),
          ('Decline Dumbbell Press', 22),
          ('Decline Dumbbell Press', 24),
          ('Decline Dumbbell Press', 26),
          ('Decline Dumbbell Press', 27),
          ('Decline Dumbbell Press', 76),
          ('Dumbbell Fly', 14),
          ('Dumbbell Fly', 15),
          ('Dumbbell Fly', 16),
          ('Dumbbell Fly', 17),
          ('Dumbbell Fly', 18),
          ('Dumbbell Fly', 19),
          ('Dumbbell Fly', 20),
          ('Dumbbell Fly', 21),
          ('Dumbbell Fly', 22),
          ('Dumbbell Fly', 47),
          ('Smith Machine Bench Press', 4),
          ('Smith Machine Bench Press', 47),
          ('Cable Chest Fly', 3),
          ('TRX Row', 56),
          ('Dumbbell Bent-Over Row', 16),
          ('Dumbbell Bent-Over Row', 18),
          ('Dumbbell Bent-Over Row', 20),
          ('Dumbbell Bent-Over Row', 22),
          ('Dumbbell Bent-Over Row', 24),
          ('Dumbbell Bent-Over Row', 26),
          ('Dumbbell Bent-Over Row', 27),
          ('One-Arm Dumbbell Row', 16),
          ('One-Arm Dumbbell Row', 18),
          ('One-Arm Dumbbell Row', 20),
          ('One-Arm Dumbbell Row', 22),
          ('One-Arm Dumbbell Row', 24),
          ('One-Arm Dumbbell Row', 26),
          ('One-Arm Dumbbell Row', 27),
          ('One-Arm Dumbbell Row', 46),
          ('EZ Bar Bent-Over Row', 42),
          ('Lat Pulldown', 3),
          ('Shoulder Press Machine', 6),
          ('Dumbbell Shoulder Press', 14),
          ('Dumbbell Shoulder Press', 15),
          ('Dumbbell Shoulder Press', 16),
          ('Dumbbell Shoulder Press', 17),
          ('Dumbbell Shoulder Press', 18),
          ('Dumbbell Shoulder Press', 19),
          ('Dumbbell Shoulder Press', 20),
          ('Dumbbell Shoulder Press', 21),
          ('Dumbbell Shoulder Press', 22),
          ('Dumbbell Shoulder Press', 73),
          ('Dumbbell Lateral Raise', 13),
          ('Dumbbell Lateral Raise', 14),
          ('Dumbbell Lateral Raise', 15),
          ('Dumbbell Lateral Raise', 16),
          ('Dumbbell Lateral Raise', 17),
          ('Dumbbell Lateral Raise', 18),
          ('Dumbbell Reverse Fly', 13),
          ('Dumbbell Reverse Fly', 14),
          ('Dumbbell Reverse Fly', 15),
          ('Dumbbell Reverse Fly', 16),
          ('Dumbbell Reverse Fly', 17),
          ('Dumbbell Reverse Fly', 18),
          ('Resistance Loop Lateral Walk', 63),
          ('Abductor Machine', 86),
          ('Leg Press Machine', 5),
          ('Smith Machine Squat', 4),
          ('Leg Extension Machine', 7),
          ('Dumbbell Romanian Deadlift', 16),
          ('Dumbbell Romanian Deadlift', 18),
          ('Dumbbell Romanian Deadlift', 20),
          ('Dumbbell Romanian Deadlift', 22),
          ('Dumbbell Romanian Deadlift', 24),
          ('Dumbbell Romanian Deadlift', 26),
          ('Dumbbell Romanian Deadlift', 27),
          ('Kettlebell Goblet Squat', 65),
          ('Kettlebell Goblet Squat', 66),
          ('Kettlebell Goblet Squat', 67),
          ('Kettlebell Goblet Squat', 68),
          ('Kettlebell Goblet Squat', 69),
          ('Kettlebell Goblet Squat', 70),
          ('Kettlebell Goblet Squat', 71),
          ('Barbell Back Squat', 41),
          ('Barbell Back Squat', 28),
          ('Barbell Back Squat', 29),
          ('Barbell Back Squat', 30),
          ('Barbell Back Squat', 31),
          ('Barbell Back Squat', 32),
          ('Barbell Back Squat', 33),
          ('Barbell Back Squat', 85),
          ('Dumbbell Walking Lunge', 14),
          ('Dumbbell Walking Lunge', 15),
          ('Dumbbell Walking Lunge', 16),
          ('Dumbbell Walking Lunge', 17),
          ('Dumbbell Walking Lunge', 18),
          ('Dumbbell Walking Lunge', 19),
          ('Dumbbell Walking Lunge', 20),
          ('Dumbbell Walking Lunge', 21),
          ('Dumbbell Walking Lunge', 22),
          ('Medicine Ball Russian Twist', 34),
          ('Medicine Ball Russian Twist', 35),
          ('Medicine Ball Russian Twist', 36),
          ('Medicine Ball Russian Twist', 37),
          ('Medicine Ball Russian Twist', 38),
          ('Medicine Ball Russian Twist', 39),
          ('Medicine Ball Russian Twist', 40),
          ('BOSU Crunch', 50),
          ('Cable Wood Chop', 3),
          ('Treadmill Walking', 1),
          ('Treadmill Intervals', 1),
          ('Stationary Bike', 2),
          ('Cross Trainer Steady Pace', 61),
          ('Jump Rope', 81),
          ('Ladder Machine Climb', 60),
          ('Agility Ladder Quick Steps', 54),
          ('Agility Cone Shuffle', 55),
          ('Yoga Stretching', 58),
          ('Child''s Pose', 58),
          ('Foam Roller Upper Back', 62),
          ('Kettlebell Deadlift', 65),
          ('Kettlebell Deadlift', 66),
          ('Kettlebell Deadlift', 67),
          ('Kettlebell Deadlift', 68),
          ('Kettlebell Deadlift', 69),
          ('Kettlebell Deadlift', 70),
          ('Kettlebell Deadlift', 71),
          ('Kettlebell Swing', 65),
          ('Kettlebell Swing', 66),
          ('Kettlebell Swing', 67),
          ('Kettlebell Swing', 68),
          ('Kettlebell Swing', 69),
          ('Kettlebell Swing', 70),
          ('Kettlebell Swing', 71),
          ('Dumbbell Thruster', 14),
          ('Dumbbell Thruster', 15),
          ('Dumbbell Thruster', 16),
          ('Dumbbell Thruster', 17),
          ('Dumbbell Thruster', 18),
          ('Dumbbell Thruster', 19),
          ('Dumbbell Thruster', 20),
          ('Dumbbell Thruster', 21),
          ('Dumbbell Thruster', 22),
          ('Slam Ball Slam', 78),
          ('Slam Ball Slam', 79),
          ('Slam Ball Slam', 80),
          ('Battle Rope Waves', 44),
          ('Step Board Toe Taps', 74),
          ('Plyo Box Step-Up', 72),
          ('Fixed Barbell Romanian Deadlift', 84),
          ('Boxing Bag Punches', 57),
          ('Boxing Bag Punches', 75),
          ('Heavy Bag Intervals', 57),
          ('Heavy Bag Intervals', 75),
          ('Boxing Pad Straight Punch Drill', 57),
          ('Boxing Pad Straight Punch Drill', 89),
          ('Kick Pad Knee Strikes', 87),
          ('Shield Guard Punch Drill', 57),
          ('Shield Guard Punch Drill', 88)
      ),
      requirement_rows AS (
        SELECT DISTINCT
          e.id AS exercise_id,
          ge.equipment_type_id,
          true AS required,
          NULL::text AS notes
        FROM mapping_seed AS ms
        JOIN exercises AS e
          ON e.name = ms.exercise_name
        JOIN gym_equipment AS ge
          ON ge.source_number = ms.equipment_source_number
        WHERE ge.plan_selectable = true
          AND ge.availability = 'Available'
          AND ge.equipment_type_id IS NOT NULL
      )
      INSERT INTO exercise_equipment_requirements (
        exercise_id,
        equipment_type_id,
        required,
        notes
      )
      SELECT
        rr.exercise_id,
        rr.equipment_type_id,
        rr.required,
        rr.notes
      FROM requirement_rows AS rr
      WHERE NOT EXISTS (
        SELECT 1
        FROM exercise_equipment_requirements AS eer
        WHERE eer.exercise_id = rr.exercise_id
          AND eer.equipment_type_id = rr.equipment_type_id
      );
    $requirements$;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'exercise_equipment'
  ) THEN
    EXECUTE $legacy$
      WITH mapping_seed (
        exercise_name,
        equipment_source_number
      ) AS (
        VALUES
          ('Dumbbell Bench Press', 16),
          ('Dumbbell Bench Press', 18),
          ('Dumbbell Bench Press', 20),
          ('Dumbbell Bench Press', 22),
          ('Dumbbell Bench Press', 24),
          ('Dumbbell Bench Press', 26),
          ('Dumbbell Bench Press', 27),
          ('Dumbbell Bench Press', 47),
          ('Incline Dumbbell Press', 16),
          ('Incline Dumbbell Press', 18),
          ('Incline Dumbbell Press', 20),
          ('Incline Dumbbell Press', 22),
          ('Incline Dumbbell Press', 24),
          ('Incline Dumbbell Press', 26),
          ('Incline Dumbbell Press', 27),
          ('Incline Dumbbell Press', 48),
          ('Decline Dumbbell Press', 16),
          ('Decline Dumbbell Press', 18),
          ('Decline Dumbbell Press', 20),
          ('Decline Dumbbell Press', 22),
          ('Decline Dumbbell Press', 24),
          ('Decline Dumbbell Press', 26),
          ('Decline Dumbbell Press', 27),
          ('Decline Dumbbell Press', 76),
          ('Dumbbell Fly', 14),
          ('Dumbbell Fly', 15),
          ('Dumbbell Fly', 16),
          ('Dumbbell Fly', 17),
          ('Dumbbell Fly', 18),
          ('Dumbbell Fly', 19),
          ('Dumbbell Fly', 20),
          ('Dumbbell Fly', 21),
          ('Dumbbell Fly', 22),
          ('Dumbbell Fly', 47),
          ('Smith Machine Bench Press', 4),
          ('Smith Machine Bench Press', 47),
          ('Cable Chest Fly', 3),
          ('TRX Row', 56),
          ('Dumbbell Bent-Over Row', 16),
          ('Dumbbell Bent-Over Row', 18),
          ('Dumbbell Bent-Over Row', 20),
          ('Dumbbell Bent-Over Row', 22),
          ('Dumbbell Bent-Over Row', 24),
          ('Dumbbell Bent-Over Row', 26),
          ('Dumbbell Bent-Over Row', 27),
          ('One-Arm Dumbbell Row', 16),
          ('One-Arm Dumbbell Row', 18),
          ('One-Arm Dumbbell Row', 20),
          ('One-Arm Dumbbell Row', 22),
          ('One-Arm Dumbbell Row', 24),
          ('One-Arm Dumbbell Row', 26),
          ('One-Arm Dumbbell Row', 27),
          ('One-Arm Dumbbell Row', 46),
          ('EZ Bar Bent-Over Row', 42),
          ('Lat Pulldown', 3),
          ('Shoulder Press Machine', 6),
          ('Dumbbell Shoulder Press', 14),
          ('Dumbbell Shoulder Press', 15),
          ('Dumbbell Shoulder Press', 16),
          ('Dumbbell Shoulder Press', 17),
          ('Dumbbell Shoulder Press', 18),
          ('Dumbbell Shoulder Press', 19),
          ('Dumbbell Shoulder Press', 20),
          ('Dumbbell Shoulder Press', 21),
          ('Dumbbell Shoulder Press', 22),
          ('Dumbbell Shoulder Press', 73),
          ('Dumbbell Lateral Raise', 13),
          ('Dumbbell Lateral Raise', 14),
          ('Dumbbell Lateral Raise', 15),
          ('Dumbbell Lateral Raise', 16),
          ('Dumbbell Lateral Raise', 17),
          ('Dumbbell Lateral Raise', 18),
          ('Dumbbell Reverse Fly', 13),
          ('Dumbbell Reverse Fly', 14),
          ('Dumbbell Reverse Fly', 15),
          ('Dumbbell Reverse Fly', 16),
          ('Dumbbell Reverse Fly', 17),
          ('Dumbbell Reverse Fly', 18),
          ('Resistance Loop Lateral Walk', 63),
          ('Abductor Machine', 86),
          ('Leg Press Machine', 5),
          ('Smith Machine Squat', 4),
          ('Leg Extension Machine', 7),
          ('Dumbbell Romanian Deadlift', 16),
          ('Dumbbell Romanian Deadlift', 18),
          ('Dumbbell Romanian Deadlift', 20),
          ('Dumbbell Romanian Deadlift', 22),
          ('Dumbbell Romanian Deadlift', 24),
          ('Dumbbell Romanian Deadlift', 26),
          ('Dumbbell Romanian Deadlift', 27),
          ('Kettlebell Goblet Squat', 65),
          ('Kettlebell Goblet Squat', 66),
          ('Kettlebell Goblet Squat', 67),
          ('Kettlebell Goblet Squat', 68),
          ('Kettlebell Goblet Squat', 69),
          ('Kettlebell Goblet Squat', 70),
          ('Kettlebell Goblet Squat', 71),
          ('Barbell Back Squat', 41),
          ('Barbell Back Squat', 28),
          ('Barbell Back Squat', 29),
          ('Barbell Back Squat', 30),
          ('Barbell Back Squat', 31),
          ('Barbell Back Squat', 32),
          ('Barbell Back Squat', 33),
          ('Barbell Back Squat', 85),
          ('Dumbbell Walking Lunge', 14),
          ('Dumbbell Walking Lunge', 15),
          ('Dumbbell Walking Lunge', 16),
          ('Dumbbell Walking Lunge', 17),
          ('Dumbbell Walking Lunge', 18),
          ('Dumbbell Walking Lunge', 19),
          ('Dumbbell Walking Lunge', 20),
          ('Dumbbell Walking Lunge', 21),
          ('Dumbbell Walking Lunge', 22),
          ('Medicine Ball Russian Twist', 34),
          ('Medicine Ball Russian Twist', 35),
          ('Medicine Ball Russian Twist', 36),
          ('Medicine Ball Russian Twist', 37),
          ('Medicine Ball Russian Twist', 38),
          ('Medicine Ball Russian Twist', 39),
          ('Medicine Ball Russian Twist', 40),
          ('BOSU Crunch', 50),
          ('Cable Wood Chop', 3),
          ('Treadmill Walking', 1),
          ('Treadmill Intervals', 1),
          ('Stationary Bike', 2),
          ('Cross Trainer Steady Pace', 61),
          ('Jump Rope', 81),
          ('Ladder Machine Climb', 60),
          ('Agility Ladder Quick Steps', 54),
          ('Agility Cone Shuffle', 55),
          ('Yoga Stretching', 58),
          ('Child''s Pose', 58),
          ('Foam Roller Upper Back', 62),
          ('Kettlebell Deadlift', 65),
          ('Kettlebell Deadlift', 66),
          ('Kettlebell Deadlift', 67),
          ('Kettlebell Deadlift', 68),
          ('Kettlebell Deadlift', 69),
          ('Kettlebell Deadlift', 70),
          ('Kettlebell Deadlift', 71),
          ('Kettlebell Swing', 65),
          ('Kettlebell Swing', 66),
          ('Kettlebell Swing', 67),
          ('Kettlebell Swing', 68),
          ('Kettlebell Swing', 69),
          ('Kettlebell Swing', 70),
          ('Kettlebell Swing', 71),
          ('Dumbbell Thruster', 14),
          ('Dumbbell Thruster', 15),
          ('Dumbbell Thruster', 16),
          ('Dumbbell Thruster', 17),
          ('Dumbbell Thruster', 18),
          ('Dumbbell Thruster', 19),
          ('Dumbbell Thruster', 20),
          ('Dumbbell Thruster', 21),
          ('Dumbbell Thruster', 22),
          ('Slam Ball Slam', 78),
          ('Slam Ball Slam', 79),
          ('Slam Ball Slam', 80),
          ('Battle Rope Waves', 44),
          ('Step Board Toe Taps', 74),
          ('Plyo Box Step-Up', 72),
          ('Fixed Barbell Romanian Deadlift', 84),
          ('Boxing Bag Punches', 57),
          ('Boxing Bag Punches', 75),
          ('Heavy Bag Intervals', 57),
          ('Heavy Bag Intervals', 75),
          ('Boxing Pad Straight Punch Drill', 57),
          ('Boxing Pad Straight Punch Drill', 89),
          ('Kick Pad Knee Strikes', 87),
          ('Shield Guard Punch Drill', 57),
          ('Shield Guard Punch Drill', 88)
      )
      INSERT INTO exercise_equipment (
        exercise_id,
        equipment_id
      )
      SELECT
        e.id,
        ge.id
      FROM mapping_seed AS ms
      JOIN exercises AS e
        ON e.name = ms.exercise_name
      JOIN gym_equipment AS ge
        ON ge.source_number = ms.equipment_source_number
      WHERE ge.plan_selectable = true
        AND ge.availability = 'Available'
        AND NOT EXISTS (
          SELECT 1
          FROM exercise_equipment AS ee
          WHERE ee.exercise_id = e.id
            AND ee.equipment_id = ge.id
        );
    $legacy$;
  ELSE
    RAISE EXCEPTION
      'No supported exercise-equipment mapping table found. Expected exercise_equipment or exercise_equipment_requirements.';
  END IF;
END $$;

COMMIT;
