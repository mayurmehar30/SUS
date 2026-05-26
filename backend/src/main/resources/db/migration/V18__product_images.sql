-- V18: Add placeholder images for all products seeded in V17

-- Boys
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Boys+Shirt',    'FRONT', 0 FROM products WHERE sku = 'BSH-WHT-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/4b5563/ffffff?text=Boys+Trousers', 'FRONT', 0 FROM products WHERE sku = 'BTR-GRY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Boys+Blazer',   'FRONT', 0 FROM products WHERE sku = 'BBL-NVY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Boys+Sweater',  'FRONT', 0 FROM products WHERE sku = 'BSW-NVY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1d4ed8/ffffff?text=Boys+Tie',      'FRONT', 0 FROM products WHERE sku = 'BTI-STR-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/292524/ffffff?text=Boys+Belt',     'FRONT', 0 FROM products WHERE sku = 'BBL-BLK-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/16a34a/ffffff?text=Boys+Sports',   'FRONT', 0 FROM products WHERE sku = 'BSK-GRN-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/f5f5f5/333333?text=Boys+Socks',    'FRONT', 0 FROM products WHERE sku = 'BSO-WHT-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1c1917/ffffff?text=Boys+Shoes',    'FRONT', 0 FROM products WHERE sku = 'BSH-BLK-001';

-- Girls
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/f0fdf4/1e3a5f?text=Girls+Kurta',   'FRONT', 0 FROM products WHERE sku = 'GKT-WHT-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Girls+Salwar',  'FRONT', 0 FROM products WHERE sku = 'GSL-NVY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/f0f9ff/1e3a5f?text=Girls+Chunni',  'FRONT', 0 FROM products WHERE sku = 'GCH-WHT-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Girls+Blazer',  'FRONT', 0 FROM products WHERE sku = 'GBL-NVY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Girls+Sweater', 'FRONT', 0 FROM products WHERE sku = 'GSW-NVY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1d4ed8/ffffff?text=Girls+Tie',     'FRONT', 0 FROM products WHERE sku = 'GTI-STR-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Girls+Sports',  'FRONT', 0 FROM products WHERE sku = 'GST-BLU-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1c1917/ffffff?text=Girls+Shoes',   'FRONT', 0 FROM products WHERE sku = 'GSH-BLK-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/f5f5f5/333333?text=Girls+Socks',   'FRONT', 0 FROM products WHERE sku = 'GSO-WHT-001';

-- Unisex
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/dc2626/ffffff?text=House+TShirt',  'FRONT', 0 FROM products WHERE sku = 'UHT-RED-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/ca8a04/ffffff?text=House+TShirt',  'FRONT', 0 FROM products WHERE sku = 'UHT-YLW-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/292524/ffffff?text=PT+Shorts',     'FRONT', 0 FROM products WHERE sku = 'UPS-BLK-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=Winter+Jacket', 'FRONT', 0 FROM products WHERE sku = 'UWJ-NVY-001';

-- Accessories
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/d97706/ffffff?text=ID+Card+Holder','FRONT', 0 FROM products WHERE sku = 'AID-YLW-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=School+Bag',    'FRONT', 0 FROM products WHERE sku = 'ABG-NVY-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/78350f/ffffff?text=School+Belt',   'FRONT', 0 FROM products WHERE sku = 'ABL-BRN-001';
INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT id, 'https://placehold.co/400x400/1d4ed8/ffffff?text=House+Tie',     'FRONT', 0 FROM products WHERE sku = 'ATI-BLU-001';
