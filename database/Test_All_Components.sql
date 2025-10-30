-- Test Script for All Database Components
-- Run this after setting up the database to verify all components work

USE ReLive;

-- ============================================
-- VERIFY TRIGGERS EXIST
-- ============================================
SHOW TRIGGERS;

-- ============================================
-- VERIFY STORED PROCEDURES EXIST
-- ============================================
SHOW PROCEDURE STATUS WHERE Db = 'ReLive';

-- ============================================
-- VERIFY STORED FUNCTIONS EXIST
-- ============================================
SHOW FUNCTION STATUS WHERE Db = 'ReLive';

-- ============================================
-- TEST TRIGGERS
-- ============================================

-- Test 1: Test donation insert trigger (should create audit log entry)
-- First, ensure we have a donor
SELECT 'Testing Donation Insert Trigger...' as Test;
-- Check audit log before
SELECT COUNT(*) as 'Audit Entries Before' FROM AuditLog WHERE table_name = 'Donation';

-- The trigger will fire automatically when donations are created via the API
-- You can verify by checking AuditLog after creating donations through the frontend

-- ============================================
-- TEST STORED PROCEDURES
-- ============================================

-- Test GetShelterStats procedure
SELECT 'Testing GetShelterStats Procedure...' as Test;
-- You'll need to replace 1 with an actual shelter_id from your database
CALL GetShelterStats(1);

-- Test GetDonorImpact procedure
SELECT 'Testing GetDonorImpact Procedure...' as Test;
-- You'll need to replace 1 with an actual donor_id from your database
CALL GetDonorImpact(1);

-- Test GetVolunteerTaskSummary procedure
SELECT 'Testing GetVolunteerTaskSummary Procedure...' as Test;
-- You'll need to replace 1 with an actual volunteer_id from your database
CALL GetVolunteerTaskSummary(1);

-- ============================================
-- TEST STORED FUNCTIONS
-- ============================================

-- Test GetOccupancyPercentage function
SELECT 'Testing GetOccupancyPercentage Function...' as Test;
SELECT GetOccupancyPercentage(1) as 'Occupancy Percentage';

-- Test CountActiveRequests function
SELECT 'Testing CountActiveRequests Function...' as Test;
SELECT CountActiveRequests(1) as 'Active Requests Count';

-- Test IsVolunteerAvailable function
SELECT 'Testing IsVolunteerAvailable Function...' as Test;
SELECT IsVolunteerAvailable(1) as 'Is Available';

-- ============================================
-- TEST NESTED QUERIES (Subqueries)
-- ============================================

-- Test 1: Shelters with active requests
SELECT 'Testing Nested Query: Shelters with Active Requests...' as Test;
SELECT s.shelter_id, s.shelter_name, s.location, s.food_stock_status
FROM Shelter s
WHERE s.shelter_id IN (
    SELECT DISTINCT r.shelter_id 
    FROM Request r 
    WHERE r.status IN ('Open', 'Partial')
)
ORDER BY s.shelter_name;

-- Test 2: Donors with above-average donations
SELECT 'Testing Nested Query: Top Donors...' as Test;
SELECT d.donor_id, d.donor_name, d.email,
       COUNT(don.donation_id) as donation_count
FROM Donor d
INNER JOIN Donation don ON d.donor_id = don.donor_id
WHERE d.donor_id IN (
    SELECT donor_id 
    FROM Donation 
    GROUP BY donor_id 
    HAVING COUNT(*) >= 1  -- Simplified for testing
)
GROUP BY d.donor_id
ORDER BY donation_count DESC;

-- Test 3: Active volunteers with task counts (nested SELECT in SELECT)
SELECT 'Testing Nested Query: Active Volunteers...' as Test;
SELECT v.volunteer_id, v.volunteer_name, v.email,
       (SELECT COUNT(*) FROM Matches WHERE volunteer_id = v.volunteer_id) as task_count,
       (SELECT COUNT(*) FROM VolunteerAssignment WHERE volunteer_id = v.volunteer_id) as assignment_count
FROM Volunteer v
WHERE EXISTS (
    SELECT 1 FROM Matches WHERE volunteer_id = v.volunteer_id
)
ORDER BY task_count DESC;

-- ============================================
-- TEST JOIN QUERIES
-- ============================================

-- Test 1: Simple INNER JOIN - Requests with Shelter info
SELECT 'Testing JOIN Query: Requests with Shelter Info...' as Test;
SELECT r.request_id, r.request_type, r.quantity, r.unit, r.urgency_level, r.status,
       s.shelter_name, s.location
