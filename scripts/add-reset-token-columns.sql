-- Add reset token columns to users table for password reset functionality
-- Run this script if the columns don't exist yet

-- Add reset_token column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- Add reset_token_expiry column if it doesn't exist  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('reset_token', 'reset_token_expiry');

