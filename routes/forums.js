import express from 'express';
import prisma from '../db/prismaClient.js';
import formatDate from '../helpers/formatDate.js';

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
      return res.status(404).json({ error: 'Forum not found' });
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

    // Fetch memo details separately if memo_id exists
    let memoDetails = null;
    if (forum.memo_id) {
      const memo = await prisma.memo.findUnique({
        where: { id: forum.memo_id },
        select: {
          urgency: true,
          // Add more fields here if needed in the future
        },
      });
      if (memo) {
        memoDetails = {
          urgencyLevel: memo.urgency,
          // Add more memo-related fields here if needed in the future
        };
      }
    }

    // Prepare the response object
    const response = {
      ...forum,
      relatedOffices,
      memoDetails,
    };

    res.status(200).json(response);
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

// Post a new message to a forum
router.post('/:forumId/messages', async (req, res) => {
  const { forumId } = req.params;
  const { content, user_id } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        office_id: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        user: { connect: { id: user_id } },
        forum: { connect: { id: parseInt(forumId) } },
      },
      include: {
        user: true,
      },
    });

    const office = await prisma.office.findUnique({
      where: { id: user.office_id },
    });

    const formattedMessage = {
      ...message,
      createdAt: formatDate(message.createdAt),
      user: {
        ...message.user,
        office: office,
      },
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to post message' });
  }
});

// Get all messages for a forum
router.get('/:forumId/messages', async (req, res) => {
  const { forumId } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: { forum_id: parseInt(forumId) },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch office information for each user
    const messagesWithOffice = await Promise.all(
      messages.map(async (message) => {
        const office = await prisma.office.findUnique({
          where: { id: message.user.office_id },
        });
        return {
          ...message,
          createdAt: formatDate(message.createdAt),
          user: {
            ...message.user,
            office: office,
          },
        };
      })
    );

    res.status(200).json(messagesWithOffice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
