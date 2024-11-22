import express from 'express';
import prisma from '../db/prismaClient.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Add this line to serve files from the uploads directory
router.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder =
      file.fieldname === 'reception_images' ? 'receptions' : 'attachments';
    cb(null, `uploads/${folder}`);
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

const SERVER_URL =
  process.env.NODE_ENV === 'production'
    ? 'http://172.16.2.51:3005'
    : 'http://localhost:3005';

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
          path: `${SERVER_URL}/${file.path}`,
          filename: file.filename,
          type: file.mimetype,
          isPdf: file.mimetype === 'application/pdf',
        })) || [];

      const attachmentFiles =
        req.files['attachment_files']?.map((file) => ({
          path: `${SERVER_URL}/${file.path}`,
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
    const memos = await prisma.memo.findMany({
      include: {
        offices: {
          include: {
            office: true,
          },
        },
      },
      orderBy: [
        { reception_date: 'desc' }, // Primary sort by reception date
        { reception_hour: 'desc' }, // Secondary sort by reception hour
      ],
    });
    res.status(200).json(memos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['PENDING', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  console.log(id, status);

  try {
    const updatedMemo = await prisma.memo.update({
      where: { id: id },
      data: { status },
    });

    res.status(200).json(updatedMemo);
  } catch (error) {
    console.error('Failed to change status:', error);
    res.status(500).json({ error: 'Failed to change status' });
  }
});

// Add this new route
router.patch('/:id/instruction', async (req, res) => {
  const { id } = req.params;
  const { instruction } = req.body;

  try {
    const updatedMemo = await prisma.memo.update({
      where: { id },
      data: {
        instruction,
        instruction_status: 'ASSIGNED',
      },
    });

    res.status(200).json(updatedMemo);
  } catch (error) {
    console.error('Failed to update instruction:', error);
    res.status(500).json({ error: 'Failed to update instruction' });
  }
});

export default router;
