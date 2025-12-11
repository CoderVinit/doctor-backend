-- ============================================
-- Add Unique Index on users.id for Foreign Key Support
-- ============================================

-- Add unique index on id column alone (required for foreign keys)
CREATE UNIQUE INDEX idx_users_id_unique ON users(id);

-- Now add the foreign key constraint
ALTER TABLE appointments 
  ADD CONSTRAINT fk_appointment_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify foreign key was created
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
WHERE tc.table_name = 'appointments' AND tc.constraint_type = 'FOREIGN KEY';
