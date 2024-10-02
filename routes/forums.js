import express from 'express';
import prisma from '../db/prismaClient.js';

const router = express.Router();

// Create a new forum entry
router.post('/', async (req, res) => {
  const { title, description, memo_id } = req.body;

  try {
    // Insert the new Forum entry
    const newForum = await prisma.forum.create({
      data: {
        title,
        description,
        memo_id,
      },
    });

    res.status(201).json(newForum);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create forum entry' });
  }
});

export default router;
