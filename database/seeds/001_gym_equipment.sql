BEGIN;

WITH seed_data (
  source_number,
  name,
  category,
  quantity,
  unit,
  plan_selectable,
  availability,
  notes
) AS (
  VALUES
    (1, 'Treadmill', 'Cardio Machine', 3, 'Unit', true, 'Available', NULL),
    (2, 'Bike', 'Cardio Machine', 3, 'Unit', true, 'Available', NULL),
    (3, '5 Station Multi Jungle', 'Strength Machine', 1, 'Unit', true, 'Available', NULL),
    (4, 'Smith Machine', 'Strength Machine', 1, 'Unit', true, 'Available', NULL),
    (5, 'Leg Press', 'Strength Machine', 1, 'Unit', true, 'Available', NULL),
    (6, 'Shoulder Press', 'Strength Machine', 1, 'Unit', true, 'Available', NULL),
    (7, 'Leg Extension', 'Strength Machine', 1, 'Unit', true, 'Available', NULL),
    (8, 'Manual Chest Bench', 'Bench', 1, 'Unit', true, 'Available', NULL),
    (9, 'Manual Incline Bench', 'Bench', 1, 'Unit', true, 'Available', NULL),
    (10, 'Dumbbell Rack', 'Storage', 2, 'Unit', false, 'Available', NULL),
    (11, 'Barbell Rack', 'Storage', 1, 'Unit', false, 'Available', NULL),
    (12, 'Exercise Ball Rack', 'Storage', 1, 'Unit', false, 'Available', NULL),
    (13, 'Dumbbell 2.5kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (14, 'Dumbbell 5Kg', 'Free Weight', 2, 'Set', true, 'Available', NULL),
    (15, 'Dumbbell 7.5kg', 'Free Weight', 2, 'Set', true, 'Available', NULL),
    (16, 'Dumbbell 10kg', 'Free Weight', 2, 'Set', true, 'Available', NULL),
    (17, 'Dumbbell 12.5kg', 'Free Weight', 2, 'Set', true, 'Available', NULL),
    (18, 'Dumbbell 15kg', 'Free Weight', 2, 'Set', true, 'Available', NULL),
    (19, 'Dumbbell 17.5kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (20, 'Dumbbell 20kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (21, 'Dumbbell 22.5kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (22, 'Dumbbell 25kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (23, 'Dumbbell 27.5kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (24, 'Dumbbell 30kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (25, 'Dumbbell 32.5kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (26, 'Dumbbell 35kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (27, 'Dumbbell 37.5kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (28, 'Weight Plate 2.5 kg', 'Free Weight', 1, 'Set', true, 'Available', NULL),
    (29, 'Weight Plate 5kg', 'Free Weight', 2, 'Set', true, 'Available', NULL),
    (30, 'Weight Plate 10kg', 'Free Weight', 4, 'Set', true, 'Available', NULL),
    (31, 'Weight Plate 15kg', 'Free Weight', 4, 'Set', true, 'Available', NULL),
    (32, 'Weight Plate 20kg', 'Free Weight', 5, 'Set', true, 'Available', NULL),
    (33, 'Weight Plate 25kg', 'Free Weight', 5, 'Set', true, 'Available', NULL),
    (34, 'Medicine Ball 1kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (35, 'Medicine Ball 2kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (36, 'Medicine Ball 6kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (37, 'Medicine Ball 7kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (38, 'Medicine Ball 8kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (39, 'Medicine Ball 9kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (40, 'Medicine Ball 10kg', 'Functional Training', 1, 'Piece', true, 'Available', NULL),
    (41, 'Olympic Bar', 'Free Weight', 5, 'Unit', true, 'Available', NULL),
    (42, 'EZ Bar', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (43, 'Small Dumbbell', 'Free Weight', 14, 'Set', true, 'Available', 'Manual review: source name does not specify the weight range or model.'),
    (44, 'Functional Rope', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (45, 'Leg Raise(Sand Belt)', 'Functional Training', 3, 'Unit', true, 'Available', 'Manual review: source name is ambiguous and should be verified against the physical item.'),
    (46, 'Utility Bench', 'Bench', 2, 'Unit', true, 'Available', NULL),
    (47, 'Flat Bench', 'Bench', 3, 'Unit', true, 'Available', NULL),
    (48, 'Incline Bench', 'Bench', 1, 'Unit', true, 'Available', NULL),
    (49, 'Hyper Extension', 'Bench', 1, 'Unit', true, 'Available', NULL),
    (50, 'Bosu', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (51, 'Cable Accessories', 'Supporting Accessory', 1, 'Unit', true, 'Available', 'Manual review: generic accessory bundle; confirm which cable attachments are included.'),
    (52, 'Barbell Clip', 'Supporting Accessory', 5, 'Set', false, 'Available', NULL),
    (53, 'Teakkwondo Accessories', 'Boxing', 3, 'Set', true, 'Available', 'Manual review: generic combat-sport accessory bundle; confirm exact included items.'),
    (54, 'Agility Ladder', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (55, 'Agility Cone', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (56, 'TRX Rope', 'Functional Training', 2, 'Unit', true, 'Available', NULL),
    (57, 'Boxing Gloves', 'Boxing', 8, 'Set', true, 'Available', NULL),
    (58, 'Yoga Mat', 'Stretching and Recovery', 22, 'Unit', true, 'Available', NULL),
    (59, 'Weight Lift Belt', 'Supporting Accessory', 2, 'Piece', false, 'Available', NULL),
    (60, 'Ladder Machine', 'Cardio Machine', 1, 'Unit', true, 'Available', NULL),
    (61, 'Cross Trainer', 'Cardio Machine', 1, 'Unit', true, 'Available', NULL),
    (62, 'Foam Roller', 'Stretching and Recovery', 3, 'Unit', true, 'Available', NULL),
    (63, 'Resistance Loop', 'Functional Training', 2, 'Unit', true, 'Available', NULL),
    (64, 'Suspension System(Green)', 'Functional Training', 3, 'Unit', true, 'Available', NULL),
    (65, 'MD - 2222 - 4 4kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (66, 'MD - 2222 - 6 6kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (67, 'MD - 2222 - 8 8kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (68, 'MD - 2222 - 10 10kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (69, 'MD - 2222 - 12 12kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (70, 'MD - 2222 - 16kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (71, 'MD - 2219 - 20 20kg Kettlebell', 'Free Weight', 1, 'Unit', true, 'Available', NULL),
    (72, 'MD - 6508B Plyo Jump Box', 'Functional Training', 3, 'Unit', true, 'Available', NULL),
    (73, 'B - 2 Adjustable Bench', 'Bench', 1, 'Unit', true, 'Available', NULL),
    (74, 'SPART - Step Board', 'Functional Training', 12, 'Set', true, 'Available', NULL),
    (75, 'LOT - Punching Bag', 'Boxing', 1, 'Piece', true, 'Available', NULL),
    (76, 'Adjustable Decline Bench', 'Bench', 1, 'Unit', true, 'Available', NULL),
    (77, 'Squat 2 way Belly', 'Strength Machine', 1, 'Unit', true, 'Available', 'Manual review: source name is ambiguous and should be verified before exercise mapping.'),
    (78, 'MD - 1276 - 6 SLAM BALL( 9.4 LB )', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (79, 'MD - 1276 - 8 SLAM BALL(13.2 LB )', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (80, 'MD - 1276 - 10 SLAM BALL( 22 LB )', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (81, 'MD - JR027 Cross Jump Rope', 'Functional Training', 1, 'Unit', true, 'Available', NULL),
    (82, 'OVICX - L1 Body Fat Scale', 'Measurement', 1, 'Piece', false, 'Available', NULL),
    (83, 'SPART - Barbell Pad WE7004', 'Supporting Accessory', 2, 'Piece', false, 'Available', NULL),
    (84, 'Fixed Barbell (10kg)', 'Free Weight', 1, 'Piece', true, 'Available', NULL),
    (85, 'Power Rack', 'Strength Machine', 1, 'Piece', true, 'Available', NULL),
    (86, 'Abductor Machine', 'Strength Machine', 1, 'Piece', true, 'Available', NULL),
    (87, 'Boxing Kick Pad', 'Boxing', 1, 'Piece', true, 'Available', NULL),
    (88, 'Shield Guard', 'Boxing', 1, 'Piece', true, 'Available', NULL),
    (89, 'Boxing Pad', 'Boxing', 1, 'Piece', true, 'Available', NULL)
),
updated AS (
  UPDATE gym_equipment AS ge
  SET
    name = sd.name,
    category = sd.category,
    quantity = sd.quantity,
    unit = sd.unit,
    plan_selectable = sd.plan_selectable,
    availability = sd.availability,
    notes = sd.notes
  FROM seed_data AS sd
  WHERE ge.source_number = sd.source_number
  RETURNING ge.source_number
)
INSERT INTO gym_equipment (
  source_number,
  name,
  category,
  quantity,
  unit,
  plan_selectable,
  availability,
  notes
)
SELECT
  sd.source_number,
  sd.name,
  sd.category,
  sd.quantity,
  sd.unit,
  sd.plan_selectable,
  sd.availability,
  sd.notes
FROM seed_data AS sd
WHERE NOT EXISTS (
  SELECT 1
  FROM gym_equipment AS ge
  WHERE ge.source_number = sd.source_number
);

COMMIT;
