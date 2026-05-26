-- V5: Add Accessories sub-categories and sample products (tie, belt)

-- Add sub-categories under the Accessories category (id=4)
INSERT INTO sub_categories (name, category_id)
SELECT name, cat.id
FROM (VALUES ('Tie'), ('Belt'), ('ID Card'), ('Bag'), ('Other')) AS v(name)
CROSS JOIN (SELECT id FROM categories WHERE name = 'Accessories') AS cat;

-- Boys Tie
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active)
SELECT 'Boys School Tie - Blue Stripe', c.id, sc.id,
  'ACC-TIE-BOY-001', 'Boys clip-on school tie, blue and white diagonal stripes.',
  'Polyester', 'Blue/White', 'Boys', 'All Season',
  110.00, 5.00, 0.00, 115.50, 'One Size', true
FROM categories c JOIN sub_categories sc ON sc.category_id = c.id AND sc.name = 'Tie'
WHERE c.name = 'Accessories';

-- Boys Belt (Leather)
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active)
SELECT 'Boys Leather Belt - Black', c.id, sc.id,
  'ACC-BLT-BOY-001', 'Black genuine leather belt for boys, silver buckle.',
  'Leather', 'Black', 'Boys', 'All Season',
  95.00, 5.00, 0.00, 99.75, 'S,M,L,XL', true
FROM categories c JOIN sub_categories sc ON sc.category_id = c.id AND sc.name = 'Belt'
WHERE c.name = 'Accessories';

-- Girls Tie
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active)
SELECT 'Girls School Tie - Blue Stripe', c.id, sc.id,
  'ACC-TIE-GRL-001', 'Girls clip-on school tie, matching boys pattern.',
  'Polyester', 'Blue/White', 'Girls', 'All Season',
  110.00, 5.00, 0.00, 115.50, 'One Size', true
FROM categories c JOIN sub_categories sc ON sc.category_id = c.id AND sc.name = 'Tie'
WHERE c.name = 'Accessories';

-- Girls Belt
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active)
SELECT 'Girls Woven Belt - Navy', c.id, sc.id,
  'ACC-BLT-GRL-001', 'Navy woven belt for girls, slim profile with hook clasp.',
  'Woven Fabric', 'Navy Blue', 'Girls', 'All Season',
  70.00, 5.00, 0.00, 73.50, 'S,M,L', true
FROM categories c JOIN sub_categories sc ON sc.category_id = c.id AND sc.name = 'Belt'
WHERE c.name = 'Accessories';

-- Unisex ID Card Holder
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active)
SELECT 'School ID Card Holder', c.id, sc.id,
  'ACC-IDC-UNI-001', 'Yellow lanyard with transparent ID card holder.',
  'Nylon/PVC', 'Yellow', 'Unisex', 'All Season',
  45.00, 18.00, 0.00, 53.10, 'One Size', true
FROM categories c JOIN sub_categories sc ON sc.category_id = c.id AND sc.name = 'ID Card'
WHERE c.name = 'Accessories';

-- Unisex Canvas Belt
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active)
SELECT 'Canvas Belt - Navy', c.id, sc.id,
  'ACC-BLT-UNI-001', 'Navy canvas webbing belt, adjustable metal clasp.',
  'Canvas', 'Navy Blue', 'Unisex', 'All Season',
  65.00, 5.00, 0.00, 68.25, 'S,M,L,XL', true
FROM categories c JOIN sub_categories sc ON sc.category_id = c.id AND sc.name = 'Belt'
WHERE c.name = 'Accessories';
