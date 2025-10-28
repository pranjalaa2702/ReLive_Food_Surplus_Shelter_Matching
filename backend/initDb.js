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
    role ENUM('donor','volunteer','shelter','recipient','admin') NOT NULL DEFAULT 'donor',
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
