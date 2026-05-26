-- V20: Re-insert users wiped by V17/V19 TRUNCATE schools CASCADE.
-- users.school_id references schools(id), so truncating schools cascades to users.
-- Hash below is BCrypt for "Admin@123".

INSERT INTO users (name, email, password, role, school_id, active)
VALUES
  ('Super Admin',   'admin@sus.com',  '$2a$10$7awKl.R6APO0D49VMBWcCuzwMwZqAG11dHoizIw80BKKZ8pxL..Pi', 'SUPER_ADMIN',      NULL, true),
  ('Ravi Sharma',   'ravi@sus.com',   '$2a$10$7awKl.R6APO0D49VMBWcCuzwMwZqAG11dHoizIw80BKKZ8pxL..Pi', 'SALESMAN',         NULL, true),
  ('Pooja Mehta',   'pooja@sus.com',  '$2a$10$7awKl.R6APO0D49VMBWcCuzwMwZqAG11dHoizIw80BKKZ8pxL..Pi', 'SALESMAN',         NULL, true),
  ('Suresh Kumar',  'suresh@sus.com', '$2a$10$7awKl.R6APO0D49VMBWcCuzwMwZqAG11dHoizIw80BKKZ8pxL..Pi', 'FACTORY_MANAGER',  NULL, true)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  active   = EXCLUDED.active;
