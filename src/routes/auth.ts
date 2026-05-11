import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../lib/db';

const router = Router();

const JWT_SECRET = process.env['JWT_SECRET'] || 'seoai-secret-key-change-in-production';

interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  google_id: string | null;
  plan: string;
}

interface UserPayload {
  id: string;
  name: string;
  email: string;
  picture: string;
  plan: string;
}

function signToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

function dbUserToPayload(u: DbUser): UserPayload {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    picture: u.avatar ?? '',
    plan: u.plan,
  };
}

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body as { credential: string; clientId?: string };

    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    const payload = JSON.parse(
      Buffer.from(credential.split('.')[1], 'base64').toString()
    ) as Record<string, string>;

    const googleId = payload['sub'] || 'google-' + Date.now();
    const name = payload['name'] || 'Google User';
    const email = payload['email'] || 'user@gmail.com';
    const picture = payload['picture'] || '';

    let userPayload: UserPayload = { id: googleId, name, email, picture, plan: 'free' };

    try {
      const rows = await query<DbUser>(
        `INSERT INTO users (email, name, avatar, google_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (google_id) DO UPDATE
           SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, updated_at = NOW()
         RETURNING *`,
        [email, name, picture, googleId]
      );
      if (rows[0]) userPayload = dbUserToPayload(rows[0]);
    } catch (dbErr) {
      console.warn('[auth] DB upsert failed, using in-memory fallback:', (dbErr as Error).message);
    }

    const token = signToken(userPayload);
    res.json({ success: true, token, user: userPayload });
  } catch {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

// POST /api/auth/demo-login
router.post('/demo-login', async (req: Request, res: Response) => {
  const { name, email } = req.body as { name?: string; email?: string };

  const demoEmail = email || 'demo@seoai.vn';
  const demoName = name || 'Demo User';

  let userPayload: UserPayload = {
    id: 'demo-' + Date.now(),
    name: demoName,
    email: demoEmail,
    picture: '',
    plan: 'pro',
  };

  try {
    const rows = await query<DbUser>(
      `INSERT INTO users (email, name, avatar, google_id, plan)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, updated_at = NOW()
       RETURNING *`,
      [demoEmail, demoName, '', null, 'pro']
    );
    if (rows[0]) userPayload = dbUserToPayload(rows[0]);
  } catch (dbErr) {
    console.warn('[auth] DB demo-login failed, using in-memory fallback:', (dbErr as Error).message);
  }

  const token = signToken(userPayload);
  res.json({ success: true, token, user: userPayload });
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
