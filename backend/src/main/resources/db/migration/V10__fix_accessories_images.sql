-- V10: Ensure accessories have correct placeholder image URLs
-- Idempotent: removes old images and resets with stable placehold.co URLs

DELETE FROM product_images
WHERE product_id IN (
    SELECT id FROM products
    WHERE sku IN ('ACC-TIE-BOY-001','ACC-BLT-BOY-001','ACC-TIE-GRL-001',
                  'ACC-BLT-GRL-001','ACC-IDC-UNI-001','ACC-BLT-UNI-001')
);

INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT p.id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=School+Tie', 'FRONT', 0
FROM products p WHERE p.sku = 'ACC-TIE-BOY-001';

INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT p.id, 'https://placehold.co/400x400/292524/ffffff?text=Leather+Belt', 'FRONT', 0
FROM products p WHERE p.sku = 'ACC-BLT-BOY-001';

INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT p.id, 'https://placehold.co/400x400/1e3a8a/ffffff?text=School+Tie', 'FRONT', 0
FROM products p WHERE p.sku = 'ACC-TIE-GRL-001';

INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT p.id, 'https://placehold.co/400x400/172554/ffffff?text=Woven+Belt', 'FRONT', 0
FROM products p WHERE p.sku = 'ACC-BLT-GRL-001';

INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT p.id, 'https://placehold.co/400x400/d97706/ffffff?text=ID+Card+Holder', 'FRONT', 0
FROM products p WHERE p.sku = 'ACC-IDC-UNI-001';

INSERT INTO product_images (product_id, image_url, image_type, sort_order)
SELECT p.id, 'https://placehold.co/400x400/1d4ed8/ffffff?text=Canvas+Belt', 'FRONT', 0
FROM products p WHERE p.sku = 'ACC-BLT-UNI-001';
