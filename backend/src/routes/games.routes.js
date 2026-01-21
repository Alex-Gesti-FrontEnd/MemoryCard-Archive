import express from 'express';
import { getConnection } from '../db.js';
import { searchGameByName } from '../services/igdb.service.js';
import { reverseGeocodeOSM } from '../services/geocoding.service.js';

const router = express.Router();

// Route to search for a game by name in IGDB
router.get('/igdb/:name', async (req, res) => {
  try {
    const game = await searchGameByName(req.params.name);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'IGDB error',
      error: error.message,
    });
  }
});

// CRUD routes for local games database
router.get('/', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query('SELECT * FROM games');
    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving games', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { name, platform, region, genre, releaseDate, avgPrice, image } = req.body;
  try {
    const connection = await getConnection();
    const [result] = await connection.query(
      'INSERT INTO games (name, platform, region, genre, releaseDate, avgPrice, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, platform, region, genre, releaseDate, avgPrice, image]
    );
    await connection.end();
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding game', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, platform, region, genre, releaseDate, avgPrice, image } = req.body;
  try {
    const connection = await getConnection();
    await connection.query(
      'UPDATE games SET name=?, platform=?, region=?, genre=?, releaseDate=?, avgPrice=?, image=? WHERE id=?',
      [name, platform, region, genre, releaseDate, avgPrice, image, id]
    );
    await connection.end();
    res.json({ id, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating game', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const connection = await getConnection();
    await connection.query('DELETE FROM games WHERE id = ?', [req.params.id]);
    await connection.end();
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting game', error: err.message });
  }
});

// MAP geocoding route
router.post('/map/location', async (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Lat and lng are required' });
  }

  try {
    // 1️⃣ Reverse geocoding
    const location = await reverseGeocodeOSM(lat, lng);

    // 2️⃣ Guardar en MySQL
    const connection = await getConnection();
    const [result] = await connection.query(
      `INSERT INTO user_locations (lat, lng, city, country)
       VALUES (?, ?, ?, ?)`,
      [lat, lng, location.city ?? null, location.country ?? null]
    );
    await connection.end();

    // 3️⃣ Respuesta
    res.status(201).json({
      id: result.insertId,
      lat,
      lng,
      city: location.city,
      country: location.country,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error saving location',
      error: error.message,
    });
  }
});

export default router;
