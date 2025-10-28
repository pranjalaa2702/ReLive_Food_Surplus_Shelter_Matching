require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
} = process.env;

async function createRootConnection() {
  return mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });
}

// Ensure database exists. If not, create it.
async function ensureDatabase() {
  const rootConn = await createRootConnection();
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await rootConn.end();
}

// Returns a connection pool scoped to the application DB.
async function getPool() {
  await ensureDatabase();
  const pool = mysql.createPool({
    host: DB_HOST || 'localhost',
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true,
  });
  return pool;
}

module.exports = { ensureDatabase, getPool };
