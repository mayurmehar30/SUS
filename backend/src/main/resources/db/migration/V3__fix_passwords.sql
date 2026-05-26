-- Fix: all user passwords reset to Admin@123
-- BCrypt hash generated with Spring BCryptPasswordEncoder strength 10
UPDATE users
SET password = '$2a$10$N7.nzpG/jgN/8g0MZLTCducZ9W56XpW7i/GE2tSPDXHIkMCLJUyfi';
