-- Game metadata for GET /v1/game/info (Game Integration API)
INSERT INTO game_info (id, name, description, score_unit, sort_order) VALUES
  (1, 'Safe Crack', 'Pick the right safe each round. Higher scores win.', 'Points', 'DESC')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  score_unit = EXCLUDED.score_unit,
  sort_order = EXCLUDED.sort_order;
