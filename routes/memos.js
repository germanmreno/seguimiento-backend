import express from 'express';
import prisma from '../db/prismaClient.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  sendNotifications,
  getSpecialUsers,
} from '../utils/notificationHelper.js';

const router = express.Router();

// Add this line to serve files from the uploads directory
router.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder =
      file.fieldname === 'reception_images' ? 'receptions' : 'attachments';
    const uploadPath = path.join('uploads', folder).replace(/\\/g, '/');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Add file filter to validate file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'reception_images') {
    // Allow images and PDFs for reception_images
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only images and PDFs are allowed.'),
        false
      );
    }
  } else {
    // For attachment_files, allow all types
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Create upload directories if they don't exist
['receptions', 'attachments'].forEach((folder) => {
  const dir = path.join('uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create a new memo
router.post(
  '/',
  (req, res, next) => {
    upload.fields([
      { name: 'reception_images', maxCount: 10 },
      { name: 'attachment_files', maxCount: 10 },
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: err.message || 'Error uploading files',
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const {
        id,
        name,
        applicant,
        reception_method,
        reception_date,
        reception_hour,
        response_require,
        observation,
        status,
        urgency,
        attachment_type,
        officeIds,
      } = req.body;

      // Parse JSON strings back to arrays
      const parsedAttachmentType = JSON.parse(attachment_type);
      const parsedOfficeIds = JSON.parse(officeIds);

      // Process uploaded files
      const receptionImages =
        req.files['reception_images']?.map((file) => ({
          path: file.path.replace(/\\/g, '/'),
          filename: file.filename,
          type: file.mimetype,
          isPdf: file.mimetype === 'application/pdf',
        })) || [];

      const attachmentFiles =
        req.files['attachment_files']?.map((file) => ({
          path: file.path.replace(/\\/g, '/'),
          filename: file.filename,
          type: file.mimetype,
        })) || [];

      // Create memo with office relationships
      const memo = await prisma.memo.create({
        data: {
          id,
          name,
          applicant,
          reception_method,
          reception_date: new Date(reception_date),
          reception_hour,
          response_require,
          observation,
          status,
          urgency,
          attachment_type: parsedAttachmentType,
          reception_images: receptionImages,
          attachment_files: attachmentFiles,
          offices: {
            create: parsedOfficeIds.map((officeId) => ({
              office: {
                connect: { id: officeId },
              },
            })),
          },
          instruction_status: 'PENDING',
        },
        include: {
          offices: {
            include: {
              office: true,
            },
          },
        },
      });

      // Send notifications to related users
      const relatedUsers = await prisma.user.findMany({
        where: {
          office_id: {
            in: parsedOfficeIds,
          },
        },
      });

      const specialUsers = await getSpecialUsers();
      const allUsers = [...new Set([...relatedUsers, ...specialUsers])];

      // Add notification for new memo creation
      await sendNotifications(
        allUsers,
        `Nuevo oficio registrado: ${memo.name}`,
        null, // No forum ID
        memo.id // Add the memo ID here
      );

      res.status(201).json(memo);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Add this new route to get a single memo by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const memo = await prisma.memo.findUnique({
      where: { id },
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

    res.status(200).json(memo);
  } catch (error) {
    console.error('Error fetching memo:', error);
    res.status(500).json({ error: 'Failed to fetch memo' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { office_id } = req.query;

    const memos = await prisma.memo.findMany({
      where: office_id
        ? {
            offices: {
              some: {
                office_id: office_id,
              },
            },
          }
        : undefined,
      include: {
        offices: {
          include: {
            office: true,
          },
        },
      },
      orderBy: [{ reception_date: 'desc' }, { reception_hour: 'desc' }],
    });
    res.status(200).json(memos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, user } = req.body;

  if (!user) {
    return res.status(400).json({
      error: 'User information is required',
    });
  }

  // Update valid status values
  if (!['PENDING', 'COMPLETED', 'ARCHIVED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  // Check user permissions
  const canChangeStatus =
    user.role === 'ADMIN' || (user.office_id === '110' && user.role === 'USER');

  if (!canChangeStatus) {
    return res.status(403).json({
      error: 'No tienes permisos para cambiar el estado del oficio',
    });
  }

  try {
    const updatedMemo = await prisma.memo.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(updatedMemo);
  } catch (error) {
    console.error('Failed to change status:', error);
    res.status(500).json({ error: 'Failed to change status' });
  }
});

// Update the instruction route to handle office updates
router.patch('/:id/instruction', async (req, res) => {
  const { id } = req.params;
  const { instruction, officeIds, user } = req.body;

  // Check if user has permission to edit offices
  const canEditOffices = user.role === 'ADMIN' || user.office_id === '101'; // VICEPRESIDENCIA

  try {
    const updateData = {
      instruction,
      instruction_status: 'ASSIGNED',
    };

    // Only update offices if user has permission and officeIds were provided
    if (canEditOffices && officeIds) {
      // Delete existing office relationships
      await prisma.memoOffice.deleteMany({
        where: { memo_id: id },
      });

      // Create new office relationships
      await prisma.memoOffice.createMany({
        data: officeIds.map((officeId) => ({
          memo_id: id,
          office_id: officeId,
        })),
      });
    }

    const updatedMemo = await prisma.memo.update({
      where: { id },
      data: updateData,
      include: {
        offices: {
          include: {
            office: true,
          },
        },
      },
    });

    // Send notifications to related users
    const relatedUsers = await prisma.user.findMany({
      where: {
        office_id: {
          in: officeIds,
        },
      },
    });

    const specialUsers = await getSpecialUsers();

    // Combine and deduplicate users
    const allUsers = [...new Set([...relatedUsers, ...specialUsers])];

    await sendNotifications(
      allUsers,
      `Nuevo oficio asignado: ${updatedMemo.name}`,
      null, // No forum ID for memo notifications
      id // Add the memo ID here
    );

    res.status(200).json(updatedMemo);
  } catch (error) {
    console.error('Failed to update instruction:', error);
    res.status(500).json({ error: 'Failed to update instruction' });
  }
});

export default router;
