-- Create vendors table
CREATE TABLE vendors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add vendor_id column to products
ALTER TABLE products ADD COLUMN vendor_id BIGINT REFERENCES vendors(id);

-- Dummy vendor data
INSERT INTO vendors (name, contact_person, phone, email, address, gst_number) VALUES
('Rathi Fabrics Pvt Ltd',  'Suresh Rathi',    '+91-9876543210', 'suresh@rathifabrics.com',      '45, Industrial Area, Surat, Gujarat 395004',            '24AABCR1234A1Z5'),
('Shree Textile Mills',    'Anil Sharma',     '+91-9812345678', 'anil@shreetextile.com',         '12, Mill Road, Ahmedabad, Gujarat 380001',               '24AADCS5678B2Z1'),
('Bombay Uniform House',   'Priya Patel',     '+91-9834567890', 'priya@bombayuniform.com',       '78, Dharavi Industrial Estate, Mumbai, Maharashtra 400017','27AABCB9012C3Z2'),
('Delhi Stitch Works',     'Ramesh Gupta',    '+91-9823456789', 'ramesh@delhistitchworks.com',   '33, Okhla Phase II, New Delhi 110020',                  '07AABCD3456D4Z3'),
('KK Accessories Hub',     'Kavita Krishnan', '+91-9845678901', 'kavita@kkaccessories.com',      '56, MIDC Industrial Area, Pune, Maharashtra 411019',     '27AABCK7890E5Z4');

-- Assign vendors to products using a single CASE expression
UPDATE products
SET vendor_id = CASE
    WHEN category_id IN (SELECT id FROM categories WHERE name = 'Accessories')
        THEN (SELECT id FROM vendors WHERE name = 'KK Accessories Hub')
    WHEN LOWER(gender) = 'boys'
        THEN (SELECT id FROM vendors WHERE name = 'Rathi Fabrics Pvt Ltd')
    WHEN LOWER(gender) = 'girls'
        THEN (SELECT id FROM vendors WHERE name = 'Bombay Uniform House')
    WHEN LOWER(gender) = 'unisex'
        THEN (SELECT id FROM vendors WHERE name = 'Shree Textile Mills')
    ELSE (SELECT id FROM vendors WHERE name = 'Delhi Stitch Works')
END;
