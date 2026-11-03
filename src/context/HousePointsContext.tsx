import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, testFirestoreConnection } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { House, HouseId, PointEvent, TeacherUser, TeacherAccount, SchoolTerm, PointCategory } from '../types';
import { INITIAL_HOUSES, INITIAL_POINT_EVENTS, INITIAL_AUTHORIZED_TEACHERS } from '../data/initialData';
import { soundManager } from '../utils/audio';
import {
  signInWithGoogleAccount,
  fetchTeachersFromSheet,
  logoutGoogle,
  getCachedAccessToken,
  setCachedAccessToken,
} from '../services/sheetsAuth';

const STORAGE_EVENTS_KEY = 'gbhs_house_points_events_v3';
const STORAGE_AUTH_KEY = 'gbhs_teacher_auth_v3';
const STORAGE_SHEET_TEACHERS_KEY = 'gbhs_sheet_teachers_v3';

export type AppView = 'assembly' | 'teacher-login' | 'teacher-portal';

interface HousePointsContextType {
  houses: House[];
  rawHouses: Record<HouseId, House>;
  events: PointEvent[];
  filteredEvents: PointEvent[];
  selectedTerm: SchoolTerm;
  setSelectedTerm: (term: SchoolTerm) => void;
  selectedCategory: PointCategory | 'All Categories';
  setSelectedCategory: (cat: PointCategory | 'All Categories') => void;
  teacherUser: TeacherUser | null;
  authorizedTeachers: TeacherAccount[];
  updateAuthorizedTeachers: (teachers: TeacherAccount[]) => Promise<void>;
  addAuthorizedTeacher: (teacher: TeacherAccount) => Promise<void>;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithPasscode: (email: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  logoutTeacher: () => void;
  syncSheetTeachers: () => Promise<void>;
  isSyncingSheet: boolean;
  sheetSyncError: string | null;
  sheetLastSynced: number | null;
  addPoints: (data: Omit<PointEvent, 'id' | 'timestamp'>) => Promise<void>;
  deletePointEvent: (id: string) => Promise<void>;
  editPointEvent: (id: string, updated: Partial<PointEvent>) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  clearAllPoints: () => Promise<void>;
  exportLedgerCSV: () => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  triggerConfetti: (colors?: string[]) => void;
  currentLeader: House;
}

const HousePointsContext = createContext<HousePointsContextType | undefined>(undefined);

export const HousePointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<AppView>('assembly');

