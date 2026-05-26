-- V9: Rename reserved-word column names in app_settings
-- 'key' and 'value' are JPQL/SQL reserved keywords that cause Hibernate query issues

ALTER TABLE app_settings RENAME COLUMN key   TO setting_key;
ALTER TABLE app_settings RENAME COLUMN value TO setting_value;
