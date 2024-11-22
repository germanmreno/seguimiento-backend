import express from 'express';
import prisma from '../db/prismaClient.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all offices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const offices = await prisma.office.findMany({
      orderBy: {
        name: 'asc', // Sort offices by name
      },
    });

    res.json(offices);
  } catch (error) {
    console.error('Error fetching offices:', error);
    res.status(500).json({ error: 'Error al obtener las oficinas' });
  }
});

// Get a single office by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const office = await prisma.office.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!office) {
      return res.status(404).json({ error: 'Oficina no encontrada' });
    }

    res.json(office);
  } catch (error) {
    console.error('Error fetching office:', error);
    res.status(500).json({ error: 'Error al obtener la oficina' });
  }
});

export default router;
