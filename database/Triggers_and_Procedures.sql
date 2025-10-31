-- Triggers and Stored Procedures for ReLive Database
USE ReLive;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger 1: Audit log trigger for new donations
DELIMITER //
CREATE TRIGGER after_donation_insert
AFTER INSERT ON Donation
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (user_role, action_type, record_id, table_name, description)
    VALUES ('donor', 'INSERT', NEW.donation_id, 'Donation', 
            CONCAT('New donation created: ', NEW.food_type, ' (', NEW.quantity, ')'));
END//
DELIMITER ;

-- Trigger 2: Audit log trigger for new requests
DELIMITER //
CREATE TRIGGER after_request_insert
AFTER INSERT ON Request
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (user_role, action_type, record_id, table_name, description)
    VALUES ('shelter', 'INSERT', NEW.request_id, 'Request', 
            CONCAT('New request created: ', NEW.request_type, ' (', NEW.quantity, ' ', NEW.unit, ')'));
END//
DELIMITER ;

-- Trigger 3: Update shelter occupancy validation
DELIMITER //
CREATE TRIGGER before_shelter_occupancy_update
BEFORE UPDATE ON Shelter
FOR EACH ROW
BEGIN
    IF NEW.current_occupancy > NEW.capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Current occupancy cannot exceed shelter capacity';
    END IF;
    
    IF NEW.current_occupancy < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Current occupancy cannot be negative';
    END IF;
END//
DELIMITER ;

-- Trigger 4: Audit log for request status updates
DELIMITER //
CREATE TRIGGER after_request_update
AFTER UPDATE ON Request
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO AuditLog (user_role, action_type, record_id, table_name, description)
        VALUES ('system', 'UPDATE', NEW.request_id, 'Request', 
                CONCAT('Request status changed from ', OLD.status, ' to ', NEW.status));
    END IF;
END//
DELIMITER ;

-- Trigger 5: Validate volunteer opportunity assignment count
DELIMITER //
CREATE TRIGGER before_volunteer_opportunity_update
BEFORE UPDATE ON VolunteerOpportunity
FOR EACH ROW
BEGIN
    IF NEW.volunteers_assigned > NEW.volunteers_needed THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assigned volunteers cannot exceed needed volunteers';
    END IF;
    
    IF NEW.volunteers_assigned < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Assigned volunteers cannot be negative';
    END IF;
END//
DELIMITER ;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure 1: Get shelter statistics
DELIMITER //
CREATE PROCEDURE GetShelterStats(IN shelter_id_param BIGINT)
BEGIN
    SELECT 
        s.shelter_id,
        s.shelter_name,
        s.capacity,
        s.current_occupancy,
        s.food_stock_status,
        COUNT(DISTINCT r.request_id) as total_requests,
        COUNT(DISTINCT CASE WHEN r.status = 'Open' THEN r.request_id END) as open_requests,
        COUNT(DISTINCT d.donation_id) as total_donations_received,
        COUNT(DISTINCT vo.opportunity_id) as volunteer_opportunities_created
    FROM Shelter s
    LEFT JOIN Request r ON s.shelter_id = r.shelter_id
    LEFT JOIN Donation d ON s.shelter_id = d.shelter_id
    LEFT JOIN VolunteerOpportunity vo ON s.shelter_id = vo.shelter_id
    WHERE s.shelter_id = shelter_id_param
    GROUP BY s.shelter_id;
END//
DELIMITER ;

