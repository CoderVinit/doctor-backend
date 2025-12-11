-- ============================================
-- Add user_role column and composite foreign key
-- ============================================

-- Step 1: Add user_role column to appointments
ALTER TABLE appointments 
ADD COLUMN user_role VARCHAR(50) NOT NULL DEFAULT 'user';

-- Step 2: Update existing records with the correct role from users table
UPDATE appointments a
SET user_role = u.role
FROM users u
WHERE a.user_id = u.id;

-- Step 3: Add composite foreign key constraint
ALTER TABLE appointments 
  ADD CONSTRAINT fk_appointment_user_composite 
  FOREIGN KEY (user_id, user_role) 
  REFERENCES users(id, role) 
  ON DELETE CASCADE;

-- Step 4: Verify the constraint was created
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'appointments' AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.ordinal_position;

-- Step 5: Test the partition with a sample query
EXPLAIN ANALYZE SELECT a.*, u.email, u.first_name 
FROM appointments a
JOIN users u ON a.user_id = u.id AND a.user_role = u.role
WHERE u.role = 'user';
