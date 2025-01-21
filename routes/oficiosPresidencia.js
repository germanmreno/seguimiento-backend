import express from 'express';
import prisma from '../db/prismaClient.js';
import { authenticateToken } from './auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/oficios-presidencia');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Create a new oficio with file upload
router.post(
  '/',
  authenticateToken,
  upload.array('documento_escaneado'),
  async (req, res) => {
    try {
      const {
        institucion,
        destinatario,
        asunto,
        fechaElaboracion,
        fechaEntrega,
        requiereRespuesta,
        status,
      } = req.body;

      // Validate required fields
      const requiredFields = [
        'institucion',
        'destinatario',
        'asunto',
        'fechaElaboracion',
        'fechaEntrega',
        'requiereRespuesta',
      ];
      const missingFields = requiredFields.filter(
        (field) => req.body[field] === undefined
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        });
      }

      // Validate status if provided
      if (status && !['FINALIZADO', 'PENDIENTE'].includes(status)) {
        return res.status(400).json({
          error: 'Estado inválido. Debe ser FINALIZADO o PENDIENTE',
        });
      }

      // Process uploaded files
      const documentUrls = req.files
        ? req.files.map(
            (file) => `/uploads/oficios-presidencia/${file.filename}`
          )
        : [];

      const oficio = await prisma.oficioPresidencia.create({
        data: {
          institucion,
          destinatario,
          asunto,
          fechaElaboracion: new Date(fechaElaboracion),
          fechaEntrega: new Date(fechaEntrega),
          requiereRespuesta,
          status: status || 'PENDIENTE',
          documento_escaneado: documentUrls.length > 0 ? documentUrls[0] : null, // Store the first file URL
        },
      });

      res.status(201).json(oficio);
    } catch (error) {
      console.error('Error creating oficio:', error);
      res.status(500).json({ error: 'Error al crear el oficio' });
    }
  }
);

// Get all oficios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    const oficios = await prisma.oficioPresidencia.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ fechaEntrega: 'desc' }, { fechaElaboracion: 'desc' }],
    });

    res.json(oficios);
  } catch (error) {
    console.error('Error fetching oficios:', error);
    res.status(500).json({ error: 'Error al obtener los oficios' });
  }
});

// Get a single oficio by ID
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
