import express from 'express';
import { getConnection } from '../db.js';

const router = express.Router();

// GET all reminders
router.get('/', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM reminders');

    const formatted = rows.map((r) => ({
      ...r,
      date: r.date.toLocaleDateString('en-CA'),
    }));

    await connection.end();
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving reminders', error: err.message });
  }
});

// CREATE reminder
router.post('/', async (req, res) => {
  const { title, date, notes, gameId } = req.body;

  try {
    const connection = await getConnection();
    const [result] = await connection.query(
      'INSERT INTO reminders (title, date, notes, gameId) VALUES (?, ?, ?, ?)',
      [title, date, notes, gameId ?? null],
    );

    await connection.end();
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ message: 'Error creating reminder', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const connection = await getConnection();
    await connection.query('DELETE FROM reminders WHERE id = ?', [req.params.id]);
    await connection.end();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error deleting reminder', error: err.message });
  }
});

export default router;
