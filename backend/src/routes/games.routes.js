import express from 'express';
import { getConnection } from '../db.js';
import { getPopularGames, searchGameByName } from '../services/igdb.service.js';
import { searchGameStores } from '../services/overpass.service.js';
import { reverseGeocodeOSM } from '../services/geocoding.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

function formatStore(s) {
  const tags = s.tags || {};
  const name = (tags.name || '').toLowerCase();

  const knownSeller = [
    'game',
    'games',
    'gaming',
    'mediamarkt',
    'fnac',
    'cex',
    'carrefour',
    'corte inglés',
    'cash converters',
    'xtralife',
  ].some((k) => name.includes(k));

  const probability =
    tags.shop === 'video_games' || tags.second_hand === 'yes' || knownSeller
      ? 'high'
      : ['electronics', 'department_store', 'shopping_centre'].includes(tags.shop)
        ? 'medium'
        : 'low';

  return {
    name: tags.name ?? 'Unknown shop',
    lat: s.lat ?? s.center?.lat,
    lng: s.lon ?? s.center?.lon,
    url: tags.website ?? null,
    phone: tags.phone ?? tags['contact:phone'] ?? null,
    openingHours: tags.opening_hours ?? null,
    probability,
  };
}

const router = express.Router();

// Route to search for popular games in IGDB
router.get('/igdb/popular', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const games = await getPopularGames(limit, offset);

    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'IGDB popular error',
      error: error.message,
    });
  }
});

// Route to search for a game by name in IGDB
router.get('/igdb/search', async (req, res) => {
  try {
    const { name, page } = req.query;

    const limit = 50;
    const offset = (Number(page) - 1) * limit;

    const data = await searchGameByName(name, limit, offset);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'IGDB error',
      error: error.message,
    });
  }
});

// Routes for local games database
router.get('/', authMiddleware, async (req, res) => {
  try {
    const connection = await getConnection();

    const userId = req.user.id;

    const [rows] = await connection.query('SELECT * FROM games WHERE user_id = ?', [userId]);

    const formatted = rows.map((game) => ({
      ...game,
      releaseDate: game.releaseDate ? game.releaseDate.toISOString().split('T')[0] : null,
    }));

    res.json(formatted);
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving games', error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, platform, region, genre, releaseDate, image, status, format } = req.body;

  try {
    const connection = await getConnection();
    const userId = req.user.id;

    const [result] = await connection.query(
      `
      INSERT INTO games 
      (user_id, name, platform, region, genre, releaseDate, image, status, format)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name,
        platform,
        region,
        genre,
        releaseDate,
        image,
        status || 'backlog',
        format || 'physical',
      ],
    );

    await connection.end();

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding game', error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, platform, region, genre, releaseDate, image, status, format } = req.body;

  try {
    const connection = await getConnection();
    const userId = req.user.id;

    await connection.query(
      `
      UPDATE games 
      SET name=?, platform=?, region=?, genre=?, releaseDate=?, image=?, status=?, format=?
      WHERE id=? AND user_id=?
      `,
      [name, platform, region, genre, releaseDate, image, status, format, id, userId],
    );

    await connection.end();

    res.json({ id, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating game', error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const connection = await getConnection();

    const userId = req.user.id;

    await connection.query('DELETE FROM games WHERE id = ? AND user_id = ?', [
      req.params.id,
      userId,
    ]);

    await connection.end();

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting game', error: err.message });
  }
});

// MAP geocoding route
router.get('/map/location', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Lat and lng are required' });
  }

  try {
    res.json(await reverseGeocodeOSM(lat, lng));
  } catch (error) {
    res.status(500).json({
      message: 'OSM reverse geocoding error',
      error: error.message,
    });
  }
});

// Localization of stores route
router.get('/map/stores', async (req, res) => {
  const { lat, lng, radius, types } = req.query;
  if (!lat || !lng || !radius || !types) {
    return res.status(400).json({ message: 'lat, lng, radius and types are required' });
  }

  try {
    const stores = await searchGameStores(
      Number(lat),
      Number(lng),
      Number(radius),
      types.split(','),
    );

    res.json(stores.map(formatStore));
  } catch (err) {
    res.status(500).json({ message: 'Overpass error', error: err.message });
  }
});

// Route calculation
router.get('/map/route', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({ message: 'fromLat, fromLng, toLat, toLng required' });
  }

  try {
    const url = `http://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=simplified&geometries=geojson`;
    const data = await fetch(url).then((r) => r.json());

    if (!data.routes?.length) {
      return res.status(400).json({ message: 'No route found', raw: data });
    }

    const { duration, distance, geometry } = data.routes[0];
    res.json({ duration, distance, geometry });
  } catch (err) {
    res.status(500).json({ message: 'Routing error', error: err.message });
  }
});

export default router;
