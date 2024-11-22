import express, { json, urlencoded } from 'express';
import cors from 'cors';
import memosRouter from './routes/memos.js';
import forumRouter from './routes/forums.js';
import authRoutes from './routes/auth.js';
import notificationsRouter from './routes/notifications.js';
import prisma from './db/prismaClient.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import officesRouter from './routes/offices.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadDirs = ['uploads/receptions', 'uploads/attachments'];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Middleware setup
app.disable('x-powered-by');
app.use(urlencoded({ extended: true }));
app.use(json());

// CORS configuration
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

// Static file serving
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      // Set appropriate headers for PDFs and images
      if (filePath.endsWith('.pdf')) {
        res.set('Content-Type', 'application/pdf');
      }
      // Add cache control for better performance
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    },
  })
);

// Routes
app.use('/memos', memosRouter);
app.use('/forums', forumRouter);
app.use('/auth', authRoutes);
app.use('/notifications', notificationsRouter);
app.use('/offices', officesRouter);

// Error handling for file serving
app.use((err, req, res, next) => {
  if (err.code === 'ENOENT') {
    res.status(404).json({ error: 'File not found' });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Closing gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
