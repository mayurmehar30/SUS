-- V19: Replace all seed data with exact local data snapshot

TRUNCATE TABLE
  delivery_tracking,
  payments,
  production_tracking,
  class_student_counts,
  order_items,
  orders,
  product_variants,
  product_images,
  products,
  sub_categories,
  categories,
  schools,
  vendors
RESTART IDENTITY CASCADE;

-- ─── Categories ───────────────────────────────────────────────────────────────
INSERT INTO categories (name) VALUES ('Boys'), ('Girls'), ('Unisex'), ('Accessories');

-- ─── Sub-categories (matching local: Topwear/Bottomwear + accessories) ────────
INSERT INTO sub_categories (name, category_id) VALUES
  ('Topwear',    1),
  ('Bottomwear', 1),
  ('Topwear',    2),
  ('Bottomwear', 2),
  ('Tie',        4),
  ('Belt',       4),
  ('ID Card',    4),
  ('Bag',        4),
  ('Other',      4);

-- ─── Products ─────────────────────────────────────────────────────────────────
INSERT INTO products (name, category_id, sub_category_id, sku, description, fabric_type, color, gender, season, base_price, gst_percent, discount_percent, final_price, size_options, active) VALUES
-- Boys Tops (sub_category_id = 1)
('White Full-Sleeve Formal Shirt',  1, 1, 'BT-001', 'Classic white formal shirt with pointed collar and front button placket. Made from breathable cotton, ideal for daily school wear.',          'Cotton',               'White',      'Boys',   'All Season', 350.00, 5.00, 0.00,  367.50, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Light Blue Half-Sleeve Shirt',    1, 1, 'BT-002', 'Light blue half-sleeve school shirt with chest pocket and durable stitching. A popular choice for summer uniforms across Indian schools.',  'Cotton Blend',         'Light Blue', 'Boys',   'Summer',     320.00, 5.00, 0.00,  336.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Navy Blue Polo T-Shirt',          1, 1, 'BT-003', 'Smart navy blue polo tee with ribbed collar and two-button placket. Comfortable for active school days and sports periods.',                'Cotton Pique',         'Navy Blue',  'Boys',   'All Season', 380.00, 5.00, 5.00,  379.05, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('V-Neck Woollen Sweater - Boys',   1, 1, 'BT-004', 'Warm V-neck school sweater in navy blue with the standard cut. Suitable for cold mornings and winter season wear.',                        'Wool Blend',           'Navy Blue',  'Boys',   'Winter',     750.00, 5.00, 0.00,  787.50, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Full-Zip School Blazer - Boys',   1, 1, 'BT-005', 'Formal school blazer in dark navy with brass buttons and structured fit. Standard for assembly, functions, and winter uniform.',           'Polyester Wool Blend', 'Dark Navy',  'Boys',   'Winter',    1600.00, 5.00,10.00, 1512.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
-- Boys Bottoms (sub_category_id = 2)
('Grey Formal School Trouser',      1, 2, 'BB-001', 'Classic grey formal trouser with straight cut, elasticated back waist, and reinforced pockets. Designed for durability and comfort.',     'Polyester Viscose Blend','Grey',      'Boys',   'All Season', 500.00, 5.00, 0.00,  525.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Navy Blue Formal Trouser',        1, 2, 'BB-002', 'Navy blue flat-front school trouser with side pockets and neat finish. A common uniform staple in CBSE and ICSE schools.',                'Cotton Blend',         'Navy Blue',  'Boys',   'All Season', 520.00, 5.00, 0.00,  546.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Khaki School Short',              1, 2, 'BB-003', 'Khaki half-pant short with elastic waistband and stitched hem. Widely used as summer or junior school uniform in Indian schools.',         'Cotton',               'Khaki',      'Boys',   'Summer',     280.00, 5.00, 0.00,  294.00, '4Y,6Y,8Y,10Y,12Y',     true),
('Navy Blue PT Track Pant',         1, 2, 'BB-004', 'Navy blue PT track pant with two side pockets and elastic waistband with drawstring. Standard sportswear for physical education.',        'Polyester',            'Navy Blue',  'Boys',   'All Season', 420.00, 5.00, 5.00,  418.95, '4Y,6Y,8Y,10Y,12Y,14Y', true),
-- Girls Tops (sub_category_id = 3)
('White Full-Sleeve Formal Blouse', 2, 3, 'GT-001', 'Crisp white formal blouse with Peter Pan collar and front button opening. A classic staple for girls school uniforms across India.',      'Cotton',               'White',      'Girls',  'All Season', 320.00, 5.00, 0.00,  336.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Light Blue Half-Sleeve Blouse',   2, 3, 'GT-002', 'Comfortable half-sleeve blouse in light blue with neat collar and tuck-in length. Ideal for summer school use.',                          'Cotton Blend',         'Light Blue', 'Girls',  'Summer',     300.00, 5.00, 0.00,  315.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Off-White Kurta Top',             2, 3, 'GT-003', 'Straight-cut kurta in off-white with subtle printed border. Designed for schools following traditional Indian dress codes. Fade-resistant.','Cotton',              'Off White',  'Girls',  'All Season', 450.00, 5.00, 0.00,  472.50, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('V-Neck Woollen Sweater - Girls',  2, 3, 'GT-004', 'Girls navy blue V-neck school sweater in soft wool blend, providing warmth without bulk. Standard winter uniform for junior and senior.',  'Wool Blend',           'Navy Blue',  'Girls',  'Winter',     720.00, 5.00, 0.00,  756.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Girls School Blazer',             2, 3, 'GT-005', 'Tailored school blazer for girls in dark navy with two front buttons and slim fit. Worn for functions, annual days, and formal occasions.','Polyester Wool Blend', 'Dark Navy',  'Girls',  'Winter',    1500.00, 5.00,10.00, 1417.50, '4Y,6Y,8Y,10Y,12Y,14Y', true),
-- Girls Bottoms (sub_category_id = 4)
('Grey Knife-Pleat Skirt',          2, 4, 'GB-001', 'Grey knife-pleat school skirt with elastic waistband and knee length. Standard uniform style for girls in primary and middle school.',    'Polyester Viscose Blend','Grey',      'Girls',  'All Season', 380.00, 5.00, 0.00,  399.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Navy Blue Box-Pleat Skirt',       2, 4, 'GB-002', 'Smart navy blue box-pleat skirt with concealed elastic waistband and durable hem. Widely paired with white or light blue blouses.',      'Cotton Blend',         'Navy Blue',  'Girls',  'All Season', 400.00, 5.00, 0.00,  420.00, '4Y,6Y,8Y,10Y,12Y,14Y', true),
('Navy Blue Pinafore Dress',        2, 4, 'GB-003', 'Classic sleeveless pinafore in navy blue with shoulder straps and side zip. Paired over a white blouse, a staple junior girls uniform.',  'Polyester Cotton',     'Navy Blue',  'Girls',  'All Season', 520.00, 5.00, 5.00,  518.70, '4Y,6Y,8Y,10Y,12Y',     true),
('White Salwar - Ethnic Set Bottom',2, 4, 'GB-004', 'Straight-cut white salwar with elastic waistband. Designed to pair with the kurta top for schools with traditional Indian uniform codes.', 'Cotton',               'White',      'Girls',  'All Season', 350.00, 5.00, 0.00,  367.50, '4Y,6Y,8Y,10Y,12Y,14Y', true),
-- Accessories (sub_category_ids: Tie=5, Belt=6, ID Card=7)
('Boys School Tie - Blue Stripe',   4, 5, 'ACC-TIE-BOY-001', 'Boys clip-on school tie, blue and white diagonal stripes.',                        'Polyester',  'Blue/White', 'Boys',   'All Season', 110.00, 5.00, 0.00, 115.50, 'One Size', true),
('Boys Leather Belt - Black',       4, 6, 'ACC-BLT-BOY-001', 'Black genuine leather belt for boys, silver buckle.',                              'Leather',    'Black',      'Boys',   'All Season',  95.00, 5.00, 0.00,  99.75, 'S,M,L,XL', true),
('Girls School Tie - Blue Stripe',  4, 5, 'ACC-TIE-GRL-001', 'Girls clip-on school tie, matching boys pattern.',                                 'Polyester',  'Blue/White', 'Girls',  'All Season', 110.00, 5.00, 0.00, 115.50, 'One Size', true),
('Girls Woven Belt - Navy',         4, 6, 'ACC-BLT-GRL-001', 'Navy woven belt for girls, slim profile with hook clasp.',                         'Woven Fabric','Navy Blue', 'Girls',  'All Season',  70.00, 5.00, 0.00,  73.50, 'S,M,L',    true),
('School ID Card Holder',           4, 7, 'ACC-IDC-UNI-001', 'Yellow lanyard with transparent ID card holder.',                                  'Nylon/PVC',  'Yellow',     'Unisex', 'All Season',  45.00,18.00, 0.00,  53.10, 'One Size', true),
('Canvas Belt - Navy',              4, 6, 'ACC-BLT-UNI-001', 'Navy canvas webbing belt, adjustable metal clasp.',                               'Canvas',     'Navy Blue',  'Unisex', 'All Season',  65.00, 5.00, 0.00,  68.25, 'S,M,L,XL', true);

-- ─── Schools ──────────────────────────────────────────────────────────────────
INSERT INTO schools (name, contact_person, mobile, email, address, school_code, active) VALUES
  ('My School bhandara',        'Mayur Mehar', '9876543201', 'mayur.mehar@nonstopio.com', '12, MG Road, Pune - 411001', 'SCH001',  true),
  ('Samarth Vidyalaya Lakhani', 'Mayur Mehar', '9876543201', 'mayur.mehar@nonstopio.com', '12, MG Road, Pune - 411001', 'GVPS001', true);

-- ─── Orders ───────────────────────────────────────────────────────────────────
INSERT INTO orders (school_id, order_token, order_number, status, total_amount, gst_amount, grand_total, advance_amount, remaining_amount, payment_status, notes, submitted_at, created_at, updated_at) VALUES
  (2, '3AB2B8206D8D', 'ORD-20260526-3AB2B8', 'DELIVERED', 21735.00, 1035.00, 21735.00, 0.00, 21735.00, 'PENDING',
   'CP1: Mayur Mehar | 9876543201 | mayur.mehar@nonstopio.com',
   '2026-05-26 18:46:39', '2026-05-26 18:46:39', '2026-05-26 18:46:39'),
  (1, 'D28AF7B77E53', 'ORD-20260526-D28AF7', 'SUBMITTED', 52184.00, 2484.00, 52184.00, 0.00, 52184.00, 'PENDING',
   'CP1: Mayur Mehar (Principal) | 9876543201 | mayur.mehar@nonstopio.com',
   '2026-05-26 20:19:06', '2026-05-26 20:19:06', '2026-05-26 20:19:06');

-- ─── Order Items ──────────────────────────────────────────────────────────────
-- Order 1 (school_id=2, DELIVERED): product IDs 1=BT-001, 8=BB-003, 10=GT-001, 16=GB-002
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (1, 1,  10, 367.50,  3675.00),
  (1, 8,  10, 294.00,  2940.00),
  (1, 10, 20, 336.00,  6720.00),
  (1, 16, 20, 420.00,  8400.00);

-- Order 2 (school_id=1, SUBMITTED): product IDs 1=BT-001, 8=BB-003, 10=GT-001, 16=GB-002
INSERT INTO order_items (order_id, product_id, total_quantity, unit_price, total_price) VALUES
  (2, 1,  40, 368.00, 14720.00),
  (2, 8,  40, 294.00, 11760.00),
  (2, 10, 34, 336.00, 11424.00),
  (2, 16, 34, 420.00, 14280.00);

-- ─── Class-wise Student Counts ────────────────────────────────────────────────
INSERT INTO class_student_counts (order_item_id, class_name, boys_count, girls_count, total_count) VALUES
  (1, 'Jr. KG', 10, 0,  10),
  (2, 'Jr. KG', 10, 0,  10),
  (3, 'Jr. KG',  0,20,  20),
  (4, 'Jr. KG',  0,20,  20),
  (5, '5th',    10, 0,  10),
  (5, '6th',    10, 0,  10),
  (5, '7th',    10, 0,  10),
  (5, '8th',    10, 0,  10),
  (6, '5th',    10, 0,  10),
  (6, '6th',    10, 0,  10),
  (6, '7th',    10, 0,  10),
  (6, '8th',    10, 0,  10),
  (7, '5th',     0,19,  19),
  (7, '6th',     0, 5,   5),
  (7, '7th',     0, 5,   5),
  (7, '8th',     0, 5,   5),
  (8, '5th',     0,19,  19),
  (8, '6th',     0, 5,   5),
  (8, '7th',     0, 5,   5),
  (8, '8th',     0, 5,   5);

-- ─── Production Tracking ──────────────────────────────────────────────────────
INSERT INTO production_tracking (order_id, status, notes, created_at) VALUES
  (1, 'SUBMITTED',  'Order submitted by school', '2026-05-26 18:46:39'),
  (1, 'APPROVED',   '',                          '2026-05-26 19:22:32'),
  (1, 'CUTTING',    '',                          '2026-05-26 19:22:35'),
  (1, 'STITCHING',  '',                          '2026-05-26 19:22:39'),
  (1, 'PACKING',    '',                          '2026-05-26 19:22:44'),
  (1, 'DISPATCHED', '',                          '2026-05-26 19:22:47'),
  (1, 'DELIVERED',  '',                          '2026-05-26 19:22:54'),
  (2, 'SUBMITTED',  'Order submitted by school', '2026-05-26 20:19:06');

-- ─── Vendors ──────────────────────────────────────────────────────────────────
INSERT INTO vendors (name, contact_person, phone, email, address, gst_number, active) VALUES
  ('Rathi Fabrics Pvt Ltd', 'Suresh Rathi',    '+91-9876543210', 'suresh@rathifabrics.com',     '45, Industrial Area, Surat, Gujarat 395004',                '24AABCR1234A1Z5', true),
  ('Shree Textile Mills',   'Anil Sharma',     '+91-9812345678', 'anil@shreetextile.com',       '12, Mill Road, Ahmedabad, Gujarat 380001',                  '24AADCS5678B2Z1', true),
  ('Bombay Uniform House',  'Priya Patel',     '+91-9834567890', 'priya@bombayuniform.com',     '78, Dharavi Industrial Estate, Mumbai, Maharashtra 400017', '27AABCB9012C3Z2', true),
  ('Delhi Stitch Works',    'Ramesh Gupta',    '+91-9823456789', 'ramesh@delhistitchworks.com', '33, Okhla Phase II, New Delhi 110020',                      '07AABCD3456D4Z3', true),
  ('KK Accessories Hub',    'Kavita Krishnan', '+91-9845678901', 'kavita@kkaccessories.com',    '56, MIDC Industrial Area, Pune, Maharashtra 411019',        '27AABCK7890E5Z4', true);

-- ─── Product Images (real uploaded files — must SCP uploads/ folder to EC2) ───
INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES
  (1,  '/uploads/b5c24aae727a44a39763555c71460ace.jpg',  'FRONT', 0),
  (1,  '/uploads/f43b56852a8e45dd95e4ed449c730ce5.webp', 'FRONT', 1),
  (1,  '/uploads/314c5934bc39444babe4f72537c51d9c.jfif', 'FRONT', 2),
  (1,  '/uploads/746496087b9344bb946b927b8dcb6b5e.jfif', 'FRONT', 3),
  (1,  '/uploads/41f58ea24b3f403583def8b04b71a10e.jfif', 'FRONT', 4),
  (1,  '/uploads/4de6be79b112408798f7208902737875.jfif', 'FRONT', 5),
  (1,  '/uploads/45b4074174954558a29e413c3da1a8e7.jfif', 'FRONT', 6),
  (2,  '/uploads/cb7632d34f2d4a6e9c0a86302a09f342.jpg',  'FRONT', 0),
  (3,  '/uploads/fb8dd9d686b241c5888a2c6db1c2309e.jpg',  'FRONT', 0),
  (4,  '/uploads/ec62841ae9d04d87b7d65161bf9bc756.jpg',  'FRONT', 0),
  (5,  '/uploads/b60b670ca7b347948aec5f71d3c8160e.jpg',  'FRONT', 0),
  (6,  '/uploads/3839d79f99424053aafb4da7f0c064a8.jpg',  'FRONT', 0),
  (7,  '/uploads/43411cadf74a41ff826318b5db84e5ab.jpg',  'FRONT', 0),
  (8,  '/uploads/26ffcd56f14148d5b4bac8563c9911b3.jpg',  'FRONT', 0),
  (9,  '/uploads/3c07930d0b834dbeb991ea14b37c0512.jpg',  'FRONT', 0),
  (10, '/uploads/1cb04365097f4e969481cbcf4a7702d1.jpg',  'FRONT', 0),
  (11, '/uploads/69ab1e179a28476d870aaa3a57d1eb90.jpg',  'FRONT', 0),
  (12, '/uploads/0a008f7de8f340be9ce4faff9aa96262.jpg',  'FRONT', 0),
  (13, '/uploads/efcf16275a564c5dbf3bf8cdc3446a51.jpg',  'FRONT', 0),
  (14, '/uploads/4f14778eae974d3ab1b108928e5bd50e.jpg',  'FRONT', 0),
  (15, '/uploads/ad10e148cfdd4ca4aef68720354a0b0c.jpg',  'FRONT', 0),
  (16, '/uploads/8ecb1701197b476d868e24158ac8dbf2.jpg',  'FRONT', 0),
  (17, '/uploads/999767c34a3d49ec9f585574112932ed.jpg',  'FRONT', 0),
  (18, '/uploads/3d921ff7e1be4d6aa17cdff0295eeac6.jpg',  'FRONT', 0),
  (19, 'https://placehold.co/400x400/1e3a8a/ffffff?text=School+Tie',     'FRONT', 0),
  (20, 'https://placehold.co/400x400/292524/ffffff?text=Leather+Belt',   'FRONT', 0),
  (21, 'https://placehold.co/400x400/1e3a8a/ffffff?text=School+Tie',     'FRONT', 0),
  (22, 'https://placehold.co/400x400/172554/ffffff?text=Woven+Belt',     'FRONT', 0),
  (23, 'https://placehold.co/400x400/d97706/ffffff?text=ID+Card+Holder', 'FRONT', 0),
  (24, 'https://placehold.co/400x400/1d4ed8/ffffff?text=Canvas+Belt',    'FRONT', 0);
