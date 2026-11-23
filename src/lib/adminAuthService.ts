import {doc, getDoc, serverTimestamp, setDoc} from 'firebase/firestore';
import {
  OperationType,
  ensureAnonymousAuth,
  handleFirestoreError,
  resolveFirestoreContext,
} from './firebase';

const ADMIN_CONFIG_COLLECTION = 'app_config';
const ADMIN_CONFIG_DOC_ID = 'admin';
const ADMIN_CONFIG_PATH = `${ADMIN_CONFIG_COLLECTION}/${ADMIN_CONFIG_DOC_ID}`;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSaltHex(byteLength = 16): string {
  const buf = new Uint8Array(byteLength);
  window.crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

async function derivePbkdf2Hash(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltHex),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

async function deriveLegacySha256Hash(password: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${saltHex}:${password}`),
  );
  return bytesToHex(new Uint8Array(digest));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function checkAdminPasswordConfigured(): Promise<boolean> {
  try {
    await ensureAnonymousAuth().catch(() => null);
    const {db} = resolveFirestoreContext();
    const snap = await getDoc(doc(db, ADMIN_CONFIG_COLLECTION, ADMIN_CONFIG_DOC_ID));
    if (!snap.exists()) return false;
    const data = snap.data();
    return (
      typeof data?.salt === 'string' &&
      data.salt.length >= 8 &&
      typeof data?.passwordHash === 'string' &&
      data.passwordHash.length >= 32
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ADMIN_CONFIG_PATH);
  }
}

export async function claimOrUpdateAdminPassword(password: string): Promise<void> {
  const trimmed = password.trim();
  if (trimmed.length < 4 || trimmed.length > 128) {
    throw new Error('Пароль должен быть длиной от 4 до 128 символов');
  }

  let uid = 'admin';
  try {
    const user = await ensureAnonymousAuth();
    if (user?.uid) uid = user.uid;
  } catch (authError) {
    // Allow Firestore rules to decide if Anonymous Auth is disabled in console
    const code = (authError as {code?: string})?.code || '';
    if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
      console.warn('Anonymous auth not enabled in Firebase Console:', code);
    }
  }

  const salt = generateSaltHex(16);
  const passwordHash = await derivePbkdf2Hash(trimmed, salt);

  try {
    const {db} = resolveFirestoreContext();
    await setDoc(doc(db, ADMIN_CONFIG_COLLECTION, ADMIN_CONFIG_DOC_ID), {
      salt,
      passwordHash,
      algorithm: 'pbkdf2-sha256',
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ADMIN_CONFIG_PATH);
  }
}

export async function verifyAdminPasswordInFirestore(password: string): Promise<boolean> {
  const trimmed = password.trim();
  if (!trimmed) return false;

  try {
    await ensureAnonymousAuth().catch(() => null);
    const {db} = resolveFirestoreContext();
    const snap = await getDoc(doc(db, ADMIN_CONFIG_COLLECTION, ADMIN_CONFIG_DOC_ID));
    if (!snap.exists()) return false;

    const data = snap.data();
    const salt = typeof data?.salt === 'string' ? data.salt : '';
    const storedHash = typeof data?.passwordHash === 'string' ? data.passwordHash : '';
    const algorithm = typeof data?.algorithm === 'string' ? data.algorithm : 'pbkdf2-sha256';
    if (!salt || !storedHash) return false;

    const candidateHash =
      algorithm === 'sha256'
        ? await deriveLegacySha256Hash(trimmed, salt)
        : await derivePbkdf2Hash(trimmed, salt);

    return timingSafeEqualHex(candidateHash, storedHash);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ADMIN_CONFIG_PATH);
  }
}
