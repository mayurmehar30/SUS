-- Convert PostgreSQL custom enum columns to VARCHAR so Hibernate @Enumerated(EnumType.STRING) works
-- without type-cast issues. Enum validation is enforced at the application layer.

-- 1. Drop enum-typed defaults first
ALTER TABLE users          ALTER COLUMN role           DROP DEFAULT;
ALTER TABLE orders         ALTER COLUMN status         DROP DEFAULT;
ALTER TABLE orders         ALTER COLUMN payment_status DROP DEFAULT;
ALTER TABLE payments       ALTER COLUMN status         DROP DEFAULT;
ALTER TABLE product_images ALTER COLUMN image_type     DROP DEFAULT;

-- 2. Convert columns to VARCHAR
ALTER TABLE users
    ALTER COLUMN role TYPE VARCHAR(50) USING role::text;

ALTER TABLE orders
    ALTER COLUMN status         TYPE VARCHAR(50) USING status::text,
    ALTER COLUMN payment_status TYPE VARCHAR(50) USING payment_status::text;

ALTER TABLE payments
    ALTER COLUMN payment_type TYPE VARCHAR(50) USING payment_type::text,
    ALTER COLUMN status       TYPE VARCHAR(50) USING status::text;

ALTER TABLE product_images
    ALTER COLUMN image_type TYPE VARCHAR(50) USING image_type::text;

ALTER TABLE production_tracking
    ALTER COLUMN status TYPE VARCHAR(50) USING status::text;

-- 3. Restore plain-string defaults
ALTER TABLE users          ALTER COLUMN role           SET DEFAULT 'SALESMAN';
ALTER TABLE orders         ALTER COLUMN status         SET DEFAULT 'DRAFT';
ALTER TABLE orders         ALTER COLUMN payment_status SET DEFAULT 'PENDING';
ALTER TABLE payments       ALTER COLUMN status         SET DEFAULT 'PENDING';
ALTER TABLE product_images ALTER COLUMN image_type     SET DEFAULT 'FRONT';

-- 4. Drop the now-unused enum types
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS payment_type;
DROP TYPE IF EXISTS product_image_type;
