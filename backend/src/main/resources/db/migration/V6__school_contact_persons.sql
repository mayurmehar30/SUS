-- V6: Add two contact person fields (name, role, mobile, email) to schools

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS contact_person_role    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_person_2_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_person_2_role  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_person_2_mobile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_person_2_email  VARCHAR(255);
