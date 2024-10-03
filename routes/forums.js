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

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the forum entry by ID
    const forum = await prisma.forum.findUnique({
      where: { id: parseInt(id) },
    });

    console.log(forum);

    if (!forum) {
      return res.status(404).json({ error: 'Forum or related memo not found' });
    }

    // Fetch related offices based on memo_id
    const memoOffices = await prisma.memoOffice.findMany({
      where: { memo_id: forum.memo_id },
      include: {
        office: true,
      },
    });

    // Extract related offices
    const relatedOffices = memoOffices.map((memoOffice) => memoOffice.office);

    res.status(200).json({ ...forum, relatedOffices });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch forum details' });
  }
});

router.get('/check-existence/:id', async (req, res) => {
  const { id } = req.params;

  console.log(req.params);

  try {
    // Check if a forum exists with the given memo_id
    const forum = await prisma.forum.findFirst({
      where: { memo_id: id },
    });

    if (forum) {
      res.status(200).json({ exists: true, id: forum.id });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to check forum existence' });
  }
});

export default router;
