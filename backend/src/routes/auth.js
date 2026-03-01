import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

router.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort erforderlich.' });
    }

    const validEmail = process.env.AUTH_EMAIL;
    const validHash = process.env.AUTH_PASSWORD_HASH;

    if (email.toLowerCase() !== validEmail.toLowerCase()) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    }

    const match = await bcrypt.compare(password, validHash);
    if (!match) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
    }

    const token = jwt.sign(
      { email: validEmail },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, email: validEmail });
  })
);

router.get(
  '/verify',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({ valid: true, email: decoded.email });
    } catch {
      res.status(401).json({ valid: false });
    }
  })
);

export default router;
