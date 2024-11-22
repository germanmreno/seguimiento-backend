import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db/prismaClient.js';

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { ci, username, password, firstName, lastName, office_id, role } =
      req.body;

    // Validate if office exists
    const office = await prisma.office.findUnique({
      where: { id: office_id },
    });

    if (!office) {
      return res.status(400).json({ error: 'Invalid office ID' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ ci }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User with this CI or username already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with optional role parameter
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(), // Generate a unique ID
        ci,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        office_id,
        role: role || 'USER', // Use provided role or default to USER
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
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

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        office_id: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Export only the router as default
export default router;
