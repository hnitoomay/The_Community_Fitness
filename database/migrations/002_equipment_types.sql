BEGIN;

CREATE TABLE equipment_types (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  plan_selectable boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT equipment_types_key_unique UNIQUE (key),
  CONSTRAINT equipment_types_name_unique UNIQUE (name),
  CONSTRAINT equipment_types_category_valid CHECK (
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
  )
);

ALTER TABLE gym_equipment
ADD COLUMN equipment_type_id integer;

ALTER TABLE gym_equipment
ADD CONSTRAINT gym_equipment_equipment_type_fk
  FOREIGN KEY (equipment_type_id)
  REFERENCES equipment_types (id)
  ON DELETE RESTRICT;

INSERT INTO equipment_types (
  key,
  name,
  category,
  plan_selectable
)
VALUES
  ('treadmill', 'Treadmill', 'Cardio Machine', true),
  ('bike', 'Bike', 'Cardio Machine', true),
  ('cross_trainer', 'Cross Trainer', 'Cardio Machine', true),
  ('ladder_machine', 'Ladder Machine', 'Cardio Machine', true),
  ('smith_machine', 'Smith Machine', 'Strength Machine', true),
  ('leg_press', 'Leg Press', 'Strength Machine', true),
  ('shoulder_press_machine', 'Shoulder Press Machine', 'Strength Machine', true),
  ('leg_extension', 'Leg Extension', 'Strength Machine', true),
  ('abductor_machine', 'Abductor Machine', 'Strength Machine', true),
  ('cable_machine', 'Cable Machine', 'Strength Machine', true),
  ('power_rack', 'Power Rack', 'Strength Machine', true),
  ('squat_machine', 'Squat Machine', 'Strength Machine', true),
  ('dumbbell', 'Dumbbell', 'Free Weight', true),
  ('barbell', 'Barbell', 'Free Weight', true),
  ('olympic_bar', 'Olympic Bar', 'Free Weight', true),
  ('ez_bar', 'EZ Bar', 'Free Weight', true),
  ('weight_plate', 'Weight Plate', 'Free Weight', true),
  ('kettlebell', 'Kettlebell', 'Free Weight', true),
  ('medicine_ball', 'Medicine Ball', 'Functional Training', true),
  ('slam_ball', 'Slam Ball', 'Functional Training', true),
  ('flat_bench', 'Flat Bench', 'Bench', true),
  ('incline_bench', 'Incline Bench', 'Bench', true),
  ('decline_bench', 'Decline Bench', 'Bench', true),
  ('adjustable_bench', 'Adjustable Bench', 'Bench', true),
  ('utility_bench', 'Utility Bench', 'Bench', true),
  ('hyper_extension_bench', 'Hyper Extension Bench', 'Bench', true),
  ('trx', 'TRX', 'Functional Training', true),
  ('resistance_loop', 'Resistance Loop', 'Functional Training', true),
  ('yoga_mat', 'Yoga Mat', 'Stretching and Recovery', true),
  ('bosu', 'BOSU', 'Functional Training', true),
  ('foam_roller', 'Foam Roller', 'Stretching and Recovery', true),
  ('plyo_box', 'Plyo Box', 'Functional Training', true),
  ('step_board', 'Step Board', 'Functional Training', true),
  ('agility_ladder', 'Agility Ladder', 'Functional Training', true),
  ('agility_cone', 'Agility Cone', 'Functional Training', true),
  ('jump_rope', 'Jump Rope', 'Functional Training', true),
  ('functional_rope', 'Functional Rope', 'Functional Training', true),
  ('sand_belt', 'Sand Belt', 'Functional Training', true),
  ('punching_bag', 'Punching Bag', 'Boxing', true),
  ('boxing_gloves', 'Boxing Gloves', 'Boxing', true),
  ('boxing_pad', 'Boxing Pad', 'Boxing', true),
  ('dumbbell_rack', 'Dumbbell Rack', 'Storage', false),
  ('barbell_rack', 'Barbell Rack', 'Storage', false),
  ('exercise_ball_rack', 'Exercise Ball Rack', 'Storage', false),
  ('cable_accessory_bundle', 'Cable Accessory Bundle', 'Supporting Accessory', false),
  ('barbell_clip', 'Barbell Clip', 'Supporting Accessory', false),
  ('combat_accessories', 'Combat Accessories', 'Supporting Accessory', false),
  ('weight_lifting_belt', 'Weight Lifting Belt', 'Supporting Accessory', false),
  ('body_fat_scale', 'Body Fat Scale', 'Measurement', false),
  ('barbell_pad', 'Barbell Pad', 'Supporting Accessory', false);