-- Procedure 2: Match donations to requests
DELIMITER //
CREATE PROCEDURE MatchDonationToRequest(
    IN donation_id_param BIGINT,
    IN request_id_param BIGINT,
    IN volunteer_id_param BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error matching donation to request';
    END;
    
    START TRANSACTION;
    
    -- Create the match
    INSERT INTO Matches (donation_id, request_id, volunteer_id, status)
    VALUES (donation_id_param, request_id_param, volunteer_id_param, 'In Progress');
    
    -- Update donation status
    UPDATE Donation 
    SET status = 'Matched' 
    WHERE donation_id = donation_id_param;
    
    -- Update request status
    UPDATE Request 
    SET status = 'Matched' 
    WHERE request_id = request_id_param;
    
    COMMIT;
END//
DELIMITER ;

-- Procedure 3: Get donor impact summary
DELIMITER //
CREATE PROCEDURE GetDonorImpact(IN donor_id_param BIGINT)
BEGIN
    SELECT 
        d.donor_id,
        d.donor_name,
        COUNT(DISTINCT don.donation_id) as total_donations,
        COUNT(DISTINCT CASE WHEN don.status = 'Completed' THEN don.donation_id END) as completed_donations,
        COUNT(DISTINCT m.match_id) as total_matches,
        COUNT(DISTINCT don.shelter_id) as shelters_helped
    FROM Donor d
    LEFT JOIN Donation don ON d.donor_id = don.donor_id
    LEFT JOIN Matches m ON don.donation_id = m.donation_id
    WHERE d.donor_id = donor_id_param
    GROUP BY d.donor_id;
END//
DELIMITER ;

-- Procedure 4: Get volunteer task summary
DELIMITER //
CREATE PROCEDURE GetVolunteerTaskSummary(IN volunteer_id_param BIGINT)
BEGIN
    SELECT 
        v.volunteer_id,
        v.volunteer_name,
        v.area_of_service,
        COUNT(DISTINCT m.match_id) as total_matches,
        COUNT(DISTINCT va.assignment_id) as total_assignments,
        COUNT(DISTINCT CASE WHEN m.status = 'Completed' THEN m.match_id END) as completed_matches,
        COUNT(DISTINCT CASE WHEN va.status = 'Assigned' THEN va.assignment_id END) as active_assignments
    FROM Volunteer v
    LEFT JOIN Matches m ON v.volunteer_id = m.volunteer_id
    LEFT JOIN VolunteerAssignment va ON v.volunteer_id = va.volunteer_id
    WHERE v.volunteer_id = volunteer_id_param
    GROUP BY v.volunteer_id;
END//
DELIMITER ;

-- Procedure 5: Update request quantity after partial fulfillment
DELIMITER //
CREATE PROCEDURE UpdateRequestQuantity(
    IN request_id_param BIGINT,
    IN fulfilled_quantity DECIMAL(10,2)
)
BEGIN
    DECLARE current_quantity DECIMAL(10,2);
    DECLARE new_quantity DECIMAL(10,2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error updating request quantity';
    END;
    
    START TRANSACTION;
    
    -- Get current quantity
    SELECT quantity INTO current_quantity
    FROM Request
    WHERE request_id = request_id_param;
    
    -- Calculate new quantity
    SET new_quantity = current_quantity - fulfilled_quantity;
    
    IF new_quantity <= 0 THEN
        -- Request fully fulfilled
        UPDATE Request
        SET quantity = 0, status = 'Fulfilled'
        WHERE request_id = request_id_param;
    ELSE
        -- Request partially fulfilled
        UPDATE Request
        SET quantity = new_quantity, status = 'Partial'
        WHERE request_id = request_id_param;
    END IF;
    
    COMMIT;
END//
DELIMITER ;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function 1: Calculate shelter occupancy percentage
DELIMITER //
CREATE FUNCTION GetOccupancyPercentage(shelter_id_param BIGINT)
RETURNS DECIMAL(5,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE occupancy INT;
    DECLARE capacity INT;
    DECLARE percentage DECIMAL(5,2);
    
    SELECT current_occupancy, capacity
    INTO occupancy, capacity
    FROM Shelter
    WHERE shelter_id = shelter_id_param;
    
    IF capacity = 0 THEN
        RETURN 0;
    END IF;
    
    SET percentage = (occupancy / capacity) * 100;
    RETURN percentage;
END//
DELIMITER ;

-- Function 2: Count active requests for a shelter
DELIMITER //
CREATE FUNCTION CountActiveRequests(shelter_id_param BIGINT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE request_count INT;
    
    SELECT COUNT(*)
    INTO request_count
    FROM Request
    WHERE shelter_id = shelter_id_param 
    AND status IN ('Open', 'Partial');
    
    RETURN request_count;
END//
DELIMITER ;

-- Function 3: Check if volunteer is available
DELIMITER //
CREATE FUNCTION IsVolunteerAvailable(volunteer_id_param BIGINT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE availability VARCHAR(20);
    
    SELECT availability_status
    INTO availability
    FROM Volunteer
    WHERE volunteer_id = volunteer_id_param;
    
    RETURN availability = 'Available';
END//
DELIMITER ;

-- ============================================
-- PROCEDURES & TRIGGERS FOR EXPIRED OPPORTUNITIES
-- ============================================

-- Procedure: Clean up expired volunteer opportunities
DELIMITER //
CREATE PROCEDURE CleanupExpiredOpportunities()
BEGIN
    -- Mark opportunities as 'Expired' if the date_needed has passed
    UPDATE VolunteerOpportunity
    SET status = 'Expired'
    WHERE status IN ('Open', 'Filled')
    AND date_needed IS NOT NULL
    AND CONCAT(date_needed, ' ', IFNULL(time_needed, '23:59:59')) < NOW();
    
    -- Optionally, delete expired opportunities older than 7 days
    DELETE FROM VolunteerOpportunity
    WHERE status = 'Expired'
    AND date_needed IS NOT NULL
    AND date_needed < DATE_SUB(CURDATE(), INTERVAL 7 DAY);
END//
DELIMITER ;

-- Procedure: Update volunteer assignment statuses to completed
DELIMITER //
CREATE PROCEDURE UpdateCompletedAssignments()
BEGIN
    -- Mark assignments as 'Completed' if the volunteer opportunity date/time has passed
    UPDATE VolunteerAssignment va
    JOIN VolunteerOpportunity vo ON va.opportunity_id = vo.opportunity_id
    SET va.status = 'Completed'
    WHERE va.status = 'Assigned'
    AND vo.date_needed IS NOT NULL
    AND CONCAT(vo.date_needed, ' ', IFNULL(vo.time_needed, '23:59:59')) < NOW();
END//
DELIMITER ;

-- Trigger: Prevent applications to expired opportunities
DELIMITER //
CREATE TRIGGER before_volunteer_assignment_insert
BEFORE INSERT ON VolunteerAssignment
FOR EACH ROW
BEGIN
    DECLARE opp_date DATE;
    DECLARE opp_time TIME;
    DECLARE opp_status VARCHAR(20);
    
    -- Get opportunity details
    SELECT date_needed, time_needed, status
    INTO opp_date, opp_time, opp_status
    FROM VolunteerOpportunity
    WHERE opportunity_id = NEW.opportunity_id;
    
    -- Check if opportunity has expired
    IF opp_date IS NOT NULL AND 
       CONCAT(opp_date, ' ', IFNULL(opp_time, '23:59:59')) < NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot apply to expired volunteer opportunity';
    END IF;
    
    -- Check if opportunity is already filled or expired
    IF opp_status IN ('Filled', 'Expired', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot apply to filled, expired, or cancelled opportunity';
    END IF;
END//
DELIMITER ;

-- Function: Check if opportunity is expired
DELIMITER //
CREATE FUNCTION IsOpportunityExpired(opportunity_id_param BIGINT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE opp_date DATE;
    DECLARE opp_time TIME;
    
    SELECT date_needed, time_needed
    INTO opp_date, opp_time
    FROM VolunteerOpportunity
    WHERE opportunity_id = opportunity_id_param;
    
    IF opp_date IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF CONCAT(opp_date, ' ', IFNULL(opp_time, '23:59:59')) < NOW() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END//
DELIMITER ;
