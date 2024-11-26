import express from 'express';
import prisma from '../db/prismaClient.js';
import formatDate from '../helpers/formatDate.js';
import { upload } from '../utils/uploadConfig.js';
import path from 'path';
import {
  sendNotifications,
  getSpecialUsers,
} from '../utils/notificationHelper.js';

const router = express.Router();

// Create a new forum entry
router.post('/', async (req, res) => {
  const { title, description, memo_id, user_id } = req.body;

  try {
    // Check if user has access to the memo
    const memo = await prisma.memo.findUnique({
      where: { id: memo_id },
      include: {
        offices: {
          include: {
            office: true,
          },
        },
      },
    });

    if (!memo) {
      return res.status(404).json({ error: 'Memo not found' });
    }

    // Check if user's office is related to the memo
    const userHasAccess = memo.offices.some(
      (office) => office.office_id === user_id.office_id
    );

    if (!userHasAccess && user_id.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'No tienes permiso para crear un foro para este oficio',
      });
    }

    // Create the forum with creator information
    const newForum = await prisma.forum.create({
      data: {
        title,
        description,
        memo_id,
        created_by: user_id.id,
      },
      include: {
        creator: true,
        memo: {
          include: {
            offices: true,
          },
        },
      },
    });

    // Get users from related offices
    const relatedUsers = await prisma.user.findMany({
      where: {
        office_id: {
          in: newForum.memo.offices.map((o) => o.office_id),
        },
      },
    });

    const specialUsers = await getSpecialUsers();

    // Combine and deduplicate users
    const allUsers = [...new Set([...relatedUsers, ...specialUsers])];

    await sendNotifications(
      allUsers,
      `Nuevo foro creado: ${title}`,
      newForum.id
    );

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
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
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

    // Fetch memo details with reception_images
    let memoDetails = null;
    if (forum.memo_id) {
      const memo = await prisma.memo.findUnique({
        where: { id: forum.memo_id },
        select: {
          urgency: true,
          reception_images: true,
          attachment_files: true,
          instruction: true,
        },
      });

      if (memo) {
        memoDetails = {
          urgencyLevel: memo.urgency,
          reception_images: memo.reception_images || [],
          attachment_files: memo.attachment_files || [],
          instruction: memo.instruction,
        };
      }
    }

    // Prepare the response object
    const response = {
      ...forum,
      relatedOffices,
      memoDetails,
      messageCount: await prisma.message.count({
        where: { forum_id: parseInt(id) },
      }),
      lastMessageAt: forum.messages[0]?.createdAt || null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch forum details' });
  }
});

router.get('/check-existence/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if a forum exists with the given memo_id
    const forum = await prisma.forum.findFirst({
      where: { memo_id: id },
      select: {
        id: true,
        status: true,
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    if (forum) {
      res.status(200).json({
        exists: true,
        id: forum.id,
        status: forum.status,
        lastMessageAt: forum.messages[0]?.createdAt || null,
      });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to check forum existence' });
  }
});

// Post a new message to a forum with file upload
router.post('/:forumId/messages', upload.single('file'), async (req, res) => {
  try {
    const { forumId } = req.params;
    const { content, user_id } = req.body;

    // Get user and office information
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    const office = await prisma.office.findUnique({
      where: { id: user.office_id },
    });

    // First get the forum with memo information and related offices
    const forum = await prisma.forum.findUnique({
      where: { id: parseInt(forumId) },
      include: {
        memo: {
          include: {
            offices: {
              include: {
                office: true,
              },
            },
          },
        },
      },
    });

    if (!forum) {
      return res.status(404).json({ error: 'Forum not found' });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        user_id,
        forum_id: parseInt(forumId),
        fileUrl: req.file ? `/${req.file.path}` : null,
        fileName: req.file ? req.file.originalname : null,
      },
      include: {
        user: true,
      },
    });

    // Get users from related offices
    const relatedUsers = await prisma.user.findMany({
      where: {
        office_id: {
          in: forum.memo.offices.map((o) => o.office_id),
        },
      },
    });

    // Get special users (ADMIN, PRESIDENCIA, VICEPRESIDENCIA, SEGUIMIENTO Y CONTROL)
    const specialUsers = await getSpecialUsers();

    // Combine and deduplicate users, excluding the message sender
    const allUsers = [...new Set([...relatedUsers, ...specialUsers])].filter(
      (u) => u.id !== user_id
    );

    // Create a more descriptive notification message
    const notificationMessage = `${user.username} (${office.name}) comentó en el foro: ${forum.title}`;

    // Send notifications
    await sendNotifications(
      allUsers,
      notificationMessage,
      parseInt(forumId),
      forum.memo.id
    );

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      error: 'Failed to create message',
      details: error.message,
      requestData: req.body,
    });
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

// Add this new endpoint
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['OPEN', 'CLOSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const updatedForum = await prisma.forum.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.status(200).json(updatedForum);
  } catch (error) {
    console.error('Failed to update forum status:', error);
    res.status(500).json({ error: 'Failed to update forum status' });
  }
});

// Add this new endpoint for deleting messages
router.delete('/:forumId/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { user_id } = req.body;

  try {
    // First check if the message exists and belongs to the user
    const message = await prisma.message.findUnique({
      where: { id: parseInt(messageId) },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify the user is the owner of the message
    if (message.user_id !== user_id) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to delete this message' });
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: parseInt(messageId) },
    });

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Add a route to serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, '../uploads', filename));
});

export default router;
