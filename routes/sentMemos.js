import express from 'express';
import multer from 'multer';
import path from 'path';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import prisma from '../db/prismaClient.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/sent-memos');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Get all sent memos
router.get('/all', async (req, res) => {
  console.log(req);
  try {
    const memos = await prisma.sentMemo.findMany({
      orderBy: {
        createdAt: 'desc', // Sort by creation date
      },
    });
    console.log(memos);
    res.json(memos); // Return the memos as JSON
  } catch (error) {
    console.error('Error getting sent memos:', error);
    return res.status(500).json({ error: 'Failed to fetch sent memos' });
  }
});

// Create sent memo
router.post('/', upload.single('receptionImage'), async (req, res) => {
  try {
    const { title, registeredBy } = req.body;
    const imagePath = req.file.path;

    // Create the memo record
    const memo = await prisma.sentMemo.create({
      data: {
        title,
        registeredBy,
        receptionImage: imagePath,
      },
    });

    // Generate QR code with the complete URL
    const verificationUrl = `http://172.16.2.51:3005/verify/${memo.id}`;
    const qrPath = `uploads/qr-codes/${memo.id}.png`;
    await QRCode.toFile(qrPath, verificationUrl);

    // Add QR to PDF
    const pdfDoc = await PDFDocument.load(await fs.readFile(imagePath));
    const qrImage = await pdfDoc.embedPng(await fs.readFile(qrPath));

    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Add QR to bottom right corner
    page.drawImage(qrImage, {
      x: width - 100,
      y: 50,
      width: 80,
      height: 80,
    });

    // Save new PDF with QR
    const pdfWithQRPath = `uploads/pdfs-with-qr/${memo.id}.pdf`;
    await fs.writeFile(pdfWithQRPath, await pdfDoc.save());

    // Update memo with paths
    await prisma.sentMemo.update({
      where: { id: memo.id },
      data: {
        qrCode: qrPath,
        pdfWithQR: pdfWithQRPath,
      },
    });

    res.status(201).json(memo);
  } catch (error) {
    console.error('Error creating sent memo:', error);
    res.status(500).json({ error: 'Failed to create sent memo' });
  }
});

// Get verification page data
router.get('/verify/:id', async (req, res) => {
  try {
    const memo = await prisma.sentMemo.findUnique({
      where: { id: req.params.id },
    });

    if (!memo) {
      return res.status(404).json({ error: 'Memo not found' });
    }

    res.json(memo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memo' });
  }
});

export default router;
