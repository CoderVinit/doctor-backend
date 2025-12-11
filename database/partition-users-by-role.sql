-- ============================================
-- User Table Partitioning by Role
-- ============================================
-- This script partitions the users table based on user roles
-- for better query performance and data management

-- Step 1: Backup existing data
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 2: Drop existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Create partitioned users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  image TEXT,
  address VARCHAR(255),
  gender VARCHAR(50) DEFAULT 'not specified',
  dob TIMESTAMP DEFAULT NOW(),
  phone VARCHAR(20) DEFAULT '0000000000',
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, role)  -- Include partition key in primary key
) PARTITION BY LIST (role);

-- Step 4: Create partitions for each role
CREATE TABLE users_patients PARTITION OF users
  FOR VALUES IN ('user');

CREATE TABLE users_doctors PARTITION OF users
  FOR VALUES IN ('doctor');

CREATE TABLE users_admins PARTITION OF users
  FOR VALUES IN ('admin');

-- Step 5: Add indexes on each partition
CREATE UNIQUE INDEX idx_users_patients_email ON users_patients(email);
CREATE INDEX idx_users_patients_active ON users_patients(is_active);
CREATE INDEX idx_users_patients_created ON users_patients(created_at);

CREATE UNIQUE INDEX idx_users_doctors_email ON users_doctors(email);
CREATE INDEX idx_users_doctors_active ON users_doctors(is_active);
CREATE INDEX idx_users_doctors_created ON users_doctors(created_at);

CREATE UNIQUE INDEX idx_users_admins_email ON users_admins(email);
CREATE INDEX idx_users_admins_active ON users_admins(is_active);
CREATE INDEX idx_users_admins_created ON users_admins(created_at);

-- Step 6: Restore data from backup
INSERT INTO users SELECT * FROM users_backup;

-- Step 7: Verify migration
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

-- Step 8: Re-create foreign key constraints for appointments
ALTER TABLE appointments 
  ADD CONSTRAINT fk_appointment_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 9: Drop backup table (after verification)
-- DROP TABLE users_backup;

-- ============================================
-- Query Performance Testing
-- ============================================

-- Test partition pruning
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE role = 'user';
-- Should only scan users_patients partition

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE role = 'doctor';
-- Should only scan users_doctors partition

-- ============================================
-- Monitoring Queries
-- ============================================

-- Check partition sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE tablename LIKE 'users_%'
ORDER BY bytes DESC;

-- Check row distribution across partitions
SELECT 
  tableoid::regclass AS partition_name,
  COUNT(*) AS row_count
FROM users
GROUP BY tableoid;

-- Verify unique email constraint across all partitions
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;
