-- ============================================
-- Fix Partition Migration - Data Restoration and Foreign Keys
-- ============================================

-- Step 1: Restore data from backup with explicit column mapping
INSERT INTO users (id, email, password, first_name, last_name, image, address, gender, dob, phone, role, is_active, created_at, updated_at)
SELECT id, email, password, first_name, last_name, image, address, gender, dob, phone, role, is_active, created_at, updated_at 
FROM users_backup;

-- Step 2: Verify data was distributed correctly across partitions
SELECT 
  'users_patients' as partition,
  COUNT(*) as count 
FROM users_patients
UNION ALL
SELECT 
  'users_doctors' as partition,
  COUNT(*) as count 
FROM users_doctors
UNION ALL
SELECT 
  'users_admins' as partition,
  COUNT(*) as count 
FROM users_admins;

-- Step 3: Re-create foreign key constraints for appointments
-- Foreign keys reference just the id column (not composite key)
ALTER TABLE appointments 
  ADD CONSTRAINT fk_appointment_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 4: Verify partitioning is working (should show partition pruning)
EXPLAIN ANALYZE SELECT * FROM users WHERE role = 'user';
EXPLAIN ANALYZE SELECT * FROM users WHERE role = 'doctor';

-- Step 5: Show all data
SELECT 
  role,
  email,
  first_name,
  last_name
FROM users
ORDER BY role, email;
