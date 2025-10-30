// initDb.js
const { getPool } = require('./db.js');

async function init() {
  const pool = await getPool();
  // We'll create a Users table and simple Donor/Shelter/Volunteer tables so auth registration can link
  const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS Users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200),
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    role ENUM('donor','volunteer','shelter','admin') NOT NULL DEFAULT 'donor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS RefreshTokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(500) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS Donor (
    donor_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE,
    donor_name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    donor_type VARCHAR(50),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS Volunteer (
    volunteer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE,
    volunteer_name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(50),
    area_of_service VARCHAR(200),
    availability_status VARCHAR(50) DEFAULT 'Available',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS Shelter (
    shelter_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNIQUE,
    shelter_name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(50),
    location TEXT,
    capacity INT DEFAULT 0,
    current_occupancy INT DEFAULT 0,
    food_stock_status VARCHAR(50) DEFAULT 'Adequate',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS RequestFulfillments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    request_id VARCHAR(100) NULL,
    shelter_name VARCHAR(200) NULL,
    request_type VARCHAR(200) NULL,
    requested_quantity VARCHAR(100) NULL,
    fulfill_quantity VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS Request (
    request_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    shelter_id BIGINT NOT NULL,
    request_type VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    urgency_level VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'Open',
    description TEXT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shelter_id) REFERENCES Shelter(shelter_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS Donation (
    donation_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    donor_id BIGINT NOT NULL,
    shelter_id BIGINT NULL,
    food_type VARCHAR(200) NOT NULL,
    quantity VARCHAR(100) NOT NULL,
    expiry_date DATE NULL,
    location TEXT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES Donor(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (shelter_id) REFERENCES Shelter(shelter_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS Matches (
    match_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    donation_id BIGINT NULL,
    request_id BIGINT NULL,
    volunteer_id BIGINT NULL,
    matched_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (donation_id) REFERENCES Donation(donation_id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES Request(request_id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS VolunteerOpportunity (
    opportunity_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    shelter_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(100),
    volunteers_needed INT DEFAULT 1,
    volunteers_assigned INT DEFAULT 0,
    date_needed DATE,
    time_needed TIME,
    duration_hours DECIMAL(4,2),
    location TEXT,
    urgency_level VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shelter_id) REFERENCES Shelter(shelter_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS VolunteerAssignment (
    assignment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    opportunity_id BIGINT NOT NULL,
    volunteer_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Assigned',
    FOREIGN KEY (opportunity_id) REFERENCES VolunteerOpportunity(opportunity_id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES Volunteer(volunteer_id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (opportunity_id, volunteer_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  CREATE TABLE IF NOT EXISTS AuditLog (
    audit_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_role VARCHAR(50),
    action_type VARCHAR(100),
    record_id BIGINT,
    table_name VARCHAR(50),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  // Split the string into individual queries
  const queries = createTablesSQL
    .split(';')
    .map(q => q.trim()) // Clean up whitespace
    .filter(q => q.length > 0); // Remove any empty strings

  try {
    // Loop and run each query one by one
    for (const query of queries) {
      await pool.query(query); // 'db' is your connection pool
    }
    console.log('All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
  await pool.end();
  console.log('Database tables ensured.');
}

module.exports = init;
