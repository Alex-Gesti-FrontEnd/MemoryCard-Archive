import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import gamesRouter from './routes/games.routes.js';
import remindersRouter from './routes/reminders.routes.js';
import authRouter from './routes/auth.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/games', gamesRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/auth', authRouter);

app.get('/', (req, res) => res.json({ ok: true, message: 'API backend funcionando' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API arrancada en http://localhost:${PORT}`));
