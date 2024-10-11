import express, { json, urlencoded } from 'express';
import cors from 'cors';
import memosRouter from './routes/memos.js';
import forumRouter from './routes/forums.js';
import authRoutes from './routes/auth.js';
import prisma from './db/prismaClient.js';

const app = express();

app.disable('x-powered-by');

app.use(urlencoded({ extended: true }));
app.use(json());

const corsOptions = {
  origin: true, // included origin as true
  credentials: true, // included credentials as true
};

app.use(cors(corsOptions));

app.use('/memos', memosRouter);
app.use('/forums', forumRouter);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Gracefully shut down Prisma Client
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
