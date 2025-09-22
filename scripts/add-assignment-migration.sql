-- Migration script to add assigned_to functionality to existing database
-- Run this script if you have an existing complaints table without the assigned_to field

-- Add assigned_to column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' 
        AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE complaints 
        ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);
        
        RAISE NOTICE 'Added assigned_to column and index to complaints table';
    ELSE
        RAISE NOTICE 'assigned_to column already exists in complaints table';
    END IF;
END $$;

-- Add admin_reply column if it doesn't exist (to replace notes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'complaints' 
        AND column_name = 'admin_reply'
    ) THEN
        ALTER TABLE complaints 
        ADD COLUMN admin_reply TEXT;
        
        RAISE NOTICE 'Added admin_reply column to complaints table';
    ELSE
        RAISE NOTICE 'admin_reply column already exists in complaints table';
    END IF;
END $$;

-- Update status values to be consistent (lowercase)
UPDATE complaints 
SET status = LOWER(status) 
WHERE status IN ('Pending', 'In Progress', 'Resolved', 'Closed');

RAISE NOTICE 'Migration completed successfully!';
