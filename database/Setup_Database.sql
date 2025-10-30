-- Quick Setup Script for All Database Components
-- Run this after creating the ReLive database

-- Step 1: Use the database
USE ReLive;

-- Step 2: Verify all tables exist
SELECT 'Checking tables...' as Step;
SHOW TABLES;

-- Step 3: Check if AuditLog table exists
SELECT 'Checking for AuditLog table...' as Step;
SELECT COUNT(*) as 'AuditLog exists' 
FROM information_schema.tables 
WHERE table_schema = 'ReLive' 
AND table_name = 'AuditLog';

-- If AuditLog doesn't exist, create it
CREATE TABLE IF NOT EXISTS AuditLog (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_role VARCHAR(50),
    action_type VARCHAR(100),
    record_id BIGINT,
    table_name VARCHAR(50),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 4: Drop existing triggers if any (to avoid errors on re-run)
SELECT 'Dropping existing triggers (if any)...' as Step;
DROP TRIGGER IF EXISTS after_donation_insert;
DROP TRIGGER IF EXISTS after_request_insert;
DROP TRIGGER IF EXISTS before_shelter_occupancy_update;
DROP TRIGGER IF EXISTS after_request_update;
DROP TRIGGER IF EXISTS before_volunteer_opportunity_update;

-- Step 5: Drop existing procedures if any
SELECT 'Dropping existing procedures (if any)...' as Step;
DROP PROCEDURE IF EXISTS GetShelterStats;
DROP PROCEDURE IF EXISTS MatchDonationToRequest;
DROP PROCEDURE IF EXISTS GetDonorImpact;
DROP PROCEDURE IF EXISTS GetVolunteerTaskSummary;
DROP PROCEDURE IF EXISTS UpdateRequestQuantity;

-- Step 6: Drop existing functions if any
SELECT 'Dropping existing functions (if any)...' as Step;
DROP FUNCTION IF EXISTS GetOccupancyPercentage;
DROP FUNCTION IF EXISTS CountActiveRequests;
DROP FUNCTION IF EXISTS IsVolunteerAvailable;

-- Step 7: Verify cleanup
SELECT 'Cleanup complete. Ready to install triggers, procedures, and functions.' as Status;
SELECT 'Now run: source Triggers_and_Procedures.sql' as NextStep;
SELECT 'Or execute the Triggers_and_Procedures.sql file in your MySQL client.' as Alternative;
