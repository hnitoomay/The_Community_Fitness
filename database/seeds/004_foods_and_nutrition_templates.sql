BEGIN;

-- Seed simple starter foods for the fitness app. All nutrition values are
-- general estimates for planning templates and should be reviewed by staff.
CREATE TEMP TABLE food_seed_temp (
  name text NOT NULL,
  meal_category text NOT NULL,
  serving_description text NOT NULL,
  calories integer NOT NULL,
  protein_grams numeric(6,2),
  allergen text,
  status text NOT NULL
) ON COMMIT DROP;

INSERT INTO food_seed_temp (
  name,
  meal_category,
  serving_description,
  calories,
  protein_grams,
  allergen,
  status
)
VALUES
  ('Boiled Egg', 'Breakfast', '2 eggs', 140, 12, 'Egg', 'Active'),
  ('Oatmeal', 'Breakfast', '1 cup', 150, 5, 'Gluten', 'Active'),
  ('Whole-Wheat Bread', 'Breakfast', '2 slices', 160, 8, 'Gluten', 'Active'),
  ('Plain Yogurt', 'Breakfast', '1 cup', 120, 9, 'Milk', 'Active'),
  ('Mohinga', 'Breakfast', '1 bowl', 320, 14, 'Fish', 'Active'),
  ('Milk', 'Breakfast', '1 cup', 120, 8, 'Milk', 'Active'),
  ('Rice Porridge', 'Breakfast', '1 bowl', 180, 5, 'None', 'Active'),
  ('Papaya', 'Breakfast', '1 cup', 55, 1, 'None', 'Active'),
  ('Grilled Chicken Breast', 'Lunch', '100 g', 165, 31, 'None', 'Active'),
  ('Fish Curry', 'Lunch', '1 bowl', 260, 24, 'Fish', 'Active'),
  ('White Rice', 'Lunch', '1 cup', 205, 4, 'None', 'Active'),
  ('Brown Rice', 'Lunch', '1 cup', 215, 5, 'None', 'Active'),
  ('Mixed Vegetables', 'Lunch', '1 cup', 90, 3, 'None', 'Active'),
  ('Green Salad', 'Lunch', '1 bowl', 80, 2, 'None', 'Active'),
  ('Tea Leaf Salad', 'Lunch', '1 bowl', 220, 6, 'Peanuts, Sesame', 'Active'),
  ('Shan Noodles', 'Lunch', '1 bowl', 430, 18, 'Gluten', 'Active'),
  ('Steamed Fish', 'Dinner', '100 g', 140, 26, 'Fish', 'Active'),
  ('Tofu', 'Dinner', '100 g', 90, 10, 'Soy', 'Active'),
  ('Sweet Potato', 'Dinner', '100 g', 90, 2, 'None', 'Active'),
  ('Chicken Soup', 'Dinner', '1 bowl', 180, 18, 'None', 'Active'),
  ('Lentil Soup', 'Dinner', '1 bowl', 190, 11, 'None', 'Active'),
  ('Stir-Fried Mixed Vegetables', 'Dinner', '1 cup', 120, 4, 'None', 'Active'),
  ('Pumpkin Soup', 'Dinner', '1 bowl', 110, 3, 'None', 'Active'),
  ('Chicken Curry', 'Dinner', '1 bowl', 280, 23, 'None', 'Active'),
  ('Banana', 'Snack', '1 piece', 105, 1, 'None', 'Active'),
  ('Apple', 'Snack', '1 piece', 95, 0, 'None', 'Active'),
  ('Almonds', 'Snack', '30 g', 170, 6, 'Tree Nuts', 'Active'),
  ('Peanuts', 'Snack', '30 g', 170, 7, 'Peanuts', 'Active'),
  ('Roasted Chickpeas', 'Snack', '30 g', 120, 6, 'None', 'Active'),
  ('Cottage Cheese', 'Snack', '1 cup', 180, 24, 'Milk', 'Active'),
  ('Cucumber Sticks', 'Snack', '1 cup', 20, 1, 'None', 'Active'),
  ('Orange', 'Snack', '1 piece', 62, 1, 'None', 'Active'),
  ('Water', 'Drink', '1 glass', 0, 0, 'None', 'Active'),
  ('Green Tea', 'Drink', '1 cup', 2, 0, 'None', 'Active'),
  ('Black Coffee', 'Drink', '1 cup', 5, 0, 'None', 'Active'),
  ('Fresh Lime Water', 'Drink', '1 glass', 10, 0, 'None', 'Active'),
  ('Soy Milk', 'Drink', '1 cup', 100, 7, 'Soy', 'Active'),
  ('Coconut Water', 'Drink', '1 glass', 45, 1, 'None', 'Active'),
  ('Unsweetened Tea', 'Drink', '1 cup', 2, 0, 'None', 'Active'),
  ('Protein Shake', 'Drink', '1 glass', 180, 24, 'Milk', 'Active');

