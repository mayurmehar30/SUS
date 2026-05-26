-- ─── V2: Dummy Data ──────────────────────────────────────────────────────────
-- Provides realistic seed data so the app is immediately usable for demos.

-- ─── Additional Users ────────────────────────────────────────────────────────
-- password for all = Admin@123
INSERT INTO users (name, email, password, role) VALUES
  ('Ravi Sharma',    'ravi@sus.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lLx2', 'SALESMAN'),
  ('Pooja Mehta',    'pooja@sus.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lLx2', 'SALESMAN'),
  ('Suresh Kumar',   'suresh@sus.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lLx2', 'FACTORY_MANAGER');

-- ─── Schools ─────────────────────────────────────────────────────────────────
INSERT INTO schools (name, contact_person, mobile, email, address, school_code, active) VALUES
  ('Green Valley Public School',  'Mrs. Anjali Singh',  '9876543201', 'principal@greenvalley.edu', '12, MG Road, Pune - 411001',           'GVPS001', true),
  ('St. Mary''s Convent School',  'Fr. Thomas Mathew',  '9876543202', 'admin@stmarys.edu',         '45, Church Street, Mumbai - 400001',   'SMCS002', true),
  ('Delhi Public School',         'Mr. Ramesh Gupta',   '9876543203', 'info@dpsnagpur.edu',        '7, Civil Lines, Nagpur - 440001',      'DPSN003', true),
  ('Kendriya Vidyalaya No. 1',    'Mrs. Sunita Rao',    '9876543204', 'kv1hyd@kvs.gov.in',         'Saifabad, Hyderabad - 500004',         'KVH1004', true),
  ('Bal Bharati Public School',   'Dr. Priya Nair',     '9876543205', 'principal@balbharati.edu',  'Sector 14, Rohini, Delhi - 110085',    'BBPS005', true),
  ('Ryan International School',   'Mr. Ajay Verma',     '9876543206', 'ryan.pune@ryan.edu',        'Bavdhan, Pune - 411021',               'RISP006', false),
  ('Podar International School',  'Ms. Kavitha Iyer',   '9876543207', 'podar.mumbai@podar.edu',    'Santacruz West, Mumbai - 400054',      'PISM007', true),
  ('The Heritage School',         'Mr. Vikram Bose',    '9876543208', 'info@heritageschool.in',    'Sector V, Salt Lake, Kolkata - 700091','THSK008', true);

-- ─── Products ────────────────────────────────────────────────────────────────
-- Boys category = 1, sub-cats: Top=1, Bottom=2, Tie=3, Belt=4, Sweater=5, Blazer=6, Socks=7, Shoes=8, Sports Wear=9, Winter Wear=10
-- Girls category = 2, sub-cats: Top=13, Bottom=14, Chunni=15, Tie=16, Sweater=17, Blazer=18, Socks=19, Shoes=20
-- Unisex = 3, sub-cats: Top=25, Bottom=26, Sweater=27, Blazer=28, Socks=29, Shoes=30, Sports Wear=31
-- Accessories = 4, sub-cats: Belt=33, Tie=34, ID Card=35, Bag=36

INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active) VALUES

