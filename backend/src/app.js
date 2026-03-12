import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import gamesRouter from './routes/games.routes.js';
import remindersRouter from './routes/reminders.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/games', gamesRouter);
app.use('/api/reminders', remindersRouter);

const angularDistPath = path.join(process.cwd(), 'backend/dist/angular8/browser');
app.use(express.static(angularDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API + Frontend arrancados en http://localhost:${PORT}`));
