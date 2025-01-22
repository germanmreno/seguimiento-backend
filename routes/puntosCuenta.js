import express from 'express';
import prisma from '../db/prismaClient.js';
import { authenticateToken } from './auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure upload directory
const uploadDir = path.join(__dirname, '../uploads/puntos-cuenta');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Tipo de archivo no permitido. Solo se permiten PDF y documentos de Word.'
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Create a new punto de cuenta
router.post('/', upload.single('documento_escaneado'), async (req, res) => {
  try {
    // Debug logs
    console.log('=== Received Request ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('=====================');

    // Validate numero exists and is not empty
    if (!req.body.numero) {
      console.log('Numero is missing or empty');
      return res.status(400).json({
        error: 'Número requerido',
        details: 'El campo número es requerido',
      });
    }

    const numeroValue = req.body.numero.toString().trim();
    console.log('Numero value for query:', numeroValue);

    // First check if the number already exists
    const existingPunto = await prisma.puntoCuenta.findUnique({
      where: {
        numero: numeroValue,
      },
    });

    if (existingPunto) {
      console.log('Found existing punto:', existingPunto);
      return res.status(400).json({
        error: 'Ya existe un Punto de Cuenta con este número',
        code: 'DUPLICATE_NUMBER',
      });
    }

    // Parse presentante
    let presentante;
    try {
      presentante = JSON.parse(req.body.presentante);
    } catch (e) {
      console.error('Error parsing presentante:', e);
      return res.status(400).json({
        error: 'Error en formato de presentante',
        details: e.message,
      });
    }

    // Create the data object
    const puntoData = {
      numero: numeroValue,
      tipo: req.body.tipo,
      fecha: new Date(req.body.fecha),
      presentante: presentante,
      asunto: req.body.asunto,
      decision: req.body.decision || 'PENDIENTE',
      observacion: req.body.observacion,
      documento_escaneado: req.file
        ? `/puntos-cuenta/${req.file.filename}`
        : null,
    };

    console.log('Creating punto with data:', puntoData);

    // Create the record
    const puntoCuenta = await prisma.puntoCuenta.create({
      data: puntoData,
    });

    console.log('Created punto:', puntoCuenta);
    res.status(201).json(puntoCuenta);
  } catch (error) {
    console.error('Error creating punto:', error);
    res.status(500).json({
      error: 'Error al crear el Punto de Cuenta',
      details: error.message,
    });
  }
});

// Add route to serve documents (similar to memos)
router.get('/documento/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Documento no encontrado' });
  }

  // Send file with proper headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

// Get all puntos de cuenta with file paths
router.get('/', authenticateToken, async (req, res) => {
  try {
    const puntos = await prisma.puntoCuenta.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    // Log retrieved puntos
    console.log('Retrieved puntos:', puntos);

    res.json(puntos);
  } catch (error) {
    console.error('Error fetching puntos:', error);
    res.status(500).json({ error: 'Error al obtener los puntos de cuenta' });
  }
});

// Get a single punto de cuenta by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const puntoCuenta = await prisma.puntoCuenta.findUnique({
      where: { id: req.params.id },
    });

    if (!puntoCuenta) {
      return res.status(404).json({ error: 'Punto de cuenta no encontrado' });
    }

    res.json(puntoCuenta);
  } catch (error) {
    console.error('Error fetching punto de cuenta:', error);
    res.status(500).json({
      error: 'Error al obtener el punto de cuenta',
      details: error.message,
    });
  }
});

export default router;
