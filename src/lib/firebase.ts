import {getApp, getApps, initializeApp, type FirebaseApp} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import {doc, getDocFromServer, getFirestore, type Firestore} from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';

export interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId?: string;
}

export interface FirestoreContext {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  usingCustomEnv: boolean;
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

function readBuildTimeFirebaseEnv(): FirebaseEnvConfig {
  return {
    apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
    appId: String(import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
    databaseId: String(import.meta.env.VITE_FIREBASE_DATABASE_ID || '').trim(),
  };
}

let cachedContext: FirestoreContext | null = null;
let anonymousAuthPromise: Promise<User | null> | null = null;
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

  const envConfig = readBuildTimeFirebaseEnv();
  const usingCustomEnv = Boolean(envConfig.apiKey && envConfig.projectId);

  let app: FirebaseApp;
  let db: Firestore;

  if (usingCustomEnv) {
    app = getApps().length ? getApp() : initializeApp(envConfig);
    const targetDbId =
      envConfig.databaseId ||
      (envConfig.projectId === fallbackConfig.projectId
        ? fallbackConfig.firestoreDatabaseId
        : '');
    db = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
  } else {
    app = getApps().length ? getApp() : initializeApp(fallbackConfig);
    db = fallbackConfig.firestoreDatabaseId
      ? getFirestore(app, fallbackConfig.firestoreDatabaseId)
      : getFirestore(app);
  }

  const auth = getAuth(app);
  cachedContext = {app, auth, db, usingCustomEnv};
  void testConnection(db);
  return cachedContext;
}

export async function ensureAnonymousAuth(): Promise<User | null> {
  const {auth} = resolveFirestoreContext();
  if (auth.currentUser) return auth.currentUser;

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
      if (existing) return existing;
      const credential = await signInAnonymously(auth);
      return credential.user;
    })().finally(() => {
      anonymousAuthPromise = null;
    });
  }

  return anonymousAuthPromise;
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

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
