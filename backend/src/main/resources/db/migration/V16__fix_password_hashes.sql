-- Fix password hashes: all users → Admin@123
UPDATE users SET password = '$2a$10$7awKl.R6APO0D49VMBWcCuzwMwZqAG11dHoizIw80BKKZ8pxL..Pi';
