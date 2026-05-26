-- V17: Clear all seeded data so V19 can re-seed with correct local data.
-- Products/orders are intentionally omitted here; V19 handles them properly.

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
  schools
RESTART IDENTITY CASCADE;

-- Re-insert categories so FK constraints are satisfied for any future migrations.
INSERT INTO categories (name) VALUES ('Boys'), ('Girls'), ('Unisex'), ('Accessories');
