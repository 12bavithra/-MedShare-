import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5500';

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.json({ ok: true, service: 'MedShare backend' }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
