-- Enums
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SALESMAN', 'FACTORY_MANAGER', 'SCHOOL_REP');
CREATE TYPE order_status AS ENUM ('DRAFT','SUBMITTED','APPROVED','CUTTING','STITCHING','PACKING','DISPATCHED','DELIVERED','CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING','PARTIAL','PAID');
CREATE TYPE payment_type AS ENUM ('ADVANCE','PARTIAL','FINAL');
CREATE TYPE product_image_type AS ENUM ('FRONT','BACK','FABRIC','OTHER');

-- Schools
CREATE TABLE schools (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    mobile      VARCHAR(20),
    email       VARCHAR(255),
    address     TEXT,
    school_code VARCHAR(50) UNIQUE NOT NULL,
    logo_url    VARCHAR(500),
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'SALESMAN',
    school_id   BIGINT REFERENCES schools(id),
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id     BIGSERIAL PRIMARY KEY,
    name   VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true
);

-- Sub-categories
CREATE TABLE sub_categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    active      BOOLEAN DEFAULT true
);

-- Products
CREATE TABLE products (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    category_id      BIGINT REFERENCES categories(id),
    sub_category_id  BIGINT REFERENCES sub_categories(id),
    sku              VARCHAR(100) UNIQUE,
    description      TEXT,
    fabric_type      VARCHAR(100),
    color            VARCHAR(100),
    gender           VARCHAR(20),
    season           VARCHAR(50),
    base_price       DECIMAL(10,2) DEFAULT 0,
    gst_percent      DECIMAL(5,2)  DEFAULT 0,
    discount_percent DECIMAL(5,2)  DEFAULT 0,
    final_price      DECIMAL(10,2) DEFAULT 0,
    size_options     VARCHAR(255),
    active           BOOLEAN DEFAULT true,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url  VARCHAR(500) NOT NULL,
    image_type product_image_type DEFAULT 'OTHER',
    sort_order INT DEFAULT 0
);

-- Product variants
CREATE TABLE product_variants (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size       VARCHAR(20),
    color      VARCHAR(50),
    price      DECIMAL(10,2),
    stock      INT DEFAULT 0,
    active     BOOLEAN DEFAULT true
);

-- School catalogs (which products are available to which school)
CREATE TABLE school_catalogs (
    id           BIGSERIAL PRIMARY KEY,
    school_id    BIGINT NOT NULL REFERENCES schools(id),
    product_id   BIGINT NOT NULL REFERENCES products(id),
    custom_price DECIMAL(10,2),
    active       BOOLEAN DEFAULT true,
    UNIQUE(school_id, product_id)
);

-- Orders
CREATE TABLE orders (
    id               BIGSERIAL PRIMARY KEY,
    school_id        BIGINT NOT NULL REFERENCES schools(id),
    order_token      VARCHAR(100) UNIQUE NOT NULL,
    order_number     VARCHAR(50) UNIQUE,
    status           order_status DEFAULT 'DRAFT',
    total_amount     DECIMAL(12,2) DEFAULT 0,
    gst_amount       DECIMAL(12,2) DEFAULT 0,
    grand_total      DECIMAL(12,2) DEFAULT 0,
    advance_amount   DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) DEFAULT 0,
    payment_status   payment_status DEFAULT 'PENDING',
    notes            TEXT,
    submitted_at     TIMESTAMP,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id                 BIGSERIAL PRIMARY KEY,
    order_id           BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id         BIGINT NOT NULL REFERENCES products(id),
    product_variant_id BIGINT REFERENCES product_variants(id),
    total_quantity     INT DEFAULT 0,
    unit_price         DECIMAL(10,2),
    total_price        DECIMAL(12,2),
    notes              TEXT
);

-- Class-wise student counts per order item
CREATE TABLE class_student_counts (
    id            BIGSERIAL PRIMARY KEY,
    order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    class_name    VARCHAR(50) NOT NULL,
    boys_count    INT DEFAULT 0,
    girls_count   INT DEFAULT 0,
    total_count   INT DEFAULT 0,
    remarks       TEXT
);

-- Payments
CREATE TABLE payments (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT NOT NULL REFERENCES orders(id),
    amount         DECIMAL(12,2) NOT NULL,
    payment_type   payment_type NOT NULL,
    status         payment_status DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    due_date       DATE,
    paid_at        TIMESTAMP,
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- Production tracking history
CREATE TABLE production_tracking (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT NOT NULL REFERENCES orders(id),
    status     order_status NOT NULL,
    notes      TEXT,
    updated_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Delivery tracking
CREATE TABLE delivery_tracking (
    id             BIGSERIAL PRIMARY KEY,
    order_id       BIGINT NOT NULL REFERENCES orders(id) UNIQUE,
    tracking_number VARCHAR(255),
    carrier        VARCHAR(100),
    dispatched_at  TIMESTAMP,
    delivered_at   TIMESTAMP,
    notes          TEXT
);

-- ─── Seed data ───────────────────────────────────────────────────────────────

INSERT INTO categories (name) VALUES ('Boys'),('Girls'),('Unisex'),('Accessories');

INSERT INTO sub_categories (name, category_id) VALUES
  ('Top',1),('Bottom',1),('Tie',1),('Belt',1),('Sweater',1),('Blazer',1),
  ('Socks',1),('Shoes',1),('Sports Wear',1),('Winter Wear',1),('ID Card',1),('Other',1),
  ('Top',2),('Bottom',2),('Chunni',2),('Tie',2),('Sweater',2),('Blazer',2),
  ('Socks',2),('Shoes',2),('Sports Wear',2),('Winter Wear',2),('ID Card',2),('Other',2),
  ('Top',3),('Bottom',3),('Sweater',3),('Blazer',3),('Socks',3),('Shoes',3),
  ('Sports Wear',3),('Winter Wear',3),
  ('Belt',4),('Tie',4),('ID Card',4),('Bag',4),('Other',4);

-- Default super admin: password = Admin@123 (BCrypt hash)
INSERT INTO users (name, email, password, role)
VALUES ('Super Admin','admin@sus.com','$2a$10$7awKl.R6APO0D49VMBWcCuzwMwZqAG11dHoizIw80BKKZ8pxL..Pi','SUPER_ADMIN');
