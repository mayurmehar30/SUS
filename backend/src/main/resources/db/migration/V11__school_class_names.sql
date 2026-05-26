ALTER TABLE schools ADD COLUMN IF NOT EXISTS class_names TEXT DEFAULT 'Nursery,Jr. KG,Sr. KG,1st,2nd,3rd,4th,5th,6th,7th,8th,9th,10th';
UPDATE schools SET class_names = 'Nursery,Jr. KG,Sr. KG,1st,2nd,3rd,4th,5th,6th,7th,8th,9th,10th' WHERE class_names IS NULL;
