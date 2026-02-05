-- Achievement definitions for Safe Crack (Game Integration API)
INSERT INTO achievements (id, name, description, icon_url) VALUES
  ('reach_level_1', 'Reach Level 1', 'Complete level 1', 'http://localhost:5173/public/achievements/safe-1.png'),
  ('reach_level_2', 'Reach Level 2', 'Complete level 2', 'http://localhost:5173/public/achievements/safe-2.png'),
  ('reach_level_3', 'Reach Level 3', 'Complete level 3', 'http://localhost:5173/public/achievements/safe-3.png'),
  ('reach_level_4', 'Reach Level 4', 'Complete level 4', 'http://localhost:5173/public/achievements/safe-4.png'),
  ('reach_level_5', 'Reach Level 5', 'Complete level 5', 'http://localhost:5173/public/achievements/safe-5.png'),
  ('reach_level_6', 'Reach Level 6', 'Complete level 6', 'http://localhost:5173/public/achievements/safe-6.png'),
  ('reach_level_7', 'Reach Level 7', 'Complete level 7', 'http://localhost:5173/public/achievements/safe-7.png'),
  ('reach_level_8', 'Reach Level 8', 'Complete level 8', 'http://localhost:5173/public/achievements/safe-8.png'),
  ('reach_level_9', 'Reach Level 9', 'Complete level 9', 'http://localhost:5173/public/achievements/safe-9.png'),
  ('reach_level_10', 'Reach Level 10', 'Complete level 10', 'http://localhost:5173/public/achievements/safe-10.png'),
  ('reach_level_15', 'Reach Level 15', 'Complete level 15', 'http://localhost:5173/public/achievements/safe-15.png'),
  ('reach_level_20', 'Reach Level 20', 'Complete level 20', 'http://localhost:5173/public/achievements/safe-20.png'),
  ('reach_level_25', 'Reach Level 25', 'Complete level 25', 'http://localhost:5173/public/achievements/safe-25.png'),
  ('reach_level_30', 'Reach Level 30', 'Complete level 30', 'http://localhost:5173/public/achievements/safe-30.png'),
  ('reach_level_35', 'Reach Level 35', 'Complete level 35', 'http://localhost:5173/public/achievements/safe-35.png'),
  ('reach_level_40', 'Reach Level 40', 'Complete level 40', 'http://localhost:5173/public/achievements/safe-40.png'),
  ('reach_level_45', 'Reach Level 45', 'Complete level 45', 'http://localhost:5173/public/achievements/safe-45.png'),
  ('reach_level_50', 'Reach Level 50', 'Complete level 50', 'http://localhost:5173/public/achievements/safe-50.png')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url = EXCLUDED.icon_url;
