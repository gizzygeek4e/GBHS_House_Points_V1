import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { TeacherAccount } from '../types';

export const SPREADSHEET_ID = '1lzQe8aBQXxv615t8-cR_BfHHtbVHHkPxbix_dlS9b-Y';
export const SHEET_TAB = 'TEACHERS_26';
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;

export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;

export const getCachedAccessToken = () => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Initiates Google Sign-In with Sheets scope.
 */
export const signInWithGoogleSheets = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('Failed to acquire Google OAuth access token for Google Sheets.');
    }

    cachedAccessToken = token;
    return {
      user: result.user,
      accessToken: token,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logoutGoogle = async () => {
  cachedAccessToken = null;
  await signOut(auth);
};

/**
 * Parses raw 2D array of rows from Google Sheets into structured TeacherAccount items.
 * Per GBHS specification: Column C (index 2) contains the verified Google account emails.
 * Column A (index 0) contains staff names.
 * Column B (index 1) contains staff roles / houses.
 */
export const parseTeacherRows = (rows: any[][]): TeacherAccount[] => {
  if (!rows || rows.length === 0) return [];

  // Determine starting row: check if row 0 has header labels
  let startRow = 0;
  if (rows.length > 0) {
    const firstRowStr = rows[0].map((c) => String(c || '').toLowerCase()).join(' ');
    if (
      firstRowStr.includes('name') ||
      firstRowStr.includes('email') ||
      firstRowStr.includes('e-mail') ||
      firstRowStr.includes('mail') ||
      firstRowStr.includes('staff') ||
      firstRowStr.includes('teacher') ||
      firstRowStr.includes('account') ||
      firstRowStr.includes('google') ||
      firstRowStr.includes('role') ||
      firstRowStr.includes('house')
    ) {
      startRow = 1;
    }
  }

  const teachers: TeacherAccount[] = [];
  const seenEmails = new Set<string>();

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Primary: Column C is index 2 (A=0, B=1, C=2) - Verified Google Account Email
    let emailRaw = String(row[2] || '').trim().toLowerCase();

    // Fallback: If Column C is empty in a row, inspect other cells for an email pattern
    if (!emailRaw || !emailRaw.includes('@')) {
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim().toLowerCase();
        if (cell.includes('@') && cell.includes('.') && !cell.includes('email') && !cell.includes('google')) {
          emailRaw = cell;
          break;
        }
      }
    }

    // Must be a valid email format and not a duplicate
    if (!emailRaw || !emailRaw.includes('@') || !emailRaw.includes('.') || emailRaw.includes('email') || seenEmails.has(emailRaw)) {
      continue;
    }

    seenEmails.add(emailRaw);

    // Column A is Name (index 0)
    const rawName = row[0] ? String(row[0]).trim() : '';
    // Column B is Role / Department / House (index 1)
    const rawRole = row[1] ? String(row[1]).trim() : (row[3] ? String(row[3]).trim() : '');

    const name = rawName || emailRaw.split('@')[0].replace(/[._]/g, ' ');
    const role = rawRole || 'GBHS Staff';

    teachers.push({
      email: emailRaw,
      name,
      role,
      isSuperAdmin: emailRaw === 'hermanf@gisboyshigh.net',
    });
  }

  return teachers;
};

/**
 * Fetches the teacher list from the user's specified Google Sheet:
 * Spreadsheet ID: 1lzQe8aBQXxv615t8-cR_BfHHtbVHHkPxbix_dlS9b-Y
 * Tab: TEACHERS_26
 */
export const fetchTeachersFromSheet = async (accessToken: string): Promise<TeacherAccount[]> => {
  const range = encodeURIComponent(`${SHEET_TAB}!A1:Z100`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `Failed to fetch sheet: HTTP ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const rows = data.values || [];
  return parseTeacherRows(rows);
};