-- Boys
('Boys School Shirt - White',       1, 1,  'BSH-WHT-001', 'Full-sleeve white cotton shirt with collar, suitable for all standards.',          'Cotton 100%',         'White',       'Boys',   'All Season', 280.00, 5.00, 0.00, 294.00,  'XS,S,M,L,XL,XXL', true),
('Boys School Trousers - Grey',     1, 2,  'BTR-GRY-001', 'Formal grey trousers with elastic waistband for comfort.',                         'Polyester-Viscose',   'Grey',        'Boys',   'All Season', 320.00, 5.00, 0.00, 336.00,  '24,26,28,30,32,34', true),
('Boys Blazer - Navy Blue',         1, 6,  'BBL-NVY-001', 'Premium navy blue blazer with school emblem embroidery.',                          'Wool Blend',          'Navy Blue',   'Boys',   'Winter',     850.00, 12.00,5.00, 900.12,  'XS,S,M,L,XL,XXL', true),
('Boys Sweater - Navy Blue',        1, 5,  'BSW-NVY-001', 'V-neck woolen sweater, comfortable and warm.',                                     'Acrylic Wool',        'Navy Blue',   'Boys',   'Winter',     450.00, 5.00, 0.00, 472.50,  'XS,S,M,L,XL,XXL', true),
('Boys School Tie - Striped',       1, 3,  'BTI-STR-001', 'Polyester striped school tie, pre-tied with clip.',                                'Polyester',           'Blue/Yellow', 'Boys',   'All Season', 120.00, 5.00, 0.00, 126.00,  'One Size',          true),
('Boys Belt - Black',               1, 4,  'BBL-BLK-001', 'Genuine leather black belt with school logo buckle.',                              'Leather',             'Black',       'Boys',   'All Season',  85.00, 5.00, 0.00,  89.25,  'S,M,L,XL',          true),
('Boys Sports Kit',                 1, 9,  'BSK-GRN-001', 'Track pant + T-shirt sports set, moisture-wicking fabric.',                        'Polyester Dry-fit',   'Green/White', 'Boys',   'All Season', 380.00, 5.00,10.00, 360.45,  'XS,S,M,L,XL,XXL', true),
('Boys School Socks - White',       1, 7,  'BSO-WHT-001', 'Cotton ankle socks, pack of 3 pairs.',                                             'Cotton',              'White',       'Boys',   'All Season',  75.00, 5.00, 0.00,  78.75,  'S (5-8),M (9-11)',  true),
('Boys Formal Shoes - Black',       1, 8,  'BSH-BLK-001', 'Black leather formal school shoes with velcro strap.',                             'Synthetic Leather',   'Black',       'Boys',   'All Season', 650.00, 5.00, 5.00, 648.38,  '1,2,3,4,5,6,7,8',  true),

-- Girls
('Girls School Kurta - White',      2, 13, 'GKT-WHT-001', 'Half-sleeve white kurta with school emblem, comfortable cotton blend.',            'Cotton Blend',        'White',       'Girls',  'All Season', 300.00, 5.00, 0.00, 315.00,  'XS,S,M,L,XL,XXL', true),
('Girls School Salwar - Navy',      2, 14, 'GSL-NVY-001', 'Navy blue salwar, elasticated waist, smooth polyester fabric.',                    'Polyester',           'Navy Blue',   'Girls',  'All Season', 280.00, 5.00, 0.00, 294.00,  'XS,S,M,L,XL,XXL', true),
('Girls Chunni - White',            2, 15, 'GCH-WHT-001', 'White dupatta/chunni with blue border.',                                           'Georgette',           'White/Blue',  'Girls',  'All Season',  90.00, 5.00, 0.00,  94.50,  'One Size',          true),
('Girls Blazer - Navy Blue',        2, 18, 'GBL-NVY-001', 'Girls fitted navy blazer with school monogram.',                                   'Wool Blend',          'Navy Blue',   'Girls',  'Winter',     820.00, 12.00,5.00, 869.88,  'XS,S,M,L,XL,XXL', true),
('Girls Sweater - Navy Blue',       2, 17, 'GSW-NVY-001', 'Round-neck woolen sweater for girls.',                                             'Acrylic Wool',        'Navy Blue',   'Girls',  'Winter',     420.00, 5.00, 0.00, 441.00,  'XS,S,M,L,XL,XXL', true),
('Girls School Tie',                2, 16, 'GTI-STR-001', 'Girls school tie, same pattern as boys, clip-on.',                                 'Polyester',           'Blue/Yellow', 'Girls',  'All Season', 120.00, 5.00, 0.00, 126.00,  'One Size',          true),
('Girls Sports Tracksuit',          2, 21, 'GST-BLU-001', 'Girls sports tracksuit, navy and white.',                                           'Polyester Dry-fit',   'Navy/White',  'Girls',  'All Season', 380.00, 5.00,10.00, 360.45,  'XS,S,M,L,XL,XXL', true),
('Girls School Shoes - Black',      2, 20, 'GSH-BLK-001', 'Black synthetic leather school shoes for girls.',                                   'Synthetic Leather',   'Black',       'Girls',  'All Season', 580.00, 5.00, 5.00, 578.25,  '1,2,3,4,5,6,7,8',  true),
('Girls School Socks - White',      2, 19, 'GSO-WHT-001', 'White ankle socks for girls, pack of 3 pairs.',                                     'Cotton',              'White',       'Girls',  'All Season',  70.00, 5.00, 0.00,  73.50,  'S (5-8),M (9-11)',  true),

