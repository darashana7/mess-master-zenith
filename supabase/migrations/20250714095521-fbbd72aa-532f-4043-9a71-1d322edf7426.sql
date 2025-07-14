-- Insert sample menu data from CSV
-- This populates the menu_items table with a complete weekly menu

-- Sample mess for demo purposes (you can modify the mess_id as needed)
DO $$
DECLARE
    sample_mess_id uuid := gen_random_uuid();
BEGIN
    -- Create a sample mess first
    INSERT INTO public.mess (id, name, description, address)
    VALUES (sample_mess_id, 'Sample Indian Mess', 'Demo mess with authentic Indian cuisine', 'Sample Address, City');

    -- Monday (day_of_week = 1)
    INSERT INTO public.menu_items (mess_id, day_of_week, category, name, description) VALUES
    (sample_mess_id, 1, 'breakfast', 'Aloo Paratha', 'Potato stuffed flatbread'),
    (sample_mess_id, 1, 'breakfast', 'Curd', 'Fresh yogurt'),
    (sample_mess_id, 1, 'breakfast', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 1, 'lunch', 'Dal Tadka', 'Tempered lentil curry'),
    (sample_mess_id, 1, 'lunch', 'Jeera Rice', 'Cumin flavored rice'),
    (sample_mess_id, 1, 'lunch', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 1, 'lunch', 'Bhindi Sabzi', 'Okra curry'),
    (sample_mess_id, 1, 'lunch', 'Salad', 'Fresh mixed salad'),
    (sample_mess_id, 1, 'dinner', 'Rajma', 'Kidney bean curry'),
    (sample_mess_id, 1, 'dinner', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 1, 'dinner', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 1, 'dinner', 'Raita', 'Yogurt based side dish'),
    (sample_mess_id, 1, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 1, 'snacks', 'Biscuits', 'Tea biscuits'),

    -- Tuesday (day_of_week = 2)
    (sample_mess_id, 2, 'breakfast', 'Poha', 'Flattened rice dish'),
    (sample_mess_id, 2, 'breakfast', 'Chutney', 'Coconut chutney'),
    (sample_mess_id, 2, 'breakfast', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 2, 'lunch', 'Chole', 'Chickpea curry'),
    (sample_mess_id, 2, 'lunch', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 2, 'lunch', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 2, 'lunch', 'Aloo Gobi', 'Potato cauliflower curry'),
    (sample_mess_id, 2, 'lunch', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 2, 'dinner', 'Dal Makhani', 'Creamy black lentil curry'),
    (sample_mess_id, 2, 'dinner', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 2, 'dinner', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 2, 'dinner', 'Mixed Veg', 'Mixed vegetable curry'),
    (sample_mess_id, 2, 'dinner', 'Papad', 'Crispy lentil wafer'),
    (sample_mess_id, 2, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 2, 'snacks', 'Samosa', 'Fried pastry with filling'),

    -- Wednesday (day_of_week = 3)
    (sample_mess_id, 3, 'breakfast', 'Upma', 'Semolina porridge'),
    (sample_mess_id, 3, 'breakfast', 'Coconut Chutney', 'Fresh coconut chutney'),
    (sample_mess_id, 3, 'breakfast', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 3, 'lunch', 'Kadhi Pakora', 'Yogurt curry with fritters'),
    (sample_mess_id, 3, 'lunch', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 3, 'lunch', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 3, 'lunch', 'Baingan Bharta', 'Roasted eggplant curry'),
    (sample_mess_id, 3, 'lunch', 'Salad', 'Fresh mixed salad'),
    (sample_mess_id, 3, 'dinner', 'Paneer Butter Masala', 'Cottage cheese in tomato gravy'),
    (sample_mess_id, 3, 'dinner', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 3, 'dinner', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 3, 'dinner', 'Dal', 'Lentil curry'),
    (sample_mess_id, 3, 'dinner', 'Raita', 'Yogurt based side dish'),
    (sample_mess_id, 3, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 3, 'snacks', 'Mathri', 'Crispy fried snack'),

    -- Thursday (day_of_week = 4)
    (sample_mess_id, 4, 'breakfast', 'Mixed Veg Paratha', 'Vegetable stuffed flatbread'),
    (sample_mess_id, 4, 'breakfast', 'Curd', 'Fresh yogurt'),
    (sample_mess_id, 4, 'breakfast', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 4, 'lunch', 'Sambhar', 'South Indian lentil curry'),
    (sample_mess_id, 4, 'lunch', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 4, 'lunch', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 4, 'lunch', 'Palak Paneer', 'Spinach with cottage cheese'),
    (sample_mess_id, 4, 'lunch', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 4, 'dinner', 'Chicken Curry', 'Spiced chicken curry'),
    (sample_mess_id, 4, 'dinner', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 4, 'dinner', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 4, 'dinner', 'Dal', 'Lentil curry'),
    (sample_mess_id, 4, 'dinner', 'Salad', 'Fresh mixed salad'),
    (sample_mess_id, 4, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 4, 'snacks', 'Pakora', 'Vegetable fritters'),

    -- Friday (day_of_week = 5)
    (sample_mess_id, 5, 'breakfast', 'Idli', 'Steamed rice cakes'),
    (sample_mess_id, 5, 'breakfast', 'Sambhar', 'South Indian lentil curry'),
    (sample_mess_id, 5, 'breakfast', 'Chutney', 'Coconut chutney'),
    (sample_mess_id, 5, 'breakfast', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 5, 'lunch', 'Rajma', 'Kidney bean curry'),
    (sample_mess_id, 5, 'lunch', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 5, 'lunch', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 5, 'lunch', 'Karela Sabzi', 'Bitter gourd curry'),
    (sample_mess_id, 5, 'lunch', 'Raita', 'Yogurt based side dish'),
    (sample_mess_id, 5, 'dinner', 'Fish Curry', 'Spiced fish curry'),
    (sample_mess_id, 5, 'dinner', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 5, 'dinner', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 5, 'dinner', 'Dal', 'Lentil curry'),
    (sample_mess_id, 5, 'dinner', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 5, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 5, 'snacks', 'Bread Pakora', 'Fried bread fritters'),

    -- Saturday (day_of_week = 6)
    (sample_mess_id, 6, 'breakfast', 'Chole Bhature', 'Chickpea curry with fried bread'),
    (sample_mess_id, 6, 'breakfast', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 6, 'breakfast', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 6, 'lunch', 'Biryani', 'Aromatic rice with spices'),
    (sample_mess_id, 6, 'lunch', 'Raita', 'Yogurt based side dish'),
    (sample_mess_id, 6, 'lunch', 'Shorba', 'Clear soup'),
    (sample_mess_id, 6, 'lunch', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 6, 'dinner', 'Paneer Makhani', 'Cottage cheese in creamy gravy'),
    (sample_mess_id, 6, 'dinner', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 6, 'dinner', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 6, 'dinner', 'Dal', 'Lentil curry'),
    (sample_mess_id, 6, 'dinner', 'Salad', 'Fresh mixed salad'),
    (sample_mess_id, 6, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 6, 'snacks', 'Jalebi', 'Sweet spiral pastry'),

    -- Sunday (day_of_week = 0)
    (sample_mess_id, 0, 'breakfast', 'Puri Sabzi', 'Fried bread with vegetable curry'),
    (sample_mess_id, 0, 'breakfast', 'Halwa', 'Sweet semolina pudding'),
    (sample_mess_id, 0, 'breakfast', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 0, 'lunch', 'Mutton Curry', 'Special spiced mutton curry'),
    (sample_mess_id, 0, 'lunch', 'Rice', 'Steamed basmati rice'),
    (sample_mess_id, 0, 'lunch', 'Roti', 'Whole wheat flatbread'),
    (sample_mess_id, 0, 'lunch', 'Dal', 'Lentil curry'),
    (sample_mess_id, 0, 'lunch', 'Raita', 'Yogurt based side dish'),
    (sample_mess_id, 0, 'lunch', 'Pickle', 'Mixed vegetable pickle'),
    (sample_mess_id, 0, 'dinner', 'Dal Rice', 'Simple lentil and rice'),
    (sample_mess_id, 0, 'dinner', 'Papad', 'Crispy lentil wafer'),
    (sample_mess_id, 0, 'snacks', 'Tea', 'Indian spiced tea'),
    (sample_mess_id, 0, 'snacks', 'Sweets', 'Traditional Indian sweets');

END $$;