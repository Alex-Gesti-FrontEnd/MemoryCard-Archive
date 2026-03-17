import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'memorycardarchive_secret';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    req.user = decoded; // ← AQUÍ está la magia

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