-- Unisex
('Unisex House T-Shirt - Red',      3, 25, 'UHT-RED-001', 'House activity red T-shirt, crew neck, breathable.',                               'Cotton Pique',        'Red',         'Unisex', 'All Season', 180.00, 5.00, 0.00, 189.00,  'XS,S,M,L,XL,XXL', true),
('Unisex House T-Shirt - Yellow',   3, 25, 'UHT-YLW-001', 'House activity yellow T-shirt.',                                                   'Cotton Pique',        'Yellow',      'Unisex', 'All Season', 180.00, 5.00, 0.00, 189.00,  'XS,S,M,L,XL,XXL', true),
('Unisex PT Shorts',                3, 26, 'UPS-BLK-001', 'Black PT shorts with white stripe, elasticated waist.',                            'Polyester',           'Black/White', 'Unisex', 'All Season', 160.00, 5.00, 0.00, 168.00,  'XS,S,M,L,XL,XXL', true),
('Unisex Winter Jacket',            3, 32, 'UWJ-NVY-001', 'Navy blue padded winter jacket with school logo.',                                 'Nylon Padded',        'Navy Blue',   'Unisex', 'Winter',    1200.00, 12.00,8.00, 1225.92, 'XS,S,M,L,XL,XXL', true),

-- Accessories
('School ID Card Holder',           4, 35, 'AID-YLW-001', 'Yellow lanyard with transparent ID card holder.',                                  'Nylon/PVC',           'Yellow',      'Unisex', 'All Season',  45.00, 18.00,0.00,  53.10,  'One Size',          true),
('School Bag - Navy Blue',          4, 36, 'ABG-NVY-001', '18L school backpack, navy blue with multiple compartments, ergonomic straps.',     'Polyester 600D',      'Navy Blue',   'Unisex', 'All Season', 750.00, 18.00,5.00, 839.25,  'One Size',          true),
('School Belt - Brown',             4, 33, 'ABL-BRN-001', 'Brown genuine leather belt, adjustable, school logo buckle.',                      'Leather',             'Brown',       'Unisex', 'All Season',  90.00, 5.00, 0.00,  94.50,  'S,M,L,XL',          true),
('House Tie - Blue',                4, 34, 'ATI-BLU-001', 'Blue house color tie for special assemblies.',                                      'Polyester',           'Blue',        'Unisex', 'All Season', 110.00, 5.00, 0.00, 115.50,  'One Size',          false);

-- ─── Product Variants ────────────────────────────────────────────────────────
-- Boys shirt variants
INSERT INTO product_variants (product_id, size, color, price, stock, active)
SELECT id, v.size, 'White', base_price, 100, true
FROM products, (VALUES ('XS'),('S'),('M'),('L'),('XL'),('XXL')) AS v(size)
WHERE sku = 'BSH-WHT-001';

-- Boys trousers variants
INSERT INTO product_variants (product_id, size, color, price, stock, active)
SELECT id, v.size, 'Grey', base_price, 80, true
FROM products, (VALUES ('24'),('26'),('28'),('30'),('32'),('34')) AS v(size)
WHERE sku = 'BTR-GRY-001';

-- ─── Orders ──────────────────────────────────────────────────────────────────
-- Order 1: Green Valley — DELIVERED
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (1, 'GVPS001TOKEN01', 'ORD-20260110-GVPS01', 'DELIVERED', 186750.00, 9337.50, 196087.50, 100000.00, 96087.50, 'PARTIAL',
        'Annual order for 2026-27 session', '2026-01-10 10:00:00', '2026-01-08 09:00:00', '2026-01-20 16:00:00');

-- Order 2: St Mary's — DISPATCHED
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (2, 'SMCS002TOKEN01', 'ORD-20260205-SMCS01', 'DISPATCHED', 142500.00, 7125.00, 149625.00, 75000.00, 74625.00, 'PARTIAL',
        'New session order — urgent delivery', '2026-02-05 11:30:00', '2026-02-03 09:00:00', '2026-03-01 14:00:00');

