CREATE DATABASE Relive;
use ReLive;

CREATE TABLE Donor (
    donor_id SERIAL PRIMARY KEY,
    donor_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    donor_type VARCHAR(50) CHECK (donor_type IN ('Individual', 'Organization')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Shelter (
    shelter_id SERIAL PRIMARY KEY,
    shelter_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    location TEXT NOT NULL,
    capacity INT CHECK (capacity >= 0),
    current_occupancy INT DEFAULT 0,
    food_stock_status VARCHAR(50) DEFAULT 'Adequate',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Volunteer (
    volunteer_id SERIAL PRIMARY KEY,
    volunteer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    area_of_service VARCHAR(100),
    availability_status VARCHAR(20) DEFAULT 'Available',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Donation (
    donation_id SERIAL PRIMARY KEY,
    donor_id INT REFERENCES Donor(donor_id) ON DELETE CASCADE,
    food_type VARCHAR(100) NOT NULL,
    quantity INT CHECK (quantity > 0),
    expiry_date DATE,
    location TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Recipient (
    recipient_id SERIAL PRIMARY KEY,
    recipient_name VARCHAR(100) NOT NULL,
    age INT CHECK (age > 0),
    gender VARCHAR(10),
    shelter_id INT REFERENCES Shelter(shelter_id) ON DELETE SET NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Request (
    request_id SERIAL PRIMARY KEY,
    shelter_id INT REFERENCES Shelter(shelter_id) ON DELETE CASCADE,
    request_type VARCHAR(100) NOT NULL, -- e.g., Food, Clothing, Medical
    quantity_needed INT CHECK (quantity_needed > 0),
    urgency_level VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'Open',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Matches (
    match_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donation_id BIGINT UNSIGNED,
    request_id BIGINT UNSIGNED,
    volunteer_id BIGINT UNSIGNED,
    matched_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'In Progress',

    FOREIGN KEY (donation_id) REFERENCES Donation(donation_id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES Request(request_id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE SET NULL
);

CREATE TABLE AuditLog (
    audit_id SERIAL PRIMARY KEY,
    user_role VARCHAR(50),
    action_type VARCHAR(100),
    record_id INT,
    table_name VARCHAR(50),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

