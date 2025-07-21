-- Create nagawara mess
INSERT INTO public.mess (name, description, address, created_by) 
VALUES (
  'Nagawara',
  'Traditional Indian mess serving authentic homemade meals',
  'Nagawara, Bangalore',
  'ce173438-c685-4eb6-8fe5-0b5da6af6924'
);

-- Update user profile to join this mess
UPDATE public.profiles 
SET mess_id = (SELECT id FROM public.mess WHERE name = 'Nagawara' AND created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924')
WHERE user_id = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Add detailed weekly menu items
-- Monday (day_of_week = 1)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  1,
  true
FROM public.mess m,
(VALUES
  ('Idli Sambar', 'Soft steamed rice cakes with spiced lentil curry', 'breakfast'),
  ('Coconut Chutney', 'Fresh coconut chutney with curry leaves', 'breakfast'),
  ('Filter Coffee', 'Traditional South Indian filter coffee', 'breakfast'),
  ('Vegetable Pulao', 'Aromatic basmati rice with mixed vegetables', 'lunch'),
  ('Raita', 'Cooling yogurt with cucumber and mint', 'lunch'),
  ('Papad', 'Crispy lentil wafers', 'lunch'),
  ('Rasam', 'Tangy tomato and tamarind soup', 'lunch'),
  ('Chapati', 'Soft whole wheat flatbread', 'dinner'),
  ('Palak Paneer', 'Cottage cheese in creamy spinach gravy', 'dinner'),
  ('Dal Fry', 'Tempered yellow lentils with spices', 'dinner'),
  ('Steamed Rice', 'Perfectly cooked basmati rice', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Tuesday (day_of_week = 2)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  2,
  true
FROM public.mess m,
(VALUES
  ('Masala Dosa', 'Crispy crepe with spiced potato filling', 'breakfast'),
  ('Sambar', 'Traditional South Indian lentil curry', 'breakfast'),
  ('Tomato Chutney', 'Tangy tomato chutney with garlic', 'breakfast'),
  ('Curd Rice', 'Comforting rice with yogurt and tempering', 'lunch'),
  ('Pickle', 'Spicy mango pickle', 'lunch'),
  ('Vegetable Curry', 'Seasonal mixed vegetable curry', 'lunch'),
  ('Roti', 'Fresh whole wheat flatbread', 'dinner'),
  ('Chicken Curry', 'Spicy chicken curry with onions', 'dinner'),
  ('Jeera Rice', 'Cumin flavored basmati rice', 'dinner'),
  ('Papad', 'Crispy roasted papad', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Wednesday (day_of_week = 3)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  3,
  true
FROM public.mess m,
(VALUES
  ('Poha', 'Flattened rice with onions and spices', 'breakfast'),
  ('Jalebi', 'Sweet crispy spirals in sugar syrup', 'breakfast'),
  ('Masala Chai', 'Spiced Indian tea with milk', 'breakfast'),
  ('Biryani', 'Fragrant basmati rice with vegetables', 'lunch'),
  ('Boiled Egg', 'Hard boiled eggs with salt', 'lunch'),
  ('Shorba', 'Clear vegetable soup', 'lunch'),
  ('Paratha', 'Layered whole wheat flatbread', 'dinner'),
  ('Aloo Gobi', 'Potato and cauliflower dry curry', 'dinner'),
  ('Dal Tadka', 'Yellow lentils with tempering', 'dinner'),
  ('Pickled Onions', 'Tangy pickled onions', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Thursday (day_of_week = 4)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  4,
  true
FROM public.mess m,
(VALUES
  ('Upma', 'Semolina breakfast with vegetables', 'breakfast'),
  ('Coconut Chutney', 'Fresh coconut chutney', 'breakfast'),
  ('South Indian Coffee', 'Strong filter coffee', 'breakfast'),
  ('Rajma Rice', 'Kidney bean curry with rice', 'lunch'),
  ('Cucumber Salad', 'Fresh cucumber with lemon', 'lunch'),
  ('Buttermilk', 'Spiced yogurt drink', 'lunch'),
  ('Naan', 'Soft leavened bread', 'dinner'),
  ('Paneer Makhani', 'Cottage cheese in rich tomato gravy', 'dinner'),
  ('Vegetable Pulao', 'Aromatic rice with mixed vegetables', 'dinner'),
  ('Mint Chutney', 'Fresh mint and coriander chutney', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Friday (day_of_week = 5)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  5,
  true
FROM public.mess m,
(VALUES
  ('Puri Bhaji', 'Fried bread with spiced potato curry', 'breakfast'),
  ('Sweet Lassi', 'Sweetened yogurt drink', 'breakfast'),
  ('Samosa', 'Crispy pastry with spiced filling', 'snacks'),
  ('Fish Curry', 'Coconut based fish curry', 'lunch'),
  ('Steamed Rice', 'Plain steamed rice', 'lunch'),
  ('Vegetable Salad', 'Mixed fresh vegetables', 'lunch'),
  ('Chapati', 'Soft whole wheat bread', 'dinner'),
  ('Mutton Curry', 'Spicy goat meat curry', 'dinner'),
  ('Jeera Rice', 'Cumin flavored rice', 'dinner'),
  ('Onion Raita', 'Yogurt with onions and spices', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Saturday (day_of_week = 6)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  6,
  true
FROM public.mess m,
(VALUES
  ('Vada Sambar', 'Fried lentil donuts with sambar', 'breakfast'),
  ('Coconut Chutney', 'Fresh coconut chutney', 'breakfast'),
  ('Filter Coffee', 'Traditional South Indian coffee', 'breakfast'),
  ('Chole Bhature', 'Spiced chickpeas with fried bread', 'lunch'),
  ('Lassi', 'Yogurt based drink', 'lunch'),
  ('Pickle', 'Mixed vegetable pickle', 'lunch'),
  ('Roti', 'Whole wheat flatbread', 'dinner'),
  ('Egg Curry', 'Boiled eggs in spicy gravy', 'dinner'),
  ('Vegetable Biryani', 'Fragrant rice with vegetables', 'dinner'),
  ('Cucumber Raita', 'Cooling yogurt with cucumber', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Sunday (day_of_week = 0)
INSERT INTO public.menu_items (mess_id, name, description, category, day_of_week, is_active) 
SELECT 
  m.id,
  item_name,
  item_description,
  item_category,
  0,
  true
FROM public.mess m,
(VALUES
  ('Pongal', 'Savory rice and lentil dish', 'breakfast'),
  ('Sambar', 'Lentil curry with vegetables', 'breakfast'),
  ('Ghee', 'Clarified butter', 'breakfast'),
  ('Special Thali', 'Complete meal with variety of dishes', 'lunch'),
  ('Sweet Dish', 'Traditional Indian dessert', 'lunch'),
  ('Buttermilk', 'Spiced yogurt drink', 'lunch'),
  ('Paratha', 'Stuffed flatbread', 'dinner'),
  ('Paneer Tikka', 'Grilled cottage cheese', 'dinner'),
  ('Pulao', 'Fragrant rice dish', 'dinner'),
  ('Mixed Pickle', 'Assorted pickles', 'dinner')
) AS menu_data(item_name, item_description, item_category)
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';

-- Create activity log for mess creation
INSERT INTO public.activities (mess_id, user_id, action, description, entity_type, entity_id)
SELECT 
  m.id,
  'ce173438-c685-4eb6-8fe5-0b5da6af6924',
  'mess_created',
  'Created Nagawara mess with complete weekly menu',
  'mess',
  m.id
FROM public.mess m
WHERE m.name = 'Nagawara' AND m.created_by = 'ce173438-c685-4eb6-8fe5-0b5da6af6924';