import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, {type NextFunction, type Request, type Response} from 'express';

dotenv.config();

const PORT = 3000;
const ROOT_DIR = process.cwd();
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'public', 'uploads');
const ADMIN_HASH_FILE = path.resolve(ROOT_DIR, '.admin-auth.json');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredHashRecord {
  salt: string;
  hash: string;
}

let cachedHashRecord: StoredHashRecord | null = null;

function getFirebasePublicEnv() {
  return {
    apiKey: (process.env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: (process.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (process.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (process.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: (process.env.VITE_FIREBASE_APP_ID || '').trim(),
    databaseId: (process.env.VITE_FIREBASE_DATABASE_ID || '').trim(),
  };
}

function loadStoredHash(): StoredHashRecord | null {
  if (cachedHashRecord) return cachedHashRecord;
  try {
    if (!fs.existsSync(ADMIN_HASH_FILE)) return null;
    const raw = fs.readFileSync(ADMIN_HASH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredHashRecord>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
      cachedHashRecord = {salt: parsed.salt, hash: parsed.hash};
      return cachedHashRecord;
    }
  } catch {
    // Ignore malformed file
  }
  return null;
}

function saveStoredHash(password: string): StoredHashRecord {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  const record = {salt, hash};
  fs.writeFileSync(ADMIN_HASH_FILE, JSON.stringify(record), {encoding: 'utf8', mode: 0o600});
  cachedHashRecord = record;
  return record;
}

function getEnvPasscode(): string {
  return (process.env.ADMIN_PASSCODE || '').trim();
}

function verifyPassword(candidate: string): boolean {
  const envPasscode = getEnvPasscode();
  if (envPasscode.length > 0) {
    const a = Buffer.from(candidate, 'utf8');
    const b = Buffer.from(envPasscode, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
  const stored = loadStoredHash();
  if (!stored) return false;
  const candidateHash = crypto.scryptSync(candidate, stored.salt, 64);
  const storedBuf = Buffer.from(stored.hash, 'hex');
  if (candidateHash.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(candidateHash, storedBuf);
}

function signAdminToken(): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({role: 'admin', exp})).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const a = Buffer.from(sig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match || !verifyAdminToken(match[1])) {
    res.status(401).json({error: 'Требуется авторизация администратора'});
    return;
  }
  next();
}

function detectImageExtension(buf: Buffer): 'png' | 'jpg' | 'webp' | 'gif' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'png';
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'jpg';
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return 'gif';
  }
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

async function startServer() {
  fs.mkdirSync(UPLOADS_DIR, {recursive: true});

  const app = express();
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/public-config', (_req, res) => {
    const firebase = getFirebasePublicEnv();
    res.json({
      firebase,
      customFirebaseConfigured: Boolean(firebase.apiKey && firebase.projectId),
    });
  });

  app.get('/api/admin/status', (req, res) => {
    const envSet = getEnvPasscode().length > 0;
    const configured = envSet || loadStoredHash() !== null;
    const header = req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    const authenticated = Boolean(match && verifyAdminToken(match[1]));
    res.json({configured, authenticated});
  });

  app.post('/api/admin/claim', express.json({limit: '16kb'}), (req, res) => {
    if (getEnvPasscode().length > 0 || loadStoredHash() !== null) {
      res.status(409).json({error: 'Пароль администратора уже настроен'});
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (password.length < 4 || password.length > 128) {
      res.status(400).json({error: 'Пароль должен быть длиной от 4 до 128 символов'});
      return;
    }
    saveStoredHash(password);
    const token = signAdminToken();
    res.json({ok: true, token});
  });

  app.post('/api/admin/login', express.json({limit: '16kb'}), (req, res) => {
    const envSet = getEnvPasscode().length > 0;
    const configured = envSet || loadStoredHash() !== null;
    if (!configured) {
      res.status(409).json({error: 'Пароль администратора ещё не задан'});
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
    if (!password || !verifyPassword(password)) {
      res.status(401).json({error: 'Неверный пароль администратора'});
      return;
    }
    const token = signAdminToken();
    res.json({ok: true, token});
  });

  app.post('/api/admin/upload', express.json({limit: '6mb'}), requireAdminToken, (req, res) => {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({error: 'Некорректный формат изображения (разрешены PNG, JPG, WEBP, GIF)'});
      return;
    }
    const buf = Buffer.from(match[1], 'base64');
    if (buf.length === 0 || buf.length > 4 * 1024 * 1024) {
      res.status(400).json({error: 'Размер файла не должен превышать 4 МБ'});
      return;
    }
    const ext = detectImageExtension(buf);
    if (!ext) {
      res.status(400).json({error: 'Файл не является допустимым изображением'});
      return;
    }

    const fileName = `${crypto.randomUUID()}.${ext}`;
    const targetPath = path.resolve(UPLOADS_DIR, fileName);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({error: 'Invalid target path'});
      return;
    }
    fs.writeFileSync(targetPath, buf);
    res.json({url: `/uploads/${fileName}`});
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
