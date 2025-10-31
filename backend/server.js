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

    // public lists
    app.get('/api/shelters', async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT shelter_id, shelter_name, email, phone, location, capacity, current_occupancy, food_stock_status, registered_at FROM Shelter ORDER BY registered_at DESC');
        res.json({ shelters: rows });
      } catch (e) {
        console.error('list shelters err', e);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/volunteers', async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT volunteer_id, volunteer_name, email, phone, area_of_service, availability_status, joined_at FROM Volunteer ORDER BY joined_at DESC');
        res.json({ volunteers: rows });
      } catch (e) {
        console.error('list volunteers err', e);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Requests: list and create (shelter only)
    app.get('/api/requests', async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query('SELECT r.*, s.shelter_name, s.location FROM Request r JOIN Shelter s ON r.shelter_id = s.shelter_id ORDER BY r.requested_at DESC');
        res.json({ requests: rows });
      } catch (e) {
        console.error('list requests err', e);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.post('/api/requests', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        // find shelter_id for this user
        const [sRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!sRows.length) return res.status(400).json({ error: 'Shelter profile not found' });
        const shelterId = sRows[0].shelter_id;

        const { request_type, quantity, unit, urgency_level, description } = req.body || {};
        if (!request_type || !quantity || !unit) {
          return res.status(400).json({ error: 'request_type, quantity, and unit are required' });
        }

        // Validate quantity is a number
        const numQuantity = parseFloat(quantity);
        if (isNaN(numQuantity) || numQuantity <= 0) {
          return res.status(400).json({ error: 'Quantity must be a positive number' });
        }

        await pool.query(
          'INSERT INTO Request (shelter_id, request_type, quantity, unit, urgency_level, description) VALUES (?, ?, ?, ?, ?, ?)', 
          [shelterId, request_type, numQuantity, unit, urgency_level || 'Medium', description || null]
        );
        res.status(201).json({ message: 'Request created' });
      } catch (e) {
        console.error('create request err', e);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // DELETE request endpoint (shelter can delete their own requests)
    app.delete('/api/requests/:id', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const requestId = req.params.id;

        // Get shelter_id for this user
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Verify this request belongs to this shelter
        const [requestRows] = await pool.query('SELECT * FROM Request WHERE request_id = ? AND shelter_id = ?', [requestId, shelterId]);
        if (!requestRows.length) {
          return res.status(404).json({ error: 'Request not found or access denied' });
        }

        // Delete the request
        await pool.query('DELETE FROM Request WHERE request_id = ?', [requestId]);
        res.json({ message: 'Request deleted successfully' });
      } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

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

    // NESTED QUERY 1: Get shelters with active requests (subquery in WHERE)
    app.get('/api/admin/shelters-with-requests', authenticate, authorize(['admin']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(`
          SELECT s.shelter_id, s.shelter_name, s.location, s.capacity, s.current_occupancy, s.food_stock_status
          FROM Shelter s
          WHERE s.shelter_id IN (
            SELECT DISTINCT r.shelter_id 
            FROM Request r 
            WHERE r.status IN ('Open', 'Partial')
          )
          ORDER BY s.shelter_name
        `);
        res.json({ shelters: rows });
      } catch (error) {
        console.error('Error fetching shelters with requests:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // NESTED QUERY 2: Get donors who have made donations above average quantity
    app.get('/api/admin/top-donors', authenticate, authorize(['admin']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(`
          SELECT d.donor_id, d.donor_name, d.email, d.donor_type,
                 COUNT(don.donation_id) as donation_count
          FROM Donor d
          INNER JOIN Donation don ON d.donor_id = don.donor_id
          WHERE d.donor_id IN (
            SELECT donor_id 
            FROM Donation 
            GROUP BY donor_id 
            HAVING COUNT(*) >= (
              SELECT AVG(donation_count) 
              FROM (
                SELECT COUNT(*) as donation_count 
                FROM Donation 
                GROUP BY donor_id
              ) as avg_donations
            )
          )
          GROUP BY d.donor_id
          ORDER BY donation_count DESC
        `);
        res.json({ topDonors: rows });
      } catch (error) {
        console.error('Error fetching top donors:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // NESTED QUERY 3: Get volunteers with above-average task assignments
    app.get('/api/admin/active-volunteers', authenticate, authorize(['admin']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(`
          SELECT v.volunteer_id, v.volunteer_name, v.email, v.area_of_service,
                 (SELECT COUNT(*) FROM Matches WHERE volunteer_id = v.volunteer_id) as task_count,
                 (SELECT COUNT(*) FROM VolunteerAssignment WHERE volunteer_id = v.volunteer_id) as assignment_count
          FROM Volunteer v
          WHERE v.volunteer_id IN (
            SELECT volunteer_id 
            FROM Matches 
            GROUP BY volunteer_id 
            HAVING COUNT(*) > 0
          )
          ORDER BY task_count DESC
        `);
        res.json({ activeVolunteers: rows });
      } catch (error) {
        console.error('Error fetching active volunteers:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Donor-specific endpoints
    app.get('/api/donor/info', authenticate, authorize(['donor']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT donor_id, donor_name, email, phone, address, donor_type FROM Donor WHERE user_id = ?',
          [req.user.id]
        );
        if (!rows.length) {
          return res.status(404).json({ error: 'Donor profile not found' });
        }
        res.json({ donor: rows[0] });
      } catch (error) {
        console.error('Error fetching donor info:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/donor/donations', authenticate, authorize(['donor']), async (req, res) => {
      try {
        const pool = await getPool();
        // First get the donor_id for this user
        const [donorRows] = await pool.query('SELECT donor_id FROM Donor WHERE user_id = ?', [req.user.id]);
        if (!donorRows.length) {
          return res.status(404).json({ error: 'Donor profile not found' });
        }
        const donorId = donorRows[0].donor_id;

        const [rows] = await pool.query(
          'SELECT d.*, s.shelter_name FROM Donation d LEFT JOIN Shelter s ON d.shelter_id = s.shelter_id WHERE d.donor_id = ? ORDER BY d.donated_at DESC',
          [donorId]
        );
        res.json({ donations: rows });
      } catch (error) {
        console.error('Error fetching donor donations:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // DELETE donation (donor can delete their own pending donations)
    app.delete('/api/donations/:id', authenticate, authorize(['donor']), async (req, res) => {
      try {
        const pool = await getPool();
        const donationId = req.params.id;

        // Get donor_id for this user
        const [donorRows] = await pool.query('SELECT donor_id FROM Donor WHERE user_id = ?', [req.user.id]);
        if (!donorRows.length) {
          return res.status(404).json({ error: 'Donor profile not found' });
        }
        const donorId = donorRows[0].donor_id;

        // Verify this donation belongs to this donor and is still pending
        const [donationRows] = await pool.query('SELECT * FROM Donation WHERE donation_id = ? AND donor_id = ?', [donationId, donorId]);
        if (!donationRows.length) {
          return res.status(404).json({ error: 'Donation not found or access denied' });
        }

        // Only allow deletion of pending donations
        if (donationRows[0].status !== 'Pending') {
          return res.status(400).json({ error: 'Can only delete pending donations' });
        }

        // Delete the donation (will cascade delete matches)
        await pool.query('DELETE FROM Donation WHERE donation_id = ?', [donationId]);
        res.json({ message: 'Donation deleted successfully' });
      } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Volunteer-specific endpoints
    app.get('/api/volunteer/info', authenticate, authorize(['volunteer']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT volunteer_name, email, phone, area_of_service, availability_status, joined_at FROM Volunteer WHERE user_id = ?',
          [req.user.id]
        );
        if (!rows.length) {
          return res.status(404).json({ error: 'Volunteer profile not found' });
        }
        res.json({ volunteer: rows[0] });
      } catch (error) {
        console.error('Error fetching volunteer info:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/volunteer/tasks', authenticate, authorize(['volunteer']), async (req, res) => {
      try {
        const pool = await getPool();
        // First get the volunteer_id for this user
        const [volRows] = await pool.query('SELECT volunteer_id FROM Volunteer WHERE user_id = ?', [req.user.id]);
        if (!volRows.length) {
          return res.status(404).json({ error: 'Volunteer profile not found' });
        }
        const volunteerId = volRows[0].volunteer_id;

        // Update assignment status based on date/time
        await pool.query(`
          UPDATE VolunteerAssignment va
          JOIN VolunteerOpportunity vo ON va.opportunity_id = vo.opportunity_id
          SET va.status = 'Completed'
          WHERE va.volunteer_id = ?
          AND va.status = 'Assigned'
          AND vo.date_needed IS NOT NULL
          AND CONCAT(vo.date_needed, ' ', IFNULL(vo.time_needed, '23:59:59')) < NOW()
        `, [volunteerId]);

        // Fetch volunteer assignments (from volunteer opportunities)
        const [assignments] = await pool.query(
          `SELECT 
                  va.assignment_id as match_id,
                  NULL as donation_id,
                  NULL as request_id,
                  va.assigned_at as matched_on,
                  va.status,
                  s.shelter_name,
                  s.location as shelter_location,
                  vo.title as request_food_type,
                  NULL as request_quantity,
                  vo.task_type as request_unit,
                  NULL as donation_food_type,
                  NULL as donation_quantity,
                  vo.date_needed,
                  vo.time_needed,
                  vo.duration_hours
           FROM VolunteerAssignment va
           JOIN VolunteerOpportunity vo ON va.opportunity_id = vo.opportunity_id
           JOIN Shelter s ON vo.shelter_id = s.shelter_id
           WHERE va.volunteer_id = ?
           ORDER BY va.assigned_at DESC`,
          [volunteerId]
        );

        // Fetch matches (from donation/request matching)
        const [matches] = await pool.query(
          `SELECT m.match_id, 
                  m.donation_id,
                  m.request_id,
                  m.matched_on,
                  m.status,
                  s.shelter_name, 
                  s.location as shelter_location,
                  r.request_type as request_food_type, 
                  r.quantity as request_quantity, 
                  r.unit as request_unit,
                  d.food_type as donation_food_type, 
                  d.quantity as donation_quantity,
                  NULL as date_needed,
                  NULL as time_needed,
                  NULL as duration_hours
           FROM Matches m
           LEFT JOIN Donation d ON m.donation_id = d.donation_id
           LEFT JOIN Request r ON m.request_id = r.request_id
           LEFT JOIN Shelter s ON (d.shelter_id = s.shelter_id OR r.shelter_id = s.shelter_id)
           WHERE m.volunteer_id = ?
           ORDER BY m.matched_on DESC`,
          [volunteerId]
        );

        // Combine both types of tasks
        const allTasks = [...assignments, ...matches];
        res.json({ tasks: allTasks });
      } catch (error) {
        console.error('Error fetching volunteer tasks:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Shelter-specific endpoints
    app.get('/api/shelter/info', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const [rows] = await pool.query(
          'SELECT shelter_id, shelter_name, email, phone, location, capacity, current_occupancy, food_stock_status, registered_at FROM Shelter WHERE user_id = ?',
          [req.user.id]
        );
        if (!rows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        res.json({ shelter: rows[0] });
      } catch (error) {
        console.error('Error fetching shelter info:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/shelter/requests', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        // First get the shelter_id for this user
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        const [rows] = await pool.query(
          'SELECT * FROM Request WHERE shelter_id = ? ORDER BY requested_at DESC',
          [shelterId]
        );
        res.json({ requests: rows });
      } catch (error) {
        console.error('Error fetching shelter requests:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // NESTED QUERY 4: Get available donors in the same location as shelter (for shelter)
    app.get('/api/shelter/nearby-donors', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        // First get the shelter info
        const [shelterRows] = await pool.query('SELECT shelter_id, location FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }

        const [rows] = await pool.query(`
          SELECT d.donor_id, d.donor_name, d.email, d.phone, d.address, d.donor_type,
                 COUNT(don.donation_id) as total_donations
          FROM Donor d
          LEFT JOIN Donation don ON d.donor_id = don.donor_id
          WHERE d.donor_id IN (
            SELECT DISTINCT donor_id 
            FROM Donation 
            WHERE status IN ('Pending', 'Matched')
          )
          GROUP BY d.donor_id
          ORDER BY total_donations DESC
        `);
        res.json({ donors: rows });
      } catch (error) {
        console.error('Error fetching nearby donors:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.patch('/api/shelter/occupancy', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const { current_occupancy } = req.body;

        if (current_occupancy === undefined || current_occupancy === null) {
          return res.status(400).json({ error: 'current_occupancy is required' });
        }

        const occupancy = parseInt(current_occupancy);
        if (isNaN(occupancy) || occupancy < 0) {
          return res.status(400).json({ error: 'Invalid occupancy value' });
        }

        // First get the shelter_id and capacity
        const [shelterRows] = await pool.query('SELECT shelter_id, capacity FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const { shelter_id, capacity } = shelterRows[0];

        if (occupancy > capacity) {
          return res.status(400).json({ error: 'Occupancy cannot exceed capacity' });
        }

        await pool.query(
          'UPDATE Shelter SET current_occupancy = ? WHERE shelter_id = ?',
          [occupancy, shelter_id]
        );

        res.json({ message: 'Occupancy updated successfully', current_occupancy: occupancy });
      } catch (error) {
        console.error('Error updating occupancy:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.patch('/api/shelter/food-stock', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const { food_stock_status } = req.body;

        if (!food_stock_status) {
          return res.status(400).json({ error: 'food_stock_status is required' });
        }

        const validStatuses = ['Critical', 'Low', 'Adequate', 'Good'];
        if (!validStatuses.includes(food_stock_status)) {
          return res.status(400).json({ error: 'Invalid food stock status. Must be one of: Critical, Low, Adequate, Good' });
        }

        // First get the shelter_id
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelter_id = shelterRows[0].shelter_id;

        await pool.query(
          'UPDATE Shelter SET food_stock_status = ? WHERE shelter_id = ?',
          [food_stock_status, shelter_id]
        );

        res.json({ message: 'Food stock status updated successfully', food_stock_status });
      } catch (error) {
        console.error('Error updating food stock status:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Volunteer Opportunity endpoints
    app.get('/api/volunteer-opportunities', async (req, res) => {
      try {
        const pool = await getPool();
        
        // First, cleanup expired opportunities
        await pool.query('CALL CleanupExpiredOpportunities()');
        
        // Then fetch only non-expired opportunities
        const [rows] = await pool.query(
          `SELECT vo.*, s.shelter_name, s.location as shelter_location, s.phone as shelter_phone, s.email as shelter_email
           FROM VolunteerOpportunity vo
           JOIN Shelter s ON vo.shelter_id = s.shelter_id
           WHERE vo.status IN ('Open', 'Filled')
           AND (vo.date_needed IS NULL OR 
                CONCAT(vo.date_needed, ' ', IFNULL(vo.time_needed, '23:59:59')) >= NOW())
           ORDER BY 
             CASE vo.urgency_level
               WHEN 'Urgent' THEN 1
               WHEN 'High' THEN 2
               WHEN 'Medium' THEN 3
               WHEN 'Low' THEN 4
             END,
             vo.date_needed ASC,
             vo.created_at DESC`
        );
        res.json({ opportunities: rows });
      } catch (error) {
        console.error('Error fetching volunteer opportunities:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/api/shelter/volunteer-opportunities', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        // First get the shelter_id for this user
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Cleanup expired opportunities
        await pool.query('CALL CleanupExpiredOpportunities()');

        const [rows] = await pool.query(
          'SELECT * FROM VolunteerOpportunity WHERE shelter_id = ? ORDER BY created_at DESC',
          [shelterId]
        );
        res.json({ opportunities: rows });
      } catch (error) {
        console.error('Error fetching shelter volunteer opportunities:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.post('/api/shelter/volunteer-opportunities', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        // First get the shelter_id for this user
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        const { 
          title, 
          description, 
          task_type, 
          volunteers_needed, 
          date_needed, 
          time_needed, 
          duration_hours, 
          location, 
          urgency_level 
        } = req.body;

        if (!title || !task_type) {
          return res.status(400).json({ error: 'Title and task type are required' });
        }

        const [result] = await pool.query(
          `INSERT INTO VolunteerOpportunity 
           (shelter_id, title, description, task_type, volunteers_needed, date_needed, time_needed, duration_hours, location, urgency_level, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
          [
            shelterId,
            title,
            description || null,
            task_type,
            volunteers_needed || 1,
            date_needed || null,
            time_needed || null,
            duration_hours || null,
            location || null,
            urgency_level || 'Medium'
          ]
        );

        res.status(201).json({ 
          message: 'Volunteer opportunity created successfully',
          opportunity_id: result.insertId 
        });
      } catch (error) {
        console.error('Error creating volunteer opportunity:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // DELETE volunteer opportunity (shelter can delete their own opportunities)
    app.delete('/api/volunteer-opportunities/:id', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const opportunityId = req.params.id;

        // Get shelter_id for this user
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Verify this opportunity belongs to this shelter
        const [oppRows] = await pool.query('SELECT * FROM VolunteerOpportunity WHERE opportunity_id = ? AND shelter_id = ?', [opportunityId, shelterId]);
        if (!oppRows.length) {
          return res.status(404).json({ error: 'Volunteer opportunity not found or access denied' });
        }

        // Delete the opportunity (will cascade delete assignments)
        await pool.query('DELETE FROM VolunteerOpportunity WHERE opportunity_id = ?', [opportunityId]);
        res.json({ message: 'Volunteer opportunity deleted successfully' });
      } catch (error) {
        console.error('Error deleting volunteer opportunity:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.post('/api/volunteer-opportunities/:id/apply', authenticate, authorize(['volunteer']), async (req, res) => {
      const connection = await (await getPool()).getConnection();
      
      try {
        await connection.beginTransaction();
        
        const opportunityId = req.params.id;
        
        // Get volunteer_id for this user
        const [volRows] = await connection.query('SELECT volunteer_id FROM Volunteer WHERE user_id = ?', [req.user.id]);
        if (!volRows.length) {
          await connection.rollback();
          return res.status(404).json({ error: 'Volunteer profile not found' });
        }
        const volunteerId = volRows[0].volunteer_id;

        // Check if opportunity exists and is still open
        const [oppRows] = await connection.query(
          'SELECT * FROM VolunteerOpportunity WHERE opportunity_id = ?',
          [opportunityId]
        );
        if (!oppRows.length) {
          await connection.rollback();
          return res.status(404).json({ error: 'Opportunity not found' });
        }

        const opportunity = oppRows[0];
        if (opportunity.status !== 'Open') {
          await connection.rollback();
          return res.status(400).json({ error: 'This opportunity is no longer open' });
        }

        if (opportunity.volunteers_assigned >= opportunity.volunteers_needed) {
          await connection.rollback();
          return res.status(400).json({ error: 'This opportunity is already fully assigned' });
        }

        // Check if volunteer already applied
        const [existingAssignment] = await connection.query(
          'SELECT * FROM VolunteerAssignment WHERE opportunity_id = ? AND volunteer_id = ?',
          [opportunityId, volunteerId]
        );
        if (existingAssignment.length > 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'You have already applied to this opportunity' });
        }

        // Create the assignment
        await connection.query(
          'INSERT INTO VolunteerAssignment (opportunity_id, volunteer_id, status) VALUES (?, ?, ?)',
          [opportunityId, volunteerId, 'Assigned']
        );

        // Update volunteers_assigned count
        const newAssignedCount = opportunity.volunteers_assigned + 1;
        const newStatus = newAssignedCount >= opportunity.volunteers_needed ? 'Filled' : 'Open';
        
        await connection.query(
          'UPDATE VolunteerOpportunity SET volunteers_assigned = ?, status = ? WHERE opportunity_id = ?',
          [newAssignedCount, newStatus, opportunityId]
        );

        await connection.commit();
        res.json({ 
          message: 'Successfully applied to volunteer opportunity',
          volunteers_assigned: newAssignedCount,
          status: newStatus
        });
      } catch (error) {
        await connection.rollback();
        console.error('Error applying to volunteer opportunity:', error);
        res.status(500).json({ error: 'Server error' });
      } finally {
        connection.release();
      }
    });

    app.get('/api/shelter/volunteer-assignments', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        // Get shelter_id for this user
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Get all volunteer assignments for this shelter's opportunities
        const [rows] = await pool.query(
          `SELECT 
            va.assignment_id,
            va.assigned_at,
            va.status as assignment_status,
            vo.opportunity_id,
            vo.title,
            vo.task_type,
            vo.date_needed,
            vo.time_needed,
            v.volunteer_id,
            v.volunteer_name,
            v.email,
            v.phone,
            v.area_of_service
           FROM VolunteerAssignment va
           JOIN VolunteerOpportunity vo ON va.opportunity_id = vo.opportunity_id
           JOIN Volunteer v ON va.volunteer_id = v.volunteer_id
           WHERE vo.shelter_id = ?
           ORDER BY va.assigned_at DESC`,
          [shelterId]
        );
        
        res.json({ assignments: rows });
      } catch (error) {
        console.error('Error fetching volunteer assignments:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Record a donation to fulfill a request
    app.post('/api/requests/:id/fulfill', authenticate, authorize(['donor']), async (req, res) => {
      const connection = await (await getPool()).getConnection();
      
      try {
        await connection.beginTransaction();
        
        const requestId = req.params.id;
        const { foodType, quantity, unit, expiryDate, pickupLocation, notes } = req.body;

        if (!foodType || !quantity || !unit) {
          await connection.rollback();
          return res.status(400).json({ error: 'foodType, quantity, and unit are required' });
        }

        const donationQuantity = parseFloat(quantity);
        if (isNaN(donationQuantity) || donationQuantity <= 0) {
          await connection.rollback();
          return res.status(400).json({ error: 'Invalid quantity value' });
        }

        // Get donor_id for this user
        const [donorRows] = await connection.query('SELECT donor_id FROM Donor WHERE user_id = ?', [req.user.id]);
        if (!donorRows.length) {
          await connection.rollback();
          return res.status(400).json({ error: 'Donor profile not found' });
        }
        const donorId = donorRows[0].donor_id;

        // Get request details including current quantity and unit
        let shelterId = null;
        let requestQuantity = 0;
        let requestUnit = '';
        
        if (requestId) {
          const [requestRows] = await connection.query(
            'SELECT shelter_id, quantity, unit, status FROM Request WHERE request_id = ?', 
            [requestId]
          );
          
          if (!requestRows.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Request not found' });
          }

          if (requestRows[0].status === 'Fulfilled') {
            await connection.rollback();
            return res.status(400).json({ error: 'This request has already been fulfilled' });
          }

          shelterId = requestRows[0].shelter_id;
          requestQuantity = parseFloat(requestRows[0].quantity);
          requestUnit = requestRows[0].unit;

          // Check if units match
          if (requestUnit.toLowerCase() !== unit.toLowerCase()) {
            await connection.rollback();
            return res.status(400).json({ 
              error: `Unit mismatch: Request needs ${requestUnit}, but you provided ${unit}` 
            });
          }
        }

        // Create the donation
        const combinedQuantity = `${quantity} ${unit}`;
        const [donationResult] = await connection.query(
          'INSERT INTO Donation (donor_id, shelter_id, food_type, quantity, expiry_date, location, status, donated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
          [donorId, shelterId, foodType, combinedQuantity, expiryDate || null, pickupLocation, 'Pending']
        );

        const donationId = donationResult.insertId;

        // Create match and update request based on quantity
        if (requestId && shelterId) {
          await connection.query(
            'INSERT INTO Matches (donation_id, request_id, matched_on, status) VALUES (?, ?, NOW(), ?)',
            [donationId, requestId, 'Pending']
          );

          // Calculate remaining quantity
          const remainingQuantity = requestQuantity - donationQuantity;

          if (remainingQuantity <= 0) {
            // Fully fulfilled - mark as Fulfilled
            await connection.query(
              'UPDATE Request SET status = ?, quantity = 0 WHERE request_id = ?',
              ['Fulfilled', requestId]
            );
          } else {
            // Partially fulfilled - update quantity and mark as Matched
            await connection.query(
              'UPDATE Request SET status = ?, quantity = ? WHERE request_id = ?',
              ['Matched', remainingQuantity, requestId]
            );
          }
        }

        await connection.commit();

        res.status(201).json({ 
          message: 'Donation recorded successfully',
          donationId: donationId,
          requestStatus: requestQuantity > 0 && donationQuantity >= requestQuantity ? 'Fulfilled' : 'Partially Fulfilled'
        });
      } catch (error) {
        await connection.rollback();
        console.error('Error recording donation:', error);
        res.status(500).json({ error: 'Server error' });
      } finally {
        connection.release();
      }
    });

    // Endpoint using STORED PROCEDURE: Get shelter stats
    app.get('/api/shelter/stats', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Call stored procedure
        const [rows] = await pool.query('CALL GetShelterStats(?)', [shelterId]);
        res.json({ stats: rows[0][0] });
      } catch (error) {
        console.error('Error fetching shelter stats:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Endpoint using STORED PROCEDURE: Get donor impact
    app.get('/api/donor/impact', authenticate, authorize(['donor']), async (req, res) => {
      try {
        const pool = await getPool();
        const [donorRows] = await pool.query('SELECT donor_id FROM Donor WHERE user_id = ?', [req.user.id]);
        if (!donorRows.length) {
          return res.status(404).json({ error: 'Donor profile not found' });
        }
        const donorId = donorRows[0].donor_id;

        // Call stored procedure
        const [rows] = await pool.query('CALL GetDonorImpact(?)', [donorId]);
        res.json({ impact: rows[0][0] });
      } catch (error) {
        console.error('Error fetching donor impact:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Endpoint using STORED PROCEDURE: Get volunteer task summary
    app.get('/api/volunteer/summary', authenticate, authorize(['volunteer']), async (req, res) => {
      try {
        const pool = await getPool();
        const [volRows] = await pool.query('SELECT volunteer_id FROM Volunteer WHERE user_id = ?', [req.user.id]);
        if (!volRows.length) {
          return res.status(404).json({ error: 'Volunteer profile not found' });
        }
        const volunteerId = volRows[0].volunteer_id;

        // Call stored procedure
        const [rows] = await pool.query('CALL GetVolunteerTaskSummary(?)', [volunteerId]);
        res.json({ summary: rows[0][0] });
      } catch (error) {
        console.error('Error fetching volunteer summary:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Endpoint using STORED FUNCTION: Get shelter occupancy percentage
    app.get('/api/shelter/occupancy-percentage', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Call stored function
        const [rows] = await pool.query('SELECT GetOccupancyPercentage(?) as occupancy_percentage', [shelterId]);
        res.json({ occupancy_percentage: rows[0].occupancy_percentage });
      } catch (error) {
        console.error('Error fetching occupancy percentage:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Endpoint using STORED FUNCTION: Count active requests for shelter
    app.get('/api/shelter/active-requests-count', authenticate, authorize(['shelter']), async (req, res) => {
      try {
        const pool = await getPool();
        const [shelterRows] = await pool.query('SELECT shelter_id FROM Shelter WHERE user_id = ?', [req.user.id]);
        if (!shelterRows.length) {
          return res.status(404).json({ error: 'Shelter profile not found' });
        }
        const shelterId = shelterRows[0].shelter_id;

        // Call stored function
        const [rows] = await pool.query('SELECT CountActiveRequests(?) as active_requests', [shelterId]);
        res.json({ active_requests: rows[0].active_requests });
      } catch (error) {
        console.error('Error fetching active requests count:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    // Endpoint to manually cleanup expired volunteer opportunities
    app.post('/api/admin/cleanup-expired-opportunities', authenticate, authorize(['admin']), async (req, res) => {
      try {
        const pool = await getPool();
        await pool.query('CALL CleanupExpiredOpportunities()');
        res.json({ message: 'Expired opportunities cleaned up successfully' });
      } catch (error) {
        console.error('Error cleaning up expired opportunities:', error);
        res.status(500).json({ error: 'Server error' });
      }
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();
