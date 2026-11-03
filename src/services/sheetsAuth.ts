import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { TeacherAccount } from '../types';

export const SPREADSHEET_ID = '1lzQe8aBQXxv615t8-cR_BfHHtbVHHkPxbix_dlS9b-Y';
export const SHEET_TAB = 'TEACHERS_26';
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`;

export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// Standard Google Auth Provider (Requests identity profile + email without sensitive scopes)
// This prevents Google Workspace domain admin policy blocks for @gisboyshigh.net accounts.
const standardProvider = new GoogleAuthProvider();
standardProvider.setCustomParameters({
  prompt: 'select_account',
});

// Optional provider that includes Google Sheets scope when live sheet sync is requested
const sheetsProvider = new GoogleAuthProvider();
sheetsProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
sheetsProvider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;

export const getCachedAccessToken = () => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Initiates standard Google Sign-In with popup.
 * Extracts the authenticated Google account email (for Column C verification).
 * If an OAuth access token is present, caches it for optional sheet requests.
 */
export const signInWithGoogleAccount = async (requestSheetsScope = false): Promise<{
  user: User;
  accessToken?: string;
}> => {
  try {
    const providerToUse = requestSheetsScope ? sheetsProvider : standardProvider;
    const result = await signInWithPopup(auth, providerToUse);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || undefined;

    if (token) {
      cachedAccessToken = token;
    }

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
 * Per GBHS specification: Column C (index 2) contains verified Google account emails.
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
 * Parses raw pasted CSV or tab-delimited text from Google Sheets TEACHERS_26 tab.
 */
export const parseTeacherCsv = (csvText: string): TeacherAccount[] => {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = lines.map((line) => {
    // Split by tab or comma (handling quotes)
    if (line.includes('\t')) {
      return line.split('\t').map((c) => c.replace(/^["']|["']$/g, '').trim());
    }
    // simple CSV split
    return line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
  });

  return parseTeacherRows(rows);
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
