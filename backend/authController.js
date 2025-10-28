require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('./db.js');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN = '15m',
  REFRESH_TOKEN_EXPIRES_IN = '7d',
} = process.env;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.warn('JWT secrets are not set in env. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.');
}

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

async function register(req, res) {
  try {
    const pool = await getPool();
    const { name, email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' });

    // check if user exists
    const [rows] = await pool.query('SELECT user_id FROM Users WHERE email = ?', [email]);
    if (rows.length) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name || null, email, password_hash, role]
    );

    const userId = result.insertId;

    // create role-specific profile record to link
    if (role === 'donor') {
      await pool.query('INSERT INTO Donor (user_id, donor_name, email) VALUES (?, ?, ?)', [userId, name || null, email]);
    } else if (role === 'volunteer') {
      await pool.query('INSERT INTO Volunteer (user_id, volunteer_name, email) VALUES (?, ?, ?)', [
        userId,
        name || null,
        email,
      ]);
    } else if (role === 'shelter') {
      await pool.query('INSERT INTO Shelter (user_id, shelter_name, email) VALUES (?, ?, ?)', [userId, name || null, email]);
    }
    // recipients/admin do not need extra table here

    // issue tokens
    const accessToken = signAccessToken({ sub: userId, role });
    const refreshToken = signRefreshToken({ sub: userId, role, jti: uuidv4() });

    // store hashed refresh token
    const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = null; // could compute from REFRESH_TOKEN_EXPIRES_IN if desired
    await pool.query('INSERT INTO RefreshTokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [
      userId,
      refreshHash,
      expiresAt,
    ]);

    res.status(201).json({
      message: 'Registered',
      user: { user_id: userId, email, role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('register err', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const pool = await getPool();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const [rows] = await pool.query('SELECT user_id, password_hash, role, name FROM Users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken({ sub: user.user_id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.user_id, role: user.role, jti: uuidv4() });

    const refreshHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    const expiresAt = null;
    await pool.query('INSERT INTO RefreshTokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [
      user.user_id,
      refreshHash,
      expiresAt,
    ]);

    res.json({
      message: 'Logged in',
      user: { user_id: user.user_id, email, role: user.role, name: user.name },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('login err', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function refresh(req, res) {
  try {
    const pool = await getPool();
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    // verify JWT (signature)
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const userId = payload.sub;

    // find matching hash in DB for this user (we store multiple refresh tokens to allow multiple devices)
    const [rows] = await pool.query('SELECT id, token_hash FROM RefreshTokens WHERE user_id = ?', [userId]);
    if (!rows.length) return res.status(401).json({ error: 'Refresh token not found' });

    // find which one matches
    let match = null;
    for (const r of rows) {
      const ok = await bcrypt.compare(refreshToken, r.token_hash);
      if (ok) {
        match = r;
        break;
      }
    }
    if (!match) return res.status(401).json({ error: 'Refresh token not recognized' });

    // Issue new tokens
    const [userRows] = await pool.query('SELECT role FROM Users WHERE user_id = ?', [userId]);
    const role = userRows[0].role;
    const newAccess = signAccessToken({ sub: userId, role });
    const newRefresh = signRefreshToken({ sub: userId, role, jti: uuidv4() });

    // remove old refresh token row (rotate)
    await pool.query('DELETE FROM RefreshTokens WHERE id = ?', [match.id]);

    const newRefreshHash = await bcrypt.hash(newRefresh, SALT_ROUNDS);
    await pool.query('INSERT INTO RefreshTokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [
      userId,
      newRefreshHash,
      null,
    ]);

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    console.error('refresh err', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function logout(req, res) {
  try {
    const pool = await getPool();
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    // try to find and delete matching hash
    const [rows] = await pool.query('SELECT id, user_id, token_hash FROM RefreshTokens');
    for (const r of rows) {
      if (await bcrypt.compare(refreshToken, r.token_hash)) {
        await pool.query('DELETE FROM RefreshTokens WHERE id = ?', [r.id]);
        return res.json({ message: 'Logged out' });
      }
    }
    // token not found: still return success to avoid token probing
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('logout err', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { register, login, refresh, logout };
