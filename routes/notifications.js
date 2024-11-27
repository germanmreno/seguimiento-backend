import express from 'express';
import prisma from '../db/prismaClient.js';

const router = express.Router();

// Get user's notifications
router.get('/', async (req, res) => {
  const { user_id } = req.query;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        user_id,
        deleted: false,
      },
      include: {
        forum: {
          select: {
            title: true,
            memo_id: true,
            memo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        memo: {
          select: {
            id: true,
            name: true,
            status: true,
            instruction: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { read: true },
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Delete notification (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { deleted: true },
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