-- Order 3: Delhi Public School — PACKING
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (3, 'DPSN003TOKEN01', 'ORD-20260301-DPSN01', 'PACKING', 98400.00, 4920.00, 103320.00, 50000.00, 53320.00, 'PARTIAL',
        'Standard session order', '2026-03-01 09:15:00', '2026-02-28 08:00:00', '2026-04-10 11:00:00');

-- Order 4: KV Hyderabad — STITCHING
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (4, 'KVH1004TOKEN01', 'ORD-20260315-KVH101', 'STITCHING', 76200.00, 3810.00, 80010.00, 40000.00, 40010.00, 'PARTIAL',
        'Mid-session replacement order', '2026-03-15 10:00:00', '2026-03-14 09:00:00', '2026-04-20 10:00:00');

-- Order 5: Bal Bharati — CUTTING
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (5, 'BBPS005TOKEN01', 'ORD-20260401-BBPS01', 'CUTTING', 121800.00, 6090.00, 127890.00, 60000.00, 67890.00, 'PARTIAL',
        'Full school order all grades', '2026-04-01 09:00:00', '2026-03-30 08:00:00', '2026-04-25 09:00:00');

-- Order 6: Podar International — APPROVED
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (7, 'PISM007TOKEN01', 'ORD-20260501-PISM01', 'APPROVED', 94500.00, 4725.00, 99225.00, 0.00, 99225.00, 'PENDING',
        'New academic year order', '2026-05-01 11:00:00', '2026-04-29 09:00:00', '2026-05-03 10:00:00');

-- Order 7: Heritage School — SUBMITTED
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at)
VALUES (8, 'THSK008TOKEN01', 'ORD-20260510-THSK01', 'SUBMITTED', 67200.00, 3360.00, 70560.00, 0.00, 70560.00, 'PENDING',
        'Class 6-10 uniforms required', '2026-05-10 14:00:00', '2026-05-09 09:00:00', '2026-05-10 14:00:00');

-- Order 8: Green Valley second order — DRAFT (open token for demo)
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, created_at, updated_at)
VALUES (1, 'DEMO-ORDER-TOKEN', NULL, 'DRAFT', 0, 0, 0, 0, 0, 'PENDING',
        NULL, NOW(), NOW());

-- ─── Order Items — Order 1 (Green Valley, DELIVERED) ─────────────────────────
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (1, 1,  350, 294.00,  102900.00),   -- Boys Shirt
  (1, 2,  350, 336.00,  117600.00),   -- Boys Trousers
  (1, 10, 280, 315.00,   88200.00),   -- Girls Kurta  (note: totals are illustrative)
  (1, 11, 280, 294.00,   82320.00);   -- Girls Salwar

