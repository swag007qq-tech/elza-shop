import {getApp, getApps, initializeApp, type FirebaseApp} from 'firebase/app';
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
let contextPromise: Promise<FirestoreContext> | null = null;

async function fetchRuntimePublicConfig(): Promise<FirebaseEnvConfig | null> {
  try {
    const res = await fetch('/api/public-config');
    if (!res.ok) return null;
    const data = (await res.json()) as {firebase?: Partial<FirebaseEnvConfig>};
    const fb = data?.firebase;
    if (fb && fb.apiKey && fb.projectId) {
      return {
        apiKey: String(fb.apiKey || '').trim(),
        authDomain: String(fb.authDomain || '').trim(),
        projectId: String(fb.projectId || '').trim(),
        storageBucket: String(fb.storageBucket || '').trim(),
        messagingSenderId: String(fb.messagingSenderId || '').trim(),
        appId: String(fb.appId || '').trim(),
        databaseId: String(fb.databaseId || '').trim(),
      };
    }
  } catch {
    // Fallback to local applet config
  }
  return null;
}

async function testConnection(db: Firestore): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export async function resolveFirestoreContext(): Promise<FirestoreContext> {
  if (cachedContext) return cachedContext;
  if (contextPromise) return contextPromise;

  contextPromise = (async () => {
    const buildEnv = readBuildTimeFirebaseEnv();
    const hasBuildEnv = Boolean(buildEnv.apiKey && buildEnv.projectId);
    const runtimeEnv = hasBuildEnv ? buildEnv : await fetchRuntimePublicConfig();

    const usingCustomEnv = Boolean(runtimeEnv && runtimeEnv.apiKey && runtimeEnv.projectId);

    let app: FirebaseApp;
    let db: Firestore;

    if (usingCustomEnv && runtimeEnv) {
      app = getApps().length ? getApp() : initializeApp(runtimeEnv);
      const targetDbId =
        runtimeEnv.databaseId ||
        (runtimeEnv.projectId === fallbackConfig.projectId
          ? fallbackConfig.firestoreDatabaseId
          : '');
      db = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
    } else {
      app = getApps().length ? getApp() : initializeApp(fallbackConfig);
      db = fallbackConfig.firestoreDatabaseId
        ? getFirestore(app, fallbackConfig.firestoreDatabaseId)
        : getFirestore(app);
    }

    cachedContext = {app, db, usingCustomEnv};
    void testConnection(db);
    return cachedContext;
  })();

  return contextPromise;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
