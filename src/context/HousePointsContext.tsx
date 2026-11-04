import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, testFirestoreConnection } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { House, HouseId, PointEvent, TeacherUser, TeacherAccount, SchoolTerm, PointCategory } from '../types';
import { INITIAL_HOUSES, INITIAL_POINT_EVENTS, INITIAL_AUTHORIZED_TEACHERS } from '../data/initialData';
import { soundManager } from '../utils/audio';
import {
  signInWithGoogleAccount,
  logoutGoogle,
  getCachedAccessToken,
  setCachedAccessToken,
} from '../services/sheetsAuth';

const STORAGE_EVENTS_KEY = 'gbhs_house_points_events_v4';
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
  editAuthorizedTeacher: (email: string, updated: Partial<TeacherAccount>) => Promise<void>;
  removeAuthorizedTeacher: (email: string) => Promise<void>;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logoutTeacher: () => void;
  addPoints: (data: Omit<PointEvent, 'id' | 'timestamp'>) => Promise<void>;
  deletePointEvent: (id: string) => Promise<void>;
  editPointEvent: (id: string, updated: Partial<PointEvent>) => Promise<void>;
  resetToDefaultData: () => Promise<void>;
  clearAllPoints: () => Promise<void>;
  clearTermPoints: (term: SchoolTerm) => Promise<void>;
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

  // Load events (initial local cache or empty until Firestore syncs)
  const [events, setEvents] = useState<PointEvent[]>(() => {
    try {
      // Clear legacy storage keys so old dummy events never re-surface
      localStorage.removeItem('gbhs_house_points_events_v3');
      localStorage.removeItem('gbhs_house_points_events_v2');
      localStorage.removeItem('gbhs_house_points_events');

      const saved = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
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

  // Filters
  const [selectedTerm, setSelectedTerm] = useState<SchoolTerm>('All Year');
  const [selectedCategory, setSelectedCategory] = useState<PointCategory | 'All Categories'>('All Categories');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(soundManager.getEnabled());
  const [prevLeaderId, setPrevLeaderId] = useState<HouseId | null>(null);

  // Tracks if the last score update was an award (celebrate only on real awards, never on score deletions or resets)
  const allowLeadCelebrationRef = useRef<boolean>(false);

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
          // When Firestore collection is empty (e.g. user cleared points), keep it empty
          setEvents([]);
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
            const data = d.data() as TeacherAccount;
            liveTeachers.push({
              ...data,
              id: d.id,
            });
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

  // Leader celebration check — strictly only celebrates when points are intentionally awarded,
  // never when deleting inaccurate scores, clearing points, or editing history.
  useEffect(() => {
    if (computedHouses.length > 0) {
      const leader = computedHouses[0];
      if (
        allowLeadCelebrationRef.current &&
        prevLeaderId &&
        prevLeaderId !== leader.id &&
        leader.currentTotal > 0
      ) {
        triggerConfetti([leader.primaryColor, leader.secondaryColor, '#ffffff']);
        soundManager.playLeadCelebration();
      }
      // Reset the award-action flag after processing
      allowLeadCelebrationRef.current = false;
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

  // Edit / Modify existing teacher details in Cloud Firestore
  const editAuthorizedTeacher = async (email: string, updated: Partial<TeacherAccount>) => {
    const cleanEmail = email.toLowerCase().trim();
    const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Update state in memory
    const nextTeachers = authorizedTeachers.map((t) =>
      t.email.toLowerCase() === cleanEmail ? { ...t, ...updated } : t
    );
    setAuthorizedTeachers(nextTeachers);

    try {
      const docRef = doc(db, 'authorizedTeachers', docId);
      await updateDoc(docRef, {
        ...updated,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Error updating teacher in Firestore:', err);
      throw err;
    }
  };

  // Remove teacher from Cloud Firestore database
  const removeAuthorizedTeacher = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'hermanf@gisboyshigh.net') {
      throw new Error('The SuperAdmin account (hermanf@gisboyshigh.net) cannot be removed.');
    }

    const targetTeacher = authorizedTeachers.find((t) => t.email.toLowerCase() === cleanEmail);
    const knownDocId = targetTeacher?.id;
    const computedDocId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Optimistically update memory and localStorage cache
    const nextTeachers = authorizedTeachers.filter((t) => t.email.toLowerCase() !== cleanEmail);
    setAuthorizedTeachers(nextTeachers);
    try {
      localStorage.setItem(STORAGE_SHEET_TEACHERS_KEY, JSON.stringify(nextTeachers));
    } catch {}

    try {
      // 1. Delete by known doc ID if available
      if (knownDocId) {
        try {
          await deleteDoc(doc(db, 'authorizedTeachers', knownDocId));
        } catch (e) {
          console.warn('Delete by knownDocId note:', e);
        }
      }

      // 2. Delete by computed doc ID
      try {
        await deleteDoc(doc(db, 'authorizedTeachers', computedDocId));
      } catch (e) {
        console.warn('Delete by computedDocId note:', e);
      }

      // 3. Query and delete any docs with matching email field
      const q = query(collection(db, 'authorizedTeachers'), where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        querySnapshot.forEach((docItem) => {
          batch.delete(docItem.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Error removing teacher from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `authorizedTeachers/${computedDocId}`);
      throw err;
    }
  };

  /**
   * Primary Teacher Google Login Flow:
   * 1. Signs in via genuine Google OAuth popup using standard profile and email scopes.
   * 2. Checks user's verified Google account email against the Cloud Firestore authorizedTeachers database.
   * 3. hermanf@gisboyshigh.net is recognized as Dean & SuperAdmin.
   */
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Google OAuth Sign-In Popup with standard profile/email permissions
      const { user } = await signInWithGoogleAccount(false);
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

      // 3. Check if user's Google email is registered in the Cloud Firestore Teacher Database
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
          error: `Access Denied: You signed in as "${userEmail}". This Google account is not yet on the verified staff roster. Please ask Herman (Dean of Houses) to add your account in the Teacher Portal.`,
        };
      }

      const teacherName = matchedTeacher?.name || user.displayName || (isOwner ? 'Herman F.' : 'GBHS Teacher');
      const teacherRole = matchedTeacher?.role || (isOwner ? 'Dean of Houses & Sports Coordinator' : 'Staff & House Dean');

      const authenticatedUser: TeacherUser = {
        email: userEmail,
        name: teacherName,
        role: teacherRole,
        picture: user.photoURL || undefined,
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
   * Writes to Cloud Firestore. All connected screens receive live updates instantly.
   */
  const addPoints = async (data: Omit<PointEvent, 'id' | 'timestamp'>) => {
    // Enable celebration for authentic point award
    allowLeadCelebrationRef.current = true;

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
   * Removes an inaccurate score from history.
   * Completely silences award fanfares and suppresses confetti.
   */
  const deletePointEvent = async (id: string) => {
    // Explicitly disallow any celebration or award fanfare when deleting scores
    allowLeadCelebrationRef.current = false;
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
    allowLeadCelebrationRef.current = false;
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updatedFields } : ev)));

    try {
      await updateDoc(doc(db, 'pointEvents', id), updatedFields);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pointEvents/${id}`);
    }
  };

  /**
   * CLEAR ALL POINTS:
   * Purges all point events in Firestore so all houses stay at zero (0 pts).
   * Does not auto-regenerate previous entries.
   */
  const clearAllPoints = async () => {
    allowLeadCelebrationRef.current = false;
    soundManager.playClick();
    setEvents([]);
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify([]));
      localStorage.removeItem('gbhs_house_points_events_v3');
      localStorage.removeItem('gbhs_house_points_events_v2');
      localStorage.removeItem('gbhs_house_points_events');
    } catch {}

    try {
      const snapshot = await getDocs(collection(db, 'pointEvents'));
      if (!snapshot.empty) {
        const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }
    } catch (err) {
      console.warn('Clear all sync warning:', err);
      handleFirestoreError(err, OperationType.DELETE, 'pointEvents');
    }
  };

  /**
   * RESET COMPETITION DATA:
   * Complete reset to 0 points for all houses to start the new school year.
   */
  const resetToDefaultData = async () => {
    await clearAllPoints();
  };

  /**
   * CLEAR SPECIFIC TERM SCORES:
   * Purges all point events for a specific term (e.g. Term 1) from Firestore and local state.
   */
  const clearTermPoints = async (termToClear: SchoolTerm) => {
    allowLeadCelebrationRef.current = false;
    soundManager.playClick();

    if (termToClear === 'All Year') {
      await clearAllPoints();
      return;
    }

    const nextEvents = events.filter((e) => e.term !== termToClear);
    setEvents(nextEvents);
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(nextEvents));
    } catch {}

    try {
      const q = query(collection(db, 'pointEvents'), where('term', '==', termToClear));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      }
    } catch (err) {
      console.warn('Clear term sync warning:', err);
      handleFirestoreError(err, OperationType.DELETE, `pointEvents?term=${termToClear}`);
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
        editAuthorizedTeacher,
        removeAuthorizedTeacher,
        currentView,
        setCurrentView,
        signInWithGoogle,
        logoutTeacher,
        addPoints,
        deletePointEvent,
        editPointEvent,
        resetToDefaultData,
        clearAllPoints,
        clearTermPoints,
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