-- Order Items — Order 2 (St Mary's, DISPATCHED)
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (2, 1,  200, 294.00,  58800.00),
  (2, 3,  200, 900.12, 180024.00),    -- Boys Blazer
  (2, 10, 160, 315.00,  50400.00),
  (2, 13, 160, 441.00,  70560.00);    -- Girls Sweater

-- Order Items — Order 3 (DPS Nagpur, PACKING)
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (3, 1,  180, 294.00,  52920.00),
  (3, 2,  180, 336.00,  60480.00),
  (3, 10, 140, 315.00,  44100.00),
  (3, 11, 140, 294.00,  41160.00);

-- Order Items — Order 4 (KV Hyderabad, STITCHING)
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (4, 7,  220, 360.45,  79299.00),   -- Boys Sports Kit
  (4, 17, 180, 360.45,  64881.00),   -- Girls Sports Tracksuit
  (4, 21, 260, 168.00,  43680.00);   -- PT Shorts

-- Order Items — Order 5 (Bal Bharati, CUTTING)
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (5, 1,  300, 294.00,  88200.00),
  (5, 2,  300, 336.00, 100800.00),
  (5, 10, 250, 315.00,  78750.00),
  (5, 11, 250, 294.00,  73500.00),
  (5, 24, 550,  53.10,  29205.00);   -- ID Card Holders

-- Order Items — Order 6 (Podar, APPROVED)
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (6, 1,  160, 294.00,  47040.00),
  (6, 10, 130, 315.00,  40950.00),
  (6, 3,  160, 900.12, 144019.20),
  (6, 13, 130, 441.00,  57330.00);

-- Order Items — Order 7 (Heritage, SUBMITTED)
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (7, 1,  120, 294.00, 35280.00),
  (7, 2,  120, 336.00, 40320.00),
  (7, 10,  95, 315.00, 29925.00),
  (7, 11,  95, 294.00, 27930.00);

-- ─── Class-wise student counts — Order 1 items ───────────────────────────────
-- Boys Shirt (order_item_id = 1)
INSERT INTO class_student_counts (order_item_id, class_name, boys_count, girls_count, total_count) VALUES
  (1,'1st',  25, 0, 25),(1,'2nd',  28, 0, 28),(1,'3rd',  30, 0, 30),
  (1,'4th',  32, 0, 32),(1,'5th',  30, 0, 30),(1,'6th',  35, 0, 35),
  (1,'7th',  33, 0, 33),(1,'8th',  32, 0, 32),(1,'9th',  30, 0, 30),
  (1,'10th', 28, 0, 28),(1,'11th', 14, 0, 14),(1,'12th', 13, 0, 13);

-- Boys Trousers (order_item_id = 2)
INSERT INTO class_student_counts (order_item_id, class_name, boys_count, girls_count, total_count) VALUES
  (2,'1st',  25, 0, 25),(2,'2nd',  28, 0, 28),(2,'3rd',  30, 0, 30),
  (2,'4th',  32, 0, 32),(2,'5th',  30, 0, 30),(2,'6th',  35, 0, 35),
  (2,'7th',  33, 0, 33),(2,'8th',  32, 0, 32),(2,'9th',  30, 0, 30),
  (2,'10th', 28, 0, 28),(2,'11th', 14, 0, 14),(2,'12th', 13, 0, 13);

-- Girls Kurta (order_item_id = 3)
INSERT INTO class_student_counts (order_item_id, class_name, boys_count, girls_count, total_count) VALUES
  (3,'1st',  0, 20, 20),(3,'2nd',  0, 22, 22),(3,'3rd',  0, 25, 25),
  (3,'4th',  0, 26, 26),(3,'5th',  0, 24, 24),(3,'6th',  0, 28, 28),
  (3,'7th',  0, 27, 27),(3,'8th',  0, 26, 26),(3,'9th',  0, 24, 24),
  (3,'10th', 0, 22, 22),(3,'11th', 0, 11, 11),(3,'12th', 0, 9,   9);

-- Girls Salwar (order_item_id = 4) — same counts as kurta
INSERT INTO class_student_counts (order_item_id, class_name, boys_count, girls_count, total_count) VALUES
  (4,'1st',  0, 20, 20),(4,'2nd',  0, 22, 22),(4,'3rd',  0, 25, 25),
  (4,'4th',  0, 26, 26),(4,'5th',  0, 24, 24),(4,'6th',  0, 28, 28),
  (4,'7th',  0, 27, 27),(4,'8th',  0, 26, 26),(4,'9th',  0, 24, 24),
  (4,'10th', 0, 22, 22),(4,'11th', 0, 11, 11),(4,'12th', 0, 9,   9);

-- ─── Production Tracking ─────────────────────────────────────────────────────
INSERT INTO production_tracking (order_id, status, notes, created_at) VALUES
  (1, 'SUBMITTED',  'Order submitted by school',               '2026-01-10 10:00:00'),
  (1, 'APPROVED',   'Reviewed and approved by Ravi Sharma',    '2026-01-11 09:30:00'),
  (1, 'CUTTING',    'Fabric cutting started at unit A',         '2026-01-13 08:00:00'),
  (1, 'STITCHING',  'Stitching in progress',                   '2026-01-17 08:00:00'),
  (1, 'PACKING',    'Quality check done, packing started',     '2026-01-22 08:00:00'),
  (1, 'DISPATCHED', 'Dispatched via Blue Dart',                '2026-01-25 10:00:00'),
  (1, 'DELIVERED',  'Delivered to school. POD collected.',     '2026-01-28 12:00:00'),

  (2, 'SUBMITTED',  'Order submitted',                         '2026-02-05 11:30:00'),
  (2, 'APPROVED',   'Approved',                                '2026-02-06 10:00:00'),
  (2, 'CUTTING',    'Cutting started',                         '2026-02-10 08:00:00'),
  (2, 'STITCHING',  'Stitching done',                          '2026-02-18 08:00:00'),
  (2, 'PACKING',    'Packed and labelled',                     '2026-02-25 08:00:00'),
  (2, 'DISPATCHED', 'Out for delivery',                        '2026-03-01 08:00:00'),

  (3, 'SUBMITTED',  'Order submitted',                         '2026-03-01 09:15:00'),
  (3, 'APPROVED',   'Approved by admin',                       '2026-03-02 10:00:00'),
  (3, 'CUTTING',    'Cutting in progress',                     '2026-03-05 08:00:00'),
  (3, 'STITCHING',  'Stitching completed',                     '2026-03-20 08:00:00'),
  (3, 'PACKING',    'Packing started',                         '2026-04-08 08:00:00'),

  (4, 'SUBMITTED',  'Order submitted',                         '2026-03-15 10:00:00'),
  (4, 'APPROVED',   'Approved',                                '2026-03-16 09:00:00'),
  (4, 'CUTTING',    'Fabric cutting done',                     '2026-03-20 08:00:00'),
  (4, 'STITCHING',  'Stitching in progress',                   '2026-04-15 08:00:00'),

  (5, 'SUBMITTED',  'Order submitted',                         '2026-04-01 09:00:00'),
  (5, 'APPROVED',   'Approved by Pooja Mehta',                 '2026-04-02 10:00:00'),
  (5, 'CUTTING',    'Cutting started',                         '2026-04-22 08:00:00'),

  (6, 'SUBMITTED',  'Order submitted',                         '2026-05-01 11:00:00'),
  (6, 'APPROVED',   'Approved',                                '2026-05-03 10:00:00'),

  (7, 'SUBMITTED',  'Order submitted by school rep',           '2026-05-10 14:00:00');

-- ─── Delivery Tracking ───────────────────────────────────────────────────────
INSERT INTO delivery_tracking (order_id, tracking_number, carrier, dispatched_at, delivered_at, notes) VALUES
  (1, 'BD789456123', 'Blue Dart',   '2026-01-25 10:00:00', '2026-01-28 12:00:00', 'Delivered in good condition. Received by Mrs. Anjali Singh.'),
  (2, 'DHL654321987','DHL Express', '2026-03-01 08:00:00', NULL,                  'In transit');

-- ─── Payments ────────────────────────────────────────────────────────────────
INSERT INTO payments (order_id, amount, payment_type, status, transaction_id, due_date, paid_at, notes) VALUES
  (1, 100000.00, 'ADVANCE', 'PAID',    'TXN20260110001', '2026-01-15', '2026-01-10 11:00:00', 'Advance payment via NEFT'),
  (1,  96087.50, 'FINAL',   'PENDING', NULL,              '2026-02-15', NULL,                  'Balance due after delivery'),

  (2,  75000.00, 'ADVANCE', 'PAID',    'TXN20260205001', '2026-02-10', '2026-02-05 12:00:00', 'Advance via RTGS'),
  (2,  74625.00, 'FINAL',   'PENDING', NULL,              '2026-03-20', NULL,                  'Balance on delivery'),

  (3,  50000.00, 'ADVANCE', 'PAID',    'TXN20260301001', '2026-03-05', '2026-03-01 10:00:00', 'Advance payment'),
  (3,  53320.00, 'FINAL',   'PENDING', NULL,              '2026-05-01', NULL,                  'Balance due'),

  (4,  40000.00, 'ADVANCE', 'PAID',    'TXN20260315001', '2026-03-20', '2026-03-15 11:00:00', 'NEFT advance'),
  (4,  40010.00, 'FINAL',   'PENDING', NULL,              '2026-05-15', NULL,                  'Balance on dispatch'),

  (5,  60000.00, 'ADVANCE', 'PAID',    'TXN20260401001', '2026-04-05', '2026-04-01 10:00:00', 'Advance paid by cheque'),
  (5,  67890.00, 'FINAL',   'PENDING', NULL,              '2026-06-01', NULL,                  'Balance on delivery');