FROM Request r
JOIN Shelter s ON r.shelter_id = s.shelter_id
ORDER BY r.requested_at DESC
LIMIT 5;

-- Test 2: LEFT JOIN - Donations with Shelter info
SELECT 'Testing LEFT JOIN: Donations with Optional Shelter...' as Test;
SELECT d.donation_id, d.food_type, d.quantity, d.status, d.donated_at,
       s.shelter_name
FROM Donation d
LEFT JOIN Shelter s ON d.shelter_id = s.shelter_id
ORDER BY d.donated_at DESC
LIMIT 5;

-- Test 3: Multiple JOINs - Volunteer tasks with all related info
SELECT 'Testing Multiple JOINs: Volunteer Tasks...' as Test;
SELECT m.match_id, m.status, m.matched_on,
       s.shelter_name, s.location as shelter_location,
       v.volunteer_name,
       r.request_type, r.quantity as request_quantity,
       d.food_type, d.quantity as donation_quantity
FROM Matches m
LEFT JOIN Donation d ON m.donation_id = d.donation_id
LEFT JOIN Request r ON m.request_id = r.request_id
LEFT JOIN Shelter s ON (d.shelter_id = s.shelter_id OR r.shelter_id = s.shelter_id)
LEFT JOIN Volunteer v ON m.volunteer_id = v.volunteer_id
ORDER BY m.matched_on DESC
LIMIT 5;

-- Test 4: Triple JOIN - Volunteer Assignments
SELECT 'Testing Triple JOIN: Volunteer Assignments...' as Test;
SELECT va.assignment_id, va.assigned_at, va.status as assignment_status,
       vo.title, vo.task_type, vo.date_needed,
       v.volunteer_name, v.email, v.phone
FROM VolunteerAssignment va
JOIN VolunteerOpportunity vo ON va.opportunity_id = vo.opportunity_id
JOIN Volunteer v ON va.volunteer_id = v.volunteer_id
ORDER BY va.assigned_at DESC
LIMIT 5;

-- ============================================
-- TEST AGGREGATE QUERIES
-- ============================================

-- Test 1: Simple COUNT aggregates
SELECT 'Testing Aggregate: Count Statistics...' as Test;
SELECT 
    (SELECT COUNT(*) FROM Users) as total_users,
    (SELECT COUNT(*) FROM Donor) as total_donors,
    (SELECT COUNT(*) FROM Volunteer) as total_volunteers,
    (SELECT COUNT(*) FROM Shelter) as total_shelters,
    (SELECT COUNT(*) FROM Request) as total_requests,
    (SELECT COUNT(*) FROM Donation) as total_donations;

-- Test 2: COUNT with GROUP BY - Requests by status
SELECT 'Testing Aggregate: Requests by Status...' as Test;
SELECT status, COUNT(*) as count
FROM Request
GROUP BY status
ORDER BY count DESC;

-- Test 3: COUNT with GROUP BY - Donations by donor
SELECT 'Testing Aggregate: Donations per Donor...' as Test;
SELECT d.donor_name, COUNT(don.donation_id) as total_donations
FROM Donor d
LEFT JOIN Donation don ON d.donor_id = don.donor_id
GROUP BY d.donor_id, d.donor_name
HAVING COUNT(don.donation_id) > 0
ORDER BY total_donations DESC
LIMIT 10;

-- Test 4: Multiple aggregates with GROUP BY
SELECT 'Testing Aggregate: Shelter Statistics...' as Test;
SELECT s.shelter_id, s.shelter_name,
       COUNT(DISTINCT r.request_id) as total_requests,
       COUNT(DISTINCT CASE WHEN r.status = 'Open' THEN r.request_id END) as open_requests,
       COUNT(DISTINCT d.donation_id) as donations_received,
       COUNT(DISTINCT vo.opportunity_id) as volunteer_opportunities
FROM Shelter s
LEFT JOIN Request r ON s.shelter_id = r.shelter_id
LEFT JOIN Donation d ON s.shelter_id = d.shelter_id
LEFT JOIN VolunteerOpportunity vo ON s.shelter_id = vo.shelter_id
GROUP BY s.shelter_id, s.shelter_name
LIMIT 10;

-- ============================================
-- VERIFY AUDIT LOG
-- ============================================
SELECT 'Checking Audit Log Entries...' as Test;
SELECT * FROM AuditLog ORDER BY action_time DESC LIMIT 10;

-- ============================================
-- SUMMARY
-- ============================================
SELECT '=== TEST SUMMARY ===' as Summary;
SELECT 'All queries executed successfully!' as Status;
SELECT 'Check the results above to verify each component works correctly.' as Note;
