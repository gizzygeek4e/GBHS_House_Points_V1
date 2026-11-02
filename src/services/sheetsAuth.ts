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
 */
export const parseTeacherRows = (rows: any[][]): TeacherAccount[] => {
  if (!rows || rows.length === 0) return [];

  // Identify column indices from header row
  let headerIndex = -1;
  let emailCol = -1;
  let nameCol = -1;
  let roleCol = -1;

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').toLowerCase().trim();
      if (val.includes('email') || val.includes('e-mail') || val.includes('mail')) {
        emailCol = c;
        headerIndex = r;
      }
      if (val.includes('name') || val.includes('teacher') || val.includes('staff')) {
        nameCol = c;
        headerIndex = r;
      }
      if (val.includes('role') || val.includes('house') || val.includes('position') || val.includes('title')) {
        roleCol = c;
      }
    }
    if (emailCol !== -1) break;
  }

  // If no header with "email" was explicitly found, infer from data where cells contain '@'
  if (emailCol === -1) {
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const val = String(rows[r][c] || '').trim();
        if (val.includes('@') && val.includes('.')) {
          emailCol = c;
          headerIndex = Math.max(0, r - 1);
          break;
        }
      }
      if (emailCol !== -1) break;
    }
  }

  // Default fallbacks if columns not explicitly labeled
  if (emailCol === -1) emailCol = 0;
  if (nameCol === -1) nameCol = emailCol === 0 ? 1 : 0;
  if (roleCol === -1) roleCol = 2;

  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;
  const teachers: TeacherAccount[] = [];
  const seenEmails = new Set<string>();

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const emailRaw = String(row[emailCol] || '').trim().toLowerCase();
    // Validate email format
    if (!emailRaw || !emailRaw.includes('@') || emailRaw.includes('email') || seenEmails.has(emailRaw)) {
      continue;
    }

    seenEmails.add(emailRaw);
    const rawName = row[nameCol] ? String(row[nameCol]).trim() : '';
    const rawRole = row[roleCol] ? String(row[roleCol]).trim() : '';

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
