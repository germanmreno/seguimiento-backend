import express from 'express';
import prisma from '../db/prismaClient.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Create a new punto de cuenta
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { numero, tipo, fecha, presentante, asunto, decision, observacion } =
      req.body;

    // Validate required fields
    const requiredFields = [
      'numero',
      'tipo',
      'fecha',
      'presentante',
      'asunto',
      'decision',
      'observacion',
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Check if numero already exists
    const existingPunto = await prisma.puntoCuenta.findUnique({
      where: { numero },
    });

    if (existingPunto) {
      return res.status(400).json({
        error: 'Ya existe un punto de cuenta con este número',
      });
    }

    const puntoCuenta = await prisma.puntoCuenta.create({
      data: {
        numero,
        tipo,
        fecha: new Date(fecha),
        presentante,
        asunto,
        decision,
        observacion,
      },
    });

    res.status(201).json(puntoCuenta);
  } catch (error) {
    console.error('Error creating punto de cuenta:', error);
    res.status(500).json({ error: 'Error al crear el punto de cuenta' });
  }
});

// Get all puntos de cuenta
router.get('/', authenticateToken, async (req, res) => {
  try {
    const puntosCuenta = await prisma.puntoCuenta.findMany({
      orderBy: [{ fecha: 'desc' }, { numero: 'desc' }],
    });

    res.json(puntosCuenta);
  } catch (error) {
    console.error('Error fetching puntos de cuenta:', error);
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
    res.status(500).json({ error: 'Error al obtener el punto de cuenta' });
  }
});

export default router;
