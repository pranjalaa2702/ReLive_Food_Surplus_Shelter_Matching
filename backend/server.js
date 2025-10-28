require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const initDb = require('./initDb.js');
const { getPool } = require('./db.js');
const { register, login, refresh, logout } = require('./authController.js');
const { authenticate, authorize } = require('./authMiddleware.js');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors());

// initialize DB and tables, then start server
(async () => {
  try {
    await initDb(); // ensures DB and tables
    const PORT = process.env.PORT || 5000;

    // health
    app.get('/api/health', (req, res) => res.json({ ok: true }));

    // auth
    app.post('/api/auth/register', register);
    app.post('/api/auth/login', login);
    app.post('/api/auth/refresh', refresh);
    app.post('/api/auth/logout', logout);

    // example protected route
    app.get('/api/me', authenticate, async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT user_id, name, email, role FROM Users WHERE user_id = ?',
          [req.user.id]
        );
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const user = rows[0];
        res.json({ user });
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Role-based API endpoints
    // Admin-only endpoints
    app.get('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT user_id, name, email, role, created_at FROM Users ORDER BY created_at DESC');
        res.json({ users: rows });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/admin/stats', authenticate, authorize(['admin']), async (req, res) => {
      try {
        const pool = await getPool();
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM Users');
        const [donorCount] = await pool.query('SELECT COUNT(*) as count FROM Donor');
        const [volunteerCount] = await pool.query('SELECT COUNT(*) as count FROM Volunteer');
        const [shelterCount] = await pool.query('SELECT COUNT(*) as count FROM Shelter');
        
        res.json({
          totalUsers: userCount[0].count,
          totalDonors: donorCount[0].count,
          totalVolunteers: volunteerCount[0].count,
          totalShelters: shelterCount[0].count,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Donor-specific endpoints
    app.get('/api/donor/donations', authenticate, authorize(['donor']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT d.*, s.shelter_name FROM Donation d LEFT JOIN Shelter s ON d.shelter_id = s.shelter_id WHERE d.donor_id = ? ORDER BY d.donated_at DESC',
          [req.user.id]
        );
        res.json({ donations: rows });
      } catch (error) {
        console.error('Error fetching donor donations:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Volunteer-specific endpoints
    app.get('/api/volunteer/tasks', authenticate, authorize(['volunteer']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT * FROM Matches WHERE volunteer_id = ? ORDER BY matched_on DESC',
          [req.user.id]
        );
        res.json({ tasks: rows });
      } catch (error) {
        console.error('Error fetching volunteer tasks:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Shelter-specific endpoints
    app.get('/api/shelter/requests', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT * FROM Request WHERE shelter_id = ? ORDER BY requested_at DESC',
          [req.user.id]
        );
        res.json({ requests: rows });
      } catch (error) {
        console.error('Error fetching shelter requests:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Recipient-specific endpoints
    app.get('/api/recipient/shelters', authenticate, authorize(['recipient']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT shelter_id, shelter_name, location, capacity, current_occupancy FROM Shelter WHERE current_occupancy < capacity ORDER BY location'
        );
        res.json({ shelters: rows });
      } catch (error) {
        console.error('Error fetching shelters for recipient:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