-- Update foods when the same name already exists; otherwise insert them.
WITH updated_foods AS (
  UPDATE foods AS f
  SET
    meal_category = seed.meal_category,
    serving_description = seed.serving_description,
    calories = seed.calories,
    protein_grams = seed.protein_grams,
    allergen = seed.allergen,
    status = seed.status
  FROM food_seed_temp AS seed
  WHERE f.name = seed.name
  RETURNING f.name
)
INSERT INTO foods (
  name,
  meal_category,
  serving_description,
  calories,
  protein_grams,
  allergen,
  status
)
SELECT
  seed.name,
  seed.meal_category,
  seed.serving_description,
  seed.calories,
  seed.protein_grams,
  seed.allergen,
  seed.status
FROM food_seed_temp AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM foods AS f
  WHERE f.name = seed.name
);

-- Seed one starter nutrition template for each existing body goal.
CREATE TEMP TABLE nutrition_template_seed_temp (
  template_name text NOT NULL,
  body_goal_label text NOT NULL,
  meals_per_day integer NOT NULL,
  minimum_calories integer NOT NULL,
  maximum_calories integer NOT NULL,
  meal_structure text[] NOT NULL,
  notes text,
  status text NOT NULL
) ON COMMIT DROP;

INSERT INTO nutrition_template_seed_temp (
  template_name,
  body_goal_label,
  meals_per_day,
  minimum_calories,
  maximum_calories,
  meal_structure,
  notes,
  status
)
VALUES
  (
    'Weight Loss Nutrition',
    'Weight Loss',
    4,
    1500,
    1800,
    ARRAY['Breakfast', 'Lunch', 'Dinner', 'Snack']::text[],
    'Moderate starter calorie range with a simple four-meal structure.',
    'Active'
  ),
  (
    'Lean and Toned Nutrition',
    'Lean and Toned',
    4,
    1700,
    2000,
    ARRAY['Breakfast', 'Lunch', 'Dinner', 'Snack']::text[],
    'Balanced beginner structure with steady protein distribution across the day.',
    'Active'
  ),
  (
    'General Fitness Nutrition',
    'General Fitness',
    4,
    1800,
    2200,
    ARRAY['Breakfast', 'Lunch', 'Dinner', 'Snack']::text[],
    'General-use structure focused on consistency and balanced daily intake.',
    'Active'
  ),
  (
    'Athletic Body Nutrition',
    'Athletic Body',
    5,
    2200,
    2800,
    ARRAY['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink']::text[],
    'Higher-energy structure to support training volume and recovery.',
    'Active'
  ),
  (
    'Muscle Gain Nutrition',
    'Muscle Gain',
    5,
    2400,
    3000,
    ARRAY['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink']::text[],
    'Higher-calorie beginner template emphasizing recovery and protein intake.',
    'Active'
  ),
  (
    'Strength Focus Nutrition',
    'Strength Focus',
    5,
    2300,
    2900,
    ARRAY['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Drink']::text[],
    'Recovery-oriented structure supporting heavier compound training days.',
    'Active'
  );

-- Update templates by name when present; otherwise insert them using body
-- goal labels instead of hardcoded IDs.
WITH updated_nutrition_templates AS (
  UPDATE nutrition_templates AS nt
  SET
    body_goal_id = bg.id,
    meals_per_day = seed.meals_per_day,
    minimum_calories = seed.minimum_calories,
    maximum_calories = seed.maximum_calories,
    meal_structure = seed.meal_structure,
    notes = seed.notes,
    status = seed.status
  FROM nutrition_template_seed_temp AS seed
  JOIN body_goals AS bg
    ON bg.label = seed.body_goal_label
  WHERE nt.name = seed.template_name
  RETURNING nt.name
)
INSERT INTO nutrition_templates (
  name,
  body_goal_id,
  meals_per_day,
  minimum_calories,
  maximum_calories,
  meal_structure,
  notes,
  status
)
SELECT
  seed.template_name,
  bg.id,
  seed.meals_per_day,
  seed.minimum_calories,
  seed.maximum_calories,
  seed.meal_structure,
  seed.notes,
  seed.status
FROM nutrition_template_seed_temp AS seed
JOIN body_goals AS bg
  ON bg.label = seed.body_goal_label
WHERE NOT EXISTS (
  SELECT 1
  FROM nutrition_templates AS nt
  WHERE nt.name = seed.template_name
);

-- Link each body goal to its seeded starter nutrition template.
UPDATE body_goals AS bg
SET nutrition_template_id = nt.id
FROM nutrition_template_seed_temp AS seed
JOIN nutrition_templates AS nt
  ON nt.name = seed.template_name
WHERE bg.label = seed.body_goal_label
  AND bg.nutrition_template_id IS DISTINCT FROM nt.id;

COMMIT;