WITH equipment_type_mapping (
  source_number,
  equipment_type_key
) AS (
  VALUES
    (1, 'treadmill'),
    (2, 'bike'),
    (3, 'cable_machine'),
    (4, 'smith_machine'),
    (5, 'leg_press'),
    (6, 'shoulder_press_machine'),
    (7, 'leg_extension'),
    (8, 'flat_bench'),
    (9, 'incline_bench'),
    (10, 'dumbbell_rack'),
    (11, 'barbell_rack'),
    (12, 'exercise_ball_rack'),
    (13, 'dumbbell'),
    (14, 'dumbbell'),
    (15, 'dumbbell'),
    (16, 'dumbbell'),
    (17, 'dumbbell'),
    (18, 'dumbbell'),
    (19, 'dumbbell'),
    (20, 'dumbbell'),
    (21, 'dumbbell'),
    (22, 'dumbbell'),
    (23, 'dumbbell'),
    (24, 'dumbbell'),
    (25, 'dumbbell'),
    (26, 'dumbbell'),
    (27, 'dumbbell'),
    (28, 'weight_plate'),
    (29, 'weight_plate'),
    (30, 'weight_plate'),
    (31, 'weight_plate'),
    (32, 'weight_plate'),
    (33, 'weight_plate'),
    (34, 'medicine_ball'),
    (35, 'medicine_ball'),
    (36, 'medicine_ball'),
    (37, 'medicine_ball'),
    (38, 'medicine_ball'),
    (39, 'medicine_ball'),
    (40, 'medicine_ball'),
    (41, 'olympic_bar'),
    (42, 'ez_bar'),
    (43, 'dumbbell'),
    (44, 'functional_rope'),
    (45, 'sand_belt'),
    (46, 'utility_bench'),
    (47, 'flat_bench'),
    (48, 'incline_bench'),
    (49, 'hyper_extension_bench'),
    (50, 'bosu'),
    (51, 'cable_accessory_bundle'),
    (52, 'barbell_clip'),
    (53, 'combat_accessories'),
    (54, 'agility_ladder'),
    (55, 'agility_cone'),
    (56, 'trx'),
    (57, 'boxing_gloves'),
    (58, 'yoga_mat'),
    (59, 'weight_lifting_belt'),
    (60, 'ladder_machine'),
    (61, 'cross_trainer'),
    (62, 'foam_roller'),
    (63, 'resistance_loop'),
    (64, 'trx'),
    (65, 'kettlebell'),
    (66, 'kettlebell'),
    (67, 'kettlebell'),
    (68, 'kettlebell'),
    (69, 'kettlebell'),
    (70, 'kettlebell'),
    (71, 'kettlebell'),
    (72, 'plyo_box'),
    (73, 'adjustable_bench'),
    (74, 'step_board'),
    (75, 'punching_bag'),
    (76, 'decline_bench'),
    (77, 'squat_machine'),
    (78, 'slam_ball'),
    (79, 'slam_ball'),
    (80, 'slam_ball'),
    (81, 'jump_rope'),
    (82, 'body_fat_scale'),
    (83, 'barbell_pad'),
    (84, 'barbell'),
    (85, 'power_rack'),
    (86, 'abductor_machine'),
    (87, 'boxing_pad'),
    (88, 'boxing_pad'),
    (89, 'boxing_pad')
)
UPDATE gym_equipment AS ge
SET equipment_type_id = et.id
FROM equipment_type_mapping AS etm
JOIN equipment_types AS et
  ON et.key = etm.equipment_type_key
WHERE ge.source_number = etm.source_number
  AND ge.source_number BETWEEN 1 AND 89;

CREATE INDEX idx_equipment_types_category ON equipment_types (category);
CREATE INDEX idx_equipment_types_plan_selectable ON equipment_types (plan_selectable);
CREATE INDEX idx_gym_equipment_equipment_type_id ON gym_equipment (equipment_type_id);

-- Safe replacement: the current exercise_equipment table contains no
-- production data, so it can be dropped and replaced in this migration.
DROP TABLE exercise_equipment;

CREATE TABLE exercise_equipment_requirements (
  exercise_id integer NOT NULL,
  equipment_type_id integer NOT NULL,
  required boolean NOT NULL DEFAULT true,
  notes text,
  PRIMARY KEY (exercise_id, equipment_type_id),
  CONSTRAINT exercise_equipment_requirements_exercise_fk FOREIGN KEY (exercise_id)
    REFERENCES exercises (id)
    ON DELETE CASCADE,
  CONSTRAINT exercise_equipment_requirements_equipment_type_fk FOREIGN KEY (equipment_type_id)
    REFERENCES equipment_types (id)
    ON DELETE RESTRICT
);

CREATE INDEX idx_exercise_equipment_requirements_equipment_type_id
  ON exercise_equipment_requirements (equipment_type_id);

COMMIT;
