import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env['JWT_SECRET'] || 'seoai-secret-key-change-in-production';

// Mock user store
const mockUsers: Record<
  string,
  { id: string; name: string; email: string; picture: string; plan: string }
> = {};

// POST /api/auth/google
// Frontend sends the Google credential token, backend verifies and returns JWT
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential: string; clientId?: string };

    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    // Decode the Google JWT payload (base64). In production, verify with Google's public keys.
    const payload = JSON.parse(
      Buffer.from(credential.split('.')[1], 'base64').toString()
    ) as Record<string, string>;

    const user = {
      id: payload['sub'] || 'google-' + Date.now(),
      name: payload['name'] || 'Google User',
      email: payload['email'] || 'user@gmail.com',
      picture: payload['picture'] || '',
      plan: 'free',
    };

    mockUsers[user.id] = user;

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user });
  } catch {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

// POST /api/auth/demo-login (for testing without real Google)
router.post('/demo-login', (req: Request, res: Response) => {
  const { name, email } = req.body as { name?: string; email?: string };

  const user = {
    id: 'demo-' + Date.now(),
    name: name || 'Demo User',
    email: email || 'demo@seoai.vn',
    picture: '',
    plan: 'pro',
  };

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  res.json({ success: true, token, user });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
