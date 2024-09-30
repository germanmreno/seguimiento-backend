import express from 'express';
import prisma from '../db/prismaClient.js';

const router = express.Router();

// Create a new memo
router.post('/', async (req, res) => {
  const {
    id,
    name,
    applicant,
    reception_method,
    instruction,
    response_require,
    urgency,
    observation,
    reception_date,
    reception_hour,
    attachment,
    status,
    officeIds,
  } = req.body;

  try {
    const memo = await prisma.memo.create({
      data: {
        id,
        name,
        applicant,
        reception_method,
        instruction,
        response_require,
        urgency,
        observation,
        reception_date: reception_date,
        reception_hour: reception_hour,
        attachment,
        status,
        offices: {
          create: officeIds.map((officeId) => ({
            office: {
              connect: { id: officeId },
            },
          })),
        },
      },
    });
    res.status(201).json(memo);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    });
    res.status(200).json(memos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
