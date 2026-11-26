import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  setLogLevel,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress internal SDK transient offline/WebChannel retry console noise;
// real permission and write errors are surfaced cleanly via handleFirestoreError.
setLogLevel('silent');

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Force HTTPS long polling for reliable connectivity across mobile networks, school firewalls, and proxies,
// and enable multi-tab offline persistence with safe fallback to memory cache.
let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache(),
    },
    firebaseConfig.firestoreDatabaseId
  );
}

export const db = dbInstance;

// Initialize Firebase Auth
export const auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';

  // Handle transient offline or connection drops gracefully without crashing the applet
  const isNetworkUnavailable =
    errCode === 'unavailable' ||
    errMsg.includes('offline') ||
    errMsg.includes('Could not reach Cloud Firestore') ||
    errMsg.includes('backend. Connection failed');

  const isPermissionError =
    errCode === 'permission-denied' ||
    errMsg.includes('permission') ||
    errMsg.includes('Permission');

  if (isNetworkUnavailable && !isPermissionError) {
    console.warn(`Firestore operating in offline/cached mode for ${operationType} on ${path}:`, errMsg);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
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

// Test connection on boot as recommended in Firebase guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    await getDocFromServer(doc(db, 'pointEvents', 'connection-check'));
    return true;
  } catch (error) {
    // Offline/unavailable connections are handled gracefully by Firestore's local cache
    return false;
  }
}
