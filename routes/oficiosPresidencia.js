import express from 'express';
import prisma from '../db/prismaClient.js';
import { authenticateToken } from './auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = 'uploads/oficios-presidencia';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Debug middleware
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    files: req.files,
  });
  next();
});

// Create a new oficio
router.post(
  '/',
  authenticateToken,
  upload.single('documento_escaneado'),
  async (req, res) => {
    try {
      console.log('Received request to create oficio:', {
        body: req.body,
        file: req.file,
      });

      const {
        numero,
        elaboradoPor,
        institucion,
        destinatario,
        asunto,
        fechaElaboracion,
        fechaEntrega,
        requiereRespuesta,
      } = req.body;

      // Create the oficio
      const oficio = await prisma.oficioPresidencia.create({
        data: {
          numero,
          elaboradoPor: elaboradoPor,
          institucion,
          destinatario,
          asunto,
          fechaElaboracion: new Date(fechaElaboracion),
          fechaEntrega: new Date(fechaEntrega),
          requiereRespuesta: requiereRespuesta === 'true',
          status: 'PENDIENTE',
          documento_escaneado: req.file
            ? `/uploads/oficios-presidencia/${req.file.filename}`
            : null,
        },
      });

      res.status(201).json(oficio);
    } catch (error) {
      console.error('Error creating oficio:', error);
      res
        .status(500)
        .json({ error: 'Error al crear el oficio', details: error.message });
    }
  }
);

// Get all oficios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const oficios = await prisma.oficioPresidencia.findMany({
      orderBy: [{ fechaEntrega: 'desc' }, { created_at: 'desc' }],
    });
    res.json(oficios);
  } catch (error) {
    console.error('Error fetching oficios:', error);
    res.status(500).json({ error: 'Error al obtener los oficios' });
  }
});

// Get a single oficio
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const oficio = await prisma.oficioPresidencia.findUnique({
      where: { id: req.params.id },
    });

    if (!oficio) {
      return res.status(404).json({ error: 'Oficio no encontrado' });
    }

    res.json(oficio);
  } catch (error) {
    console.error('Error fetching oficio:', error);
    res.status(500).json({ error: 'Error al obtener el oficio' });
  }
});

// Update oficio status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['FINALIZADO', 'PENDIENTE'].includes(status)) {
      return res.status(400).json({
        error: 'Estado inválido. Debe ser FINALIZADO o PENDIENTE',
      });
    }

    const updatedOficio = await prisma.oficioPresidencia.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updatedOficio);
  } catch (error) {
    console.error('Error updating oficio status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del oficio' });
  }
});

export default router;
