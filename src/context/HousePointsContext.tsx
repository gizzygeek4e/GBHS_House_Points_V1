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
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { House, HouseId, PointEvent, TeacherUser, TeacherAccount, SchoolTerm, PointCategory } from '../types';
import { INITIAL_HOUSES, INITIAL_POINT_EVENTS, INITIAL_AUTHORIZED_TEACHERS } from '../data/initialData';
import { soundManager } from '../utils/audio';
import {
  auth,
  signInWithGoogleSheets,
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
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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

  // Authorized teachers loaded from Google Sheet (TEACHERS_26 tab)
  const [authorizedTeachers, setAuthorizedTeachers] = useState<TeacherAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHEET_TEACHERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AUTHORIZED_TEACHERS;
  });

  // Teacher user session (only genuine Google OAuth sessions allowed; manual tokens purged)
  const [teacherUser, setTeacherUser] = useState<TeacherUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && !parsed.token.startsWith('manual-token')) {
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
      if (teacherUser && (!teacherUser.token || !teacherUser.token.startsWith('manual-token'))) {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(teacherUser));
      } else {
        localStorage.removeItem(STORAGE_AUTH_KEY);
      }
    } catch {}
  }, [teacherUser]);

  // Enforce authentic Google Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // If not signed into Google, ensure teacherUser is null
        setTeacherUser(null);
        setCachedAccessToken(null);
        try {
          localStorage.removeItem(STORAGE_AUTH_KEY);
        } catch {}
      } else {
        const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
        const isOwner = cleanEmail === 'hermanf@gisboyshigh.net';
        const isListed = authorizedTeachers.some((t) => t.email.toLowerCase() === cleanEmail);

        if (!isOwner && !isListed && authorizedTeachers.length > 0) {
          // Unlisted Google account detected; revoke session
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
          // If the Firestore collection is fresh and empty, automatically seed initial house events
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

    // Sync authorized teacher roster across devices
    const teachersRef = collection(db, 'authorizedTeachers');
    const unsubscribeTeachers = onSnapshot(
      teachersRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveTeachers: TeacherAccount[] = [];
          snapshot.forEach((d) => {
            liveTeachers.push(d.data() as TeacherAccount);
          });
          setAuthorizedTeachers(liveTeachers);
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

  // Sync teachers directly from Google Sheet (tab TEACHERS_26)
  const syncSheetTeachers = async () => {
    const token = getCachedAccessToken();
    if (!token) return;

    setIsSyncingSheet(true);
    setSheetSyncError(null);

    try {
      const sheetTeachers = await fetchTeachersFromSheet(token);
      if (sheetTeachers && sheetTeachers.length > 0) {
        setAuthorizedTeachers(sheetTeachers);
        setSheetLastSynced(Date.now());

        // Sync to Firestore so all connected devices immediately have the verified roster
        try {
          const batch = writeBatch(db);
          sheetTeachers.forEach((t) => {
            const docId = t.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
            batch.set(
              doc(db, 'authorizedTeachers', docId),
              {
                email: t.email,
                name: t.name,
                role: t.role,
                isSuperAdmin: !!t.isSuperAdmin,
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          });
          await batch.commit();
        } catch (dbErr) {
          console.warn('Could not mirror sheet teachers to Firestore:', dbErr);
        }
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
   * 1. Signs in via genuine Google OAuth popup (requesting spreadsheets.readonly).
   * 2. Reads the Google Sheet (1lzQe8aBQXxv615t8-cR_BfHHtbVHHkPxbix_dlS9b-Y, tab TEACHERS_26).
   * 3. Column C contains the verified Google account emails permitted to access the scoring portal.
   * 4. Only allows access if the signed-in user's email matches an email in Column C.
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsSyncingSheet(true);
    setSheetSyncError(null);

    try {
      // 1. Google OAuth Sign-In Popup
      const { user, accessToken } = await signInWithGoogleSheets();
      const userEmail = (user.email || '').trim().toLowerCase();

      if (!userEmail) {
        await logoutGoogle();
        return {
          success: false,
          error: 'No email address was returned by Google. Please ensure you sign in with a valid school Google account.',
        };
      }

      // 2. Fetch latest teacher roster from Google Sheet (tab TEACHERS_26, Column C)
      let teachersList = authorizedTeachers;
      try {
        const fetched = await fetchTeachersFromSheet(accessToken);
        if (fetched && fetched.length > 0) {
          teachersList = fetched;
          setAuthorizedTeachers(fetched);
          setSheetLastSynced(Date.now());

          // Persist to Firestore
          try {
            const batch = writeBatch(db);
            fetched.forEach((t) => {
              const docId = t.email.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
              batch.set(
                doc(db, 'authorizedTeachers', docId),
                {
                  email: t.email,
                  name: t.name,
                  role: t.role,
                  isSuperAdmin: !!t.isSuperAdmin,
                  updatedAt: Date.now(),
                },
                { merge: true }
              );
            });
            await batch.commit();
          } catch (fErr) {
            console.warn('Firestore teacher batch sync note:', fErr);
          }
        }
      } catch (sheetErr: any) {
        console.warn('Could not read sheet directly, falling back to cached roster:', sheetErr);
        setSheetSyncError(sheetErr?.message || 'Could not fetch live sheet');
      }

      // 3. Check if user's Google email is registered in Column C of TEACHERS_26
      const matchedTeacher = teachersList.find(
        (t) => t.email.toLowerCase() === userEmail
      );

      // App Dean / Owner verification: hermanf@gisboyshigh.net
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
          error: `Access Denied: "${userEmail}" is not listed in Column C of the TEACHERS_26 Google Sheet. Only teachers whose Google email is verified on that spreadsheet can log in to award house points.`,
        };
      }

      const teacherName = matchedTeacher?.name || user.displayName || 'GBHS Teacher';
      const teacherRole = matchedTeacher?.role || 'Staff & House Dean';

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
      return {
        success: false,
        error: err?.message || 'Failed to sign in with Google.',
      };
    } finally {
      setIsSyncingSheet(false);
    }
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
   * Instantly creates a live PointEvent and writes to Cloud Firestore.
   * All connected screens in assembly halls and on devices receive the live score update instantly.
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
   * Deletes from Cloud Firestore and broadcasts deletion to all live displays.
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
   * Updates doc in Cloud Firestore and syncs across all devices.
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
   * RESET TO DEFAULT:
   * Replaces Firestore items with default baseline dataset.
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
        currentView,
        setCurrentView,
        signInWithGoogle,
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
