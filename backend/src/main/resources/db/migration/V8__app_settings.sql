-- V8: App-wide settings table (key-value store)

CREATE TABLE app_settings (
    key   VARCHAR(100) PRIMARY KEY,
    value TEXT,
    label VARCHAR(255)
);

INSERT INTO app_settings (key, value, label) VALUES
('support_phone', '+91-9999999999', 'Support Phone Number'),
('support_email', '', 'Support Email'),
('company_name',  'Uniform Manager', 'Company / Brand Name');