  // Load events (initial local cache or fallback to initial)
  const [events, setEvents] = useState<PointEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_POINT_EVENTS;
  });

  // Authorized teachers loaded from Google Sheet (TEACHERS_26 tab, Column C)
  const [authorizedTeachers, setAuthorizedTeachers] = useState<TeacherAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHEET_TEACHERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_AUTHORIZED_TEACHERS;
  });

  // Teacher user session (authenticated via Google)
  const [teacherUser, setTeacherUser] = useState<TeacherUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  // Google Sheet Sync Status
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncError, setSheetSyncError] = useState<string | null>(null);
  const [sheetLastSynced, setSheetLastSynced] = useState<number | null>(null);

  // Filters
  const [selectedTerm, setSelectedTerm] = useState<SchoolTerm>('All Year');
  const [selectedCategory, setSelectedCategory] = useState<PointCategory | 'All Categories'>('All Categories');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(soundManager.getEnabled());
  const [prevLeaderId, setPrevLeaderId] = useState<HouseId | null>(null);

  // Persist state to local cache for offline instant startup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
    } catch {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SHEET_TEACHERS_KEY, JSON.stringify(authorizedTeachers));
    } catch {}
  }, [authorizedTeachers]);

  useEffect(() => {
    try {
      if (teacherUser && teacherUser.email) {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(teacherUser));
      } else {
        localStorage.removeItem(STORAGE_AUTH_KEY);
      }
    } catch {}
  }, [teacherUser]);

  // Enforce authentic Google Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Check if logged in via verified staff passcode fallback
      let isPasscodeAuth = false;
      try {
        const saved = localStorage.getItem(STORAGE_AUTH_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.isPasscodeAuth) isPasscodeAuth = true;
        }
      } catch {}

      if (isPasscodeAuth) {
        return;
      }

      if (!firebaseUser) {
        setTeacherUser(null);
        setCachedAccessToken(null);
        try {
          localStorage.removeItem(STORAGE_AUTH_KEY);
        } catch {}
      } else {
        const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
        const isOwner = cleanEmail === 'hermanf@gisboyshigh.net';
        const isListed =
          authorizedTeachers.some((t) => t.email.toLowerCase() === cleanEmail) ||
          INITIAL_AUTHORIZED_TEACHERS.some((t) => t.email.toLowerCase() === cleanEmail);

        // Only revoke if definitely not authorized
        if (!isOwner && !isListed && authorizedTeachers.length > 0) {
          try {
            await logoutGoogle();
          } catch {}
          setTeacherUser(null);
          try {
            localStorage.removeItem(STORAGE_AUTH_KEY);
          } catch {}
        }
      }
    });

    return () => unsubscribeAuth();
  }, [authorizedTeachers]);

  // LIVE FIRESTORE REAL-TIME SYNC
  // Connects all community screens, assembly projectors, student phones, and staff laptops
  useEffect(() => {
    testFirestoreConnection();

    const eventsRef = collection(db, 'pointEvents');
    const eventsQuery = query(eventsRef, orderBy('timestamp', 'desc'));

    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is fresh and empty, auto-seed initial events
          try {
            const batch = writeBatch(db);
            INITIAL_POINT_EVENTS.forEach((ev) => {
              const docRef = doc(db, 'pointEvents', ev.id);
              batch.set(docRef, ev);
            });
            await batch.commit();
          } catch (seedErr) {
            console.warn('Initial Firestore seed note:', seedErr);
          }
          return;
        }

        const liveEvents: PointEvent[] = [];
        snapshot.forEach((d) => {
          liveEvents.push(d.data() as PointEvent);
        });

        setEvents(liveEvents);
      },
      (error) => {
        console.error('Real-time points sync error:', error);
        handleFirestoreError(error, OperationType.GET, 'pointEvents');
      }
    );

    // Sync authorized teacher roster across devices from Firestore
    const teachersRef = collection(db, 'authorizedTeachers');
    const unsubscribeTeachers = onSnapshot(
      teachersRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          const liveTeachers: TeacherAccount[] = [];
          snapshot.forEach((d) => {
            liveTeachers.push(d.data() as TeacherAccount);
          });
          setAuthorizedTeachers(liveTeachers);
        } else {
          // Pre-seed default teachers to Firestore
          try {
            const batch = writeBatch(db);
            INITIAL_AUTHORIZED_TEACHERS.forEach((t) => {
              const docId = t.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
              batch.set(doc(db, 'authorizedTeachers', docId), {
                email: t.email,
                name: t.name,
                role: t.role,
                isSuperAdmin: !!t.isSuperAdmin,
                updatedAt: Date.now(),
              });
            });
            await batch.commit();
          } catch (err) {
            console.warn('Initial teacher roster seed note:', err);
          }
        }
      },
      (error) => {
        console.warn('Real-time teachers sync warning:', error);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeTeachers();
    };
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchTerm = selectedTerm === 'All Year' || ev.term === selectedTerm;
      const matchCategory = selectedCategory === 'All Categories' || ev.category === selectedCategory;
      return matchTerm && matchCategory;
    });
  }, [events, selectedTerm, selectedCategory]);

  // Compute houses with live totals
  const computedHouses = useMemo(() => {
    const totals: Record<HouseId, number> = {
      tawhirimatea: 0,
      tumatauenga: 0,
      tangaroa: 0,
      tanemahuta: 0,
    };

    filteredEvents.forEach((ev) => {
      if (totals[ev.houseId] !== undefined) {
        totals[ev.houseId] += ev.points;
      }
    });

    const houseList: House[] = Object.keys(INITIAL_HOUSES).map((idKey) => {
      const id = idKey as HouseId;
      const base = INITIAL_HOUSES[id];
      return {
        ...base,
        currentTotal: totals[id] || 0,
        rank: 0,
      };
    });

    houseList.sort((a, b) => b.currentTotal - a.currentTotal);

    let currentRank = 1;
    for (let i = 0; i < houseList.length; i++) {
      if (i > 0 && houseList[i].currentTotal < houseList[i - 1].currentTotal) {
        currentRank = i + 1;
      }
      houseList[i].rank = currentRank;
    }

    return houseList;
  }, [filteredEvents]);

  const rawHouses = useMemo(() => {
    const map = {} as Record<HouseId, House>;
    computedHouses.forEach((h) => {
      map[h.id] = h;
    });
    return map;
  }, [computedHouses]);

  const currentLeader = computedHouses[0] || computedHouses[0];

  // Confetti helper
  const triggerConfetti = useCallback((colors?: string[]) => {
    const houseColors = colors || ['#dc2626', '#eab308', '#84cc16', '#a2207e', '#ffffff'];
    try {
      confetti({
        particleCount: 85,
        spread: 80,
        origin: { y: 0.55 },
        colors: houseColors,
      });
    } catch {}
  }, []);

  // Leader celebration check
  useEffect(() => {
    if (computedHouses.length > 0) {
      const leader = computedHouses[0];
      if (prevLeaderId && prevLeaderId !== leader.id && leader.currentTotal > 0) {
        triggerConfetti([leader.primaryColor, leader.secondaryColor, '#ffffff']);
        soundManager.playLeadCelebration();
      }
      setPrevLeaderId(leader.id);
    }
  }, [computedHouses, prevLeaderId, triggerConfetti]);

  // Update authorized teachers list in memory and sync to Firestore
  const updateAuthorizedTeachers = async (newTeachers: TeacherAccount[]) => {
    setAuthorizedTeachers(newTeachers);
    try {
      const batch = writeBatch(db);
      newTeachers.forEach((t) => {
        const docId = t.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
        batch.set(
          doc(db, 'authorizedTeachers', docId),
          {
            email: t.email.toLowerCase().trim(),
            name: t.name.trim(),
            role: t.role.trim() || 'GBHS Staff',
            isSuperAdmin: t.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net' || !!t.isSuperAdmin,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    } catch (err) {
      console.warn('Error saving teachers to Firestore:', err);
    }
  };

  // Add single authorized teacher
  const addAuthorizedTeacher = async (teacher: TeacherAccount) => {
    const cleanEmail = teacher.email.toLowerCase().trim();
    const updated = [
      ...authorizedTeachers.filter((t) => t.email.toLowerCase() !== cleanEmail),
      {
        ...teacher,
        email: cleanEmail,
        isSuperAdmin: cleanEmail === 'hermanf@gisboyshigh.net' || !!teacher.isSuperAdmin,
      },
    ];
    await updateAuthorizedTeachers(updated);
  };

  // Sync teachers directly from Google Sheet (tab TEACHERS_26) if token is available
  const syncSheetTeachers = async () => {
    const token = getCachedAccessToken();
    if (!token) {
      setSheetSyncError('No Google Sheets access token available. Use manual import or sign in with Google permissions.');
      return;
    }

    setIsSyncingSheet(true);
    setSheetSyncError(null);

    try {
      const sheetTeachers = await fetchTeachersFromSheet(token);
      if (sheetTeachers && sheetTeachers.length > 0) {
        await updateAuthorizedTeachers(sheetTeachers);
        setSheetLastSynced(Date.now());
      }
    } catch (err: any) {
      console.warn('Sheet sync warning:', err);
      setSheetSyncError(err?.message || 'Unable to sync spreadsheet rows.');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  /**
   * Primary Teacher Google Login Flow:
   * 1. Signs in via genuine Google OAuth popup using standard profile and email scopes.
   *    (Avoids Google Workspace unverified app blocking for @gisboyshigh.net domain accounts).
   * 2. Checks user's verified Google account email against Column C of the TEACHERS_26 sheet roster.
   * 3. hermanf@gisboyshigh.net is recognized as Dean & SuperAdmin.
   * 4. Only allows access if the signed-in user's email matches an email in Column C.
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsSyncingSheet(true);
    setSheetSyncError(null);

    try {
      // 1. Google OAuth Sign-In Popup with standard profile/email permissions
      const { user, accessToken } = await signInWithGoogleAccount(false);
      const userEmail = (user.email || '').trim().toLowerCase();

      if (!userEmail) {
        await logoutGoogle();
        return {
          success: false,
          error: 'No email address was returned by Google. Please ensure you sign in with your school Google account.',
        };
      }

      // 2. Combine current live roster and initial roster
      const allKnown = [...authorizedTeachers];
      INITIAL_AUTHORIZED_TEACHERS.forEach((initT) => {
        if (!allKnown.some((t) => t.email.toLowerCase() === initT.email.toLowerCase())) {
          allKnown.push(initT);
        }
      });

      // Attempt optional sheet sync if accessToken was returned
      if (accessToken) {
        try {
          const fetched = await fetchTeachersFromSheet(accessToken);
          if (fetched && fetched.length > 0) {
            await updateAuthorizedTeachers(fetched);
            setSheetLastSynced(Date.now());
            fetched.forEach((f) => {
              if (!allKnown.some((t) => t.email.toLowerCase() === f.email.toLowerCase())) {
                allKnown.push(f);
              }
            });
          }
        } catch (sheetErr: any) {
          console.warn('Sheet fetch note (using cached roster):', sheetErr?.message);
        }
      }

      // 3. Check if user's Google email is registered in Column C of TEACHERS_26
      const matchedTeacher = allKnown.find(
        (t) => t.email.toLowerCase() === userEmail
      );

      // School Dean / Owner verification: hermanf@gisboyshigh.net
      const isOwner = userEmail === 'hermanf@gisboyshigh.net';

      if (!matchedTeacher && !isOwner) {
        // Revoke Google session immediately
        await logoutGoogle();
        setTeacherUser(null);
        try {
          localStorage.removeItem(STORAGE_AUTH_KEY);
        } catch {}

        return {
          success: false,
          error: `Access Denied: You signed in as "${userEmail}". Only teachers whose Google email is in Column C of the TEACHERS_26 Google Sheet are authorized to award points. If you have another Google account, please click "Sign In with Google Account" and select your school email.`,
        };
      }

      const teacherName = matchedTeacher?.name || user.displayName || (isOwner ? 'Herman F.' : 'GBHS Teacher');
      const teacherRole = matchedTeacher?.role || (isOwner ? 'Dean of Houses & Sports Coordinator' : 'Staff & House Dean');

      const authenticatedUser: TeacherUser = {
        email: userEmail,
        name: teacherName,
        role: teacherRole,
        picture: user.photoURL || undefined,
        token: accessToken,
        isTeacher: true,
      };

      setTeacherUser(authenticatedUser);
      setCurrentView('teacher-portal');
      soundManager.playClick();
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Clean up on failure
      try {
        await logoutGoogle();
      } catch {}
      setTeacherUser(null);

      let friendlyError = err?.message || 'Failed to sign in with Google.';
      if (err?.code === 'auth/unauthorized-domain') {
        friendlyError = `Domain Authorization Required: The domain "${window.location.hostname}" is not yet added to Firebase Authentication Authorized Domains. Please add "${window.location.hostname}" in Firebase Console -> Authentication -> Settings -> Authorized Domains.`;
      } else if (err?.code === 'auth/popup-blocked') {
        friendlyError = 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        friendlyError = 'The Google sign-in window was closed before completing.';
      }

      return {
        success: false,
        error: friendlyError,
      };
    } finally {
      setIsSyncingSheet(false);
    }
  };

  /**
   * Fallback / Direct Staff Passcode Login:
   * Enables authorized teachers from Column C to log in directly on domains (like GitHub Pages)
   * where Google OAuth popups are awaiting Firebase Domain Authorization.
   * Requires:
   * 1. Email MUST match an authorized teacher in Column C (or SuperAdmin hermanf@gisboyshigh.net)
   * 2. Passcode MUST match the GBHS Staff code (GBHS2026 or GBHS)
   */
  const signInWithPasscode = async (
    email: string,
    passcode: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (passcode || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your school email address (@gisboyshigh.net).' };
    }

    const validPasscodes = ['GBHS2026', 'GBHS-2026', 'GBHS', 'GISBORNE2026'];
    if (!validPasscodes.includes(cleanPass.toUpperCase())) {
      return {
        success: false,
        error: 'Invalid Staff Access Code. Please enter the GBHS Staff Access Code.',
      };
    }

    // Combine current live roster and initial roster
    const allKnown = [...authorizedTeachers];
    INITIAL_AUTHORIZED_TEACHERS.forEach((initT) => {
      if (!allKnown.some((t) => t.email.toLowerCase() === initT.email.toLowerCase())) {
        allKnown.push(initT);
      }
    });

    const isOwner = cleanEmail === 'hermanf@gisboyshigh.net';
    const matchedTeacher = allKnown.find((t) => t.email.toLowerCase() === cleanEmail);

    if (!matchedTeacher && !isOwner) {
      return {
        success: false,
        error: `Access Denied: "${cleanEmail}" is not listed in Column C of the TEACHERS_26 Google Sheet. Only verified GBHS teachers can record house points.`,
      };
    }

    const teacherName = matchedTeacher?.name || (isOwner ? 'Herman F.' : 'GBHS Staff');
    const teacherRole = matchedTeacher?.role || (isOwner ? 'Dean of Houses & Sports Coordinator' : 'Staff & House Dean');

    const authenticatedUser: TeacherUser = {
      email: cleanEmail,
      name: teacherName,
      role: teacherRole,
      isTeacher: true,
      isPasscodeAuth: true,
    };

    setTeacherUser(authenticatedUser);
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(authenticatedUser));
    } catch {}

    setCurrentView('teacher-portal');
    soundManager.playClick();
    return { success: true };
  };

  const logoutTeacher = async () => {
    try {
      await logoutGoogle();
    } catch {}
    setTeacherUser(null);
    setCachedAccessToken(null);
    setCurrentView('assembly');
    soundManager.playClick();
  };

  /**
   * ADD POINTS:
   * Writes to Cloud Firestore. All connected screens receive live updates instantly.
   */
  const addPoints = async (data: Omit<PointEvent, 'id' | 'timestamp'>) => {
    const newEvent: PointEvent = {
      ...data,
      id: 'pe-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      teacherEmail: teacherUser?.email || 'hermanf@gisboyshigh.net',
    };

    // Optimistically update local view
    setEvents((prev) => [newEvent, ...prev.filter((e) => e.id !== newEvent.id)]);

    soundManager.playPointAward(data.points);
    const house = INITIAL_HOUSES[data.houseId];
    if (house) {
      triggerConfetti([house.primaryColor, house.secondaryColor, '#ffffff']);
    }

    try {
      await setDoc(doc(db, 'pointEvents', newEvent.id), newEvent);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pointEvents/${newEvent.id}`);
    }
  };

  /**
   * DELETE POINT EVENT:
   */
  const deletePointEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    soundManager.playClick();

    try {
      await deleteDoc(doc(db, 'pointEvents', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pointEvents/${id}`);
    }
  };

  /**
   * EDIT POINT EVENT:
   */
  const editPointEvent = async (id: string, updatedFields: Partial<PointEvent>) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updatedFields } : ev)));

    try {
      await updateDoc(doc(db, 'pointEvents', id), updatedFields);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pointEvents/${id}`);
    }
  };

  /**
   * RESET TO DEFAULT DATA:
   */
  const resetToDefaultData = async () => {
    soundManager.playClick();
    setEvents(INITIAL_POINT_EVENTS);

    try {
      const batch = writeBatch(db);
      INITIAL_POINT_EVENTS.forEach((ev) => {
        batch.set(doc(db, 'pointEvents', ev.id), ev);
      });
      await batch.commit();
    } catch (err) {
      console.warn('Reset sync warning:', err);
    }
  };

  /**
   * CLEAR ALL POINTS:
   */
  const clearAllPoints = async () => {
    soundManager.playClick();
    setEvents([]);

    try {
      const batch = writeBatch(db);
      events.forEach((ev) => {
        batch.delete(doc(db, 'pointEvents', ev.id));
      });
      await batch.commit();
    } catch (err) {
      console.warn('Clear all sync warning:', err);
    }
  };

  const exportLedgerCSV = () => {
    const headers = ['ID', 'House', 'Points', 'Category', 'Term', 'Title', 'AwardedBy', 'Date', 'Notes'];
    const rows = events.map((e) => [
      e.id,
      INITIAL_HOUSES[e.houseId]?.name || e.houseId,
      e.points,
      `"${e.category}"`,
      e.term,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.awardedBy}"`,
      new Date(e.timestamp).toISOString(),
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GBHS_House_Points_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playClick();
  };

  return (
    <HousePointsContext.Provider
      value={{
        houses: computedHouses,
        rawHouses,
        events,
        filteredEvents,
        selectedTerm,
        setSelectedTerm,
        selectedCategory,
        setSelectedCategory,
        teacherUser,
        authorizedTeachers,
        updateAuthorizedTeachers,
        addAuthorizedTeacher,
        currentView,
        setCurrentView,
        signInWithGoogle,
        signInWithPasscode,
        logoutTeacher,
        syncSheetTeachers,
        isSyncingSheet,
        sheetSyncError,
        sheetLastSynced,
        addPoints,
        deletePointEvent,
        editPointEvent,
        resetToDefaultData,
        clearAllPoints,
        exportLedgerCSV,
        audioEnabled,
        toggleAudio,
        triggerConfetti,
        currentLeader,
      }}
    >
      {children}
    </HousePointsContext.Provider>
  );
};

export const useHousePoints = (): HousePointsContextType => {
  const context = useContext(HousePointsContext);
  if (!context) {
    throw new Error('useHousePoints must be used within a HousePointsProvider');
  }
  return context;
};
