import {getApp, getApps, initializeApp, type FirebaseApp} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import {doc, getDocFromServer, getFirestore, type Firestore} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirestoreContext {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let cachedContext: FirestoreContext | null = null;
let anonymousAuthPromise: Promise<User | null> | null = null;
let lastAuthErrorMessage: string | null = null;
let connectionTested = false;

async function testConnection(db: Firestore): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function resolveFirestoreContext(): FirestoreContext {
  if (cachedContext) return cachedContext;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
  const auth = getAuth(app);

  cachedContext = {app, auth, db};
  void testConnection(db);
  return cachedContext;
}

function formatFirebaseErrorText(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = 'code' in err && typeof err.code === 'string' ? err.code : '';
    const msg = 'message' in err && typeof err.message === 'string' ? err.message : '';
    if (code && msg) return `[${code}] ${msg}`;
    if (msg) return msg;
    if (code) return code;
  }
  return String(err || 'Unknown Firebase error');
}

export async function ensureAnonymousAuth(): Promise<User | null> {
  const {auth} = resolveFirestoreContext();
  if (auth.currentUser) {
    lastAuthErrorMessage = null;
    return auth.currentUser;
  }

  if (!anonymousAuthPromise) {
    anonymousAuthPromise = (async () => {
      const existing = await new Promise<User | null>((resolve) => {
        const unsub = onAuthStateChanged(
          auth,
          (user) => {
            unsub();
            resolve(user);
          },
          () => {
            unsub();
            resolve(null);
          },
        );
      });
      if (existing) {
        lastAuthErrorMessage = null;
        return existing;
      }
      try {
        const credential = await signInAnonymously(auth);
        lastAuthErrorMessage = null;
        return credential.user;
      } catch (err) {
        lastAuthErrorMessage = formatFirebaseErrorText(err);
        throw err;
      }
    })().finally(() => {
      anonymousAuthPromise = null;
    });
  }

  return anonymousAuthPromise;
}

export function getLastAuthErrorMessage(): string | null {
  return lastAuthErrorMessage;
}

export function getCurrentUid(): string | null {
  try {
    return cachedContext?.auth.currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const currentUser = cachedContext?.auth.currentUser ?? null;
  const rawError = formatFirebaseErrorText(error);
  const combinedError =
    lastAuthErrorMessage && !rawError.includes(lastAuthErrorMessage)
      ? `${rawError} (Auth: ${lastAuthErrorMessage})`
      : rawError;

  const errInfo: FirestoreErrorInfo = {
    error: combinedError,
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
