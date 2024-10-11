import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db/prismaClient.js';

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  const { ci, username, password, firstName, lastName, office_id, role } =
    req.body;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ ci }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if the office exists
    const office = await prisma.office.findUnique({
      where: { id: office_id },
    });

    if (!office) {
      return res.status(400).json({ error: 'Invalid office ID' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        ci,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        office_id,
        role: role || 'USER',
      },
    });

    res
      .status(201)
      .json({ message: 'User created successfully', userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log(username, password);

  try {
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    console.log(user);

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    console.log('validPassword', validPassword);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create and send JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        office_id: user.office_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
