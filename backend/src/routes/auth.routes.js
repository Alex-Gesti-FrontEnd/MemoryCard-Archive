import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'memorycardarchive_secret';

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await getConnection();

    const hash = await bcrypt.hash(password, 10);

    const result = await connection.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email, hash],
    );

    res.status(201).json({
      id: result.rows[0].id,
      email,
    });
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(400).json({ message: 'User already exists' });
    }

    res.status(500).json({
      message: 'Register error',
      error: err.message,
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await getConnection();

    const result = await connection.query('SELECT * FROM users WHERE email = $1', [email]);

    const rows = result.rows;

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });

    res.json({
      token,
      userId: user.id,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Login error',
      error: err.message,
    });
  }
});

export default router;
