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
import { House, HouseId, PointEvent, TeacherUser, TeacherAccount, SchoolTerm, PointCategory, Competition, Student, RecipientGroup } from '../types';
import { INITIAL_HOUSES, INITIAL_POINT_EVENTS, INITIAL_AUTHORIZED_TEACHERS, INITIAL_COMPETITIONS, INITIAL_STUDENTS } from '../data/initialData';
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
const STORAGE_COMPETITIONS_KEY = 'gbhs_competitions_v1';
const STORAGE_STUDENTS_KEY = 'gbhs_students_v1';
const STORAGE_GROUPS_KEY = 'gbhs_groups_v1';

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
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<Student>;
  bulkAddStudents: (students: Omit<Student, 'id'>[]) => Promise<number>;
  updateStudent: (id: string, updated: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  groups: RecipientGroup[];
  addGroup: (group: Omit<RecipientGroup, 'id' | 'updatedAt'>) => Promise<RecipientGroup>;
  updateGroup: (id: string, updated: Partial<RecipientGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  competitions: Competition[];
  addCompetition: (comp: Omit<Competition, 'id' | 'updatedAt'>) => Promise<void>;
  updateCompetition: (id: string, updated: Partial<Competition>) => Promise<void>;
  deleteCompetition: (id: string) => Promise<void>;
  reorderCompetitions: (reordered: Competition[]) => Promise<void>;
  setCompetitionAsCurrent: (id: string) => Promise<void>;
  moveCompetition: (id: string, direction: 'up' | 'down') => Promise<void>;
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

  // School Competitions and custom order (synced in real-time with Cloud Firestore)
  const [competitions, setCompetitions] = useState<Competition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COMPETITIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
      }
    } catch {}
    return INITIAL_COMPETITIONS;
  });

  // GBHS Student Database (Whole School Population synced with Cloud Firestore)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STUDENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_STUDENTS;
  });

  // Teams & Groups created for house competitions (synced with Cloud Firestore)
  const [groups, setGroups] = useState<RecipientGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_GROUPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
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
      localStorage.setItem(STORAGE_COMPETITIONS_KEY, JSON.stringify(competitions));
    } catch {}
  }, [competitions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(students));
    } catch {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(groups));
    } catch {}
  }, [groups]);

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
        const isUnavailable =
          error.code === 'unavailable' ||
          error.message?.includes('offline') ||
          error.message?.includes('Could not reach Cloud Firestore') ||
          error.message?.includes('backend. Connection failed');

        if (isUnavailable) {
          console.warn('Real-time points sync operating with offline cache:', error.message);
          return;
        }

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
        } else if (auth.currentUser) {
          // Pre-seed default teachers to Firestore when authenticated
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

    // Sync competitions in real time from Firestore
    const competitionsRef = collection(db, 'competitions');
    const compQuery = query(competitionsRef, orderBy('order', 'asc'));

    const unsubscribeCompetitions = onSnapshot(
      compQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          const liveComps: Competition[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as Competition;
            liveComps.push({
              ...data,
              id: d.id,
            });
          });
          liveComps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setCompetitions(liveComps);
        } else if (auth.currentUser) {
          // Pre-seed default competitions to Firestore when authenticated
          try {
            const batch = writeBatch(db);
            INITIAL_COMPETITIONS.forEach((c, idx) => {
              const compDoc = doc(db, 'competitions', c.id);
              batch.set(compDoc, {
                ...c,
                order: idx,
                updatedAt: Date.now(),
              });
            });
            await batch.commit();
          } catch (err) {
            console.warn('Initial competitions seed note:', err);
          }
        }
      },
      (error) => {
        const isUnavailable =
          error.code === 'unavailable' ||
          error.message?.includes('offline') ||
          error.message?.includes('Could not reach Cloud Firestore');
        if (!isUnavailable) {
          console.warn('Real-time competitions sync warning:', error);
        }
      }
    );

    // Sync GBHS students database in real time from Firestore
    const studentsRef = collection(db, 'students');
    const unsubscribeStudents = onSnapshot(
      studentsRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          const liveStudents: Student[] = [];
          snapshot.forEach((d) => {
            liveStudents.push({
              ...(d.data() as Student),
              id: d.id,
            });
          });
          liveStudents.sort((a, b) => a.name.localeCompare(b.name));
          setStudents(liveStudents);
        } else if (auth.currentUser) {
          // Pre-seed initial student population into Firestore when authenticated
          try {
            const batch = writeBatch(db);
            INITIAL_STUDENTS.forEach((s) => {
              const stuDoc = doc(db, 'students', s.id);
              batch.set(stuDoc, s);
            });
            await batch.commit();
          } catch (err) {
            console.warn('Initial students seed note:', err);
          }
        }
      },
      (error) => {
        const isUnavailable =
          error.code === 'unavailable' ||
          error.message?.includes('offline') ||
          error.message?.includes('Could not reach Cloud Firestore');
        if (!isUnavailable) {
          console.warn('Real-time students sync warning:', error);
        }
      }
    );

    // Sync house competition teams & groups in real time from Firestore
    const groupsRef = collection(db, 'groups');
    const unsubscribeGroups = onSnapshot(
      groupsRef,
      (snapshot) => {
        const liveGroups: RecipientGroup[] = [];
        snapshot.forEach((d) => {
          liveGroups.push({
            ...(d.data() as RecipientGroup),
            id: d.id,
          });
        });
        liveGroups.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setGroups(liveGroups);
      },
      (error) => {
        const isUnavailable =
          error.code === 'unavailable' ||
          error.message?.includes('offline') ||
          error.message?.includes('Could not reach Cloud Firestore');
        if (!isUnavailable) {
          console.warn('Real-time groups sync warning:', error);
        }
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeTeachers();
      unsubscribeCompetitions();
      unsubscribeStudents();
      unsubscribeGroups();
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

  // Helper to verify if current user is SuperAdmin (Herman F.)
  const checkIsAdmin = (): boolean => {
    const email = (teacherUser?.email || auth.currentUser?.email || '').toLowerCase().trim();
    return email === 'hermanf@gisboyshigh.net' || !!teacherUser?.isSuperAdmin;
  };

  // Update authorized teachers list in memory and sync to Firestore (Admin Only)
  const updateAuthorizedTeachers = async (newTeachers: TeacherAccount[]) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can modify staff accounts.');
    }

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
      throw err;
    }
  };

  // Add single authorized teacher (Admin Only)
  const addAuthorizedTeacher = async (teacher: TeacherAccount) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can add staff accounts.');
    }

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

  // Edit / Modify existing teacher details in Cloud Firestore (Admin Only)
  const editAuthorizedTeacher = async (email: string, updated: Partial<TeacherAccount>) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can modify staff accounts.');
    }

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

  // Remove teacher from Cloud Firestore database (Admin Only)
  const removeAuthorizedTeacher = async (email: string) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can remove staff accounts.');
    }

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
   * COMPETITION MANAGEMENT (Admin Only):
   * Add, update, delete, reorder, and set primary active competition.
   * Real-time synchronized via Cloud Firestore so teachers instantly see updated orders and default points.
   */
  const addCompetition = async (comp: Omit<Competition, 'id' | 'updatedAt'>) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin can add competitions.');
    }

    const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newOrder = comp.order !== undefined ? comp.order : competitions.length;
    const newComp: Competition = {
      ...comp,
      id: compId,
      order: newOrder,
      updatedAt: Date.now(),
    };

    const updated = [...competitions, newComp].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setCompetitions(updated);

    try {
      await setDoc(doc(db, 'competitions', compId), newComp);
    } catch (err) {
      console.error('Failed to add competition:', err);
      handleFirestoreError(err, OperationType.WRITE, 'competitions');
      throw err;
    }
  };

  const updateCompetition = async (id: string, updated: Partial<Competition>) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin can edit competitions.');
    }

    const updatedList = competitions.map((c) =>
      c.id === id ? { ...c, ...updated, updatedAt: Date.now() } : c
    );
    setCompetitions(updatedList);

    try {
      await updateDoc(doc(db, 'competitions', id), {
        ...updated,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Failed to update competition:', err);
      handleFirestoreError(err, OperationType.WRITE, 'competitions');
      throw err;
    }
  };

  const deleteCompetition = async (id: string) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin can delete competitions.');
    }

    const filtered = competitions.filter((c) => c.id !== id);
    setCompetitions(filtered);

    try {
      await deleteDoc(doc(db, 'competitions', id));
    } catch (err) {
      console.error('Failed to delete competition:', err);
      handleFirestoreError(err, OperationType.DELETE, 'competitions');
      throw err;
    }
  };

  const setCompetitionAsCurrent = async (id: string) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin can reorder competitions.');
    }

    const target = competitions.find((c) => c.id === id);
    if (!target) return;
    const others = competitions.filter((c) => c.id !== id);
    const reordered = [target, ...others].map((c, index) => ({
      ...c,
      order: index,
      updatedAt: Date.now(),
    }));

    setCompetitions(reordered);

    try {
      const batch = writeBatch(db);
      reordered.forEach((c) => {
        batch.update(doc(db, 'competitions', c.id), {
          order: c.order,
          updatedAt: c.updatedAt,
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to set competition as current:', err);
      handleFirestoreError(err, OperationType.WRITE, 'competitions');
      throw err;
    }
  };

  const moveCompetition = async (id: string, direction: 'up' | 'down') => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin can reorder competitions.');
    }

    const index = competitions.findIndex((c) => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === competitions.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const newList = [...competitions];
    const temp = newList[index];
    newList[index] = newList[swapIndex];
    newList[swapIndex] = temp;

    const reordered = newList.map((c, idx) => ({
      ...c,
      order: idx,
      updatedAt: Date.now(),
    }));

    setCompetitions(reordered);

    try {
      const batch = writeBatch(db);
      reordered.forEach((c) => {
        batch.update(doc(db, 'competitions', c.id), {
          order: c.order,
          updatedAt: c.updatedAt,
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to move competition:', err);
      handleFirestoreError(err, OperationType.WRITE, 'competitions');
      throw err;
    }
  };

  const reorderCompetitions = async (reordered: Competition[]) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin can reorder competitions.');
    }

    const indexed = reordered.map((c, idx) => ({
      ...c,
      order: idx,
      updatedAt: Date.now(),
    }));
    setCompetitions(indexed);

    try {
      const batch = writeBatch(db);
      indexed.forEach((c) => {
        batch.update(doc(db, 'competitions', c.id), {
          order: c.order,
          updatedAt: c.updatedAt,
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to reorder competitions:', err);
      handleFirestoreError(err, OperationType.WRITE, 'competitions');
      throw err;
    }
  };

  /**
   * LEARNERS (STUDENTS) MANAGEMENT:
   * Add, bulk import, edit, and remove learners synced in real time via Cloud Firestore.
   */
  const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
    const stuId = `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanPayload: Record<string, any> = {
      id: stuId,
      name: student.name.trim().slice(0, 150),
      houseId: student.houseId,
      yearLevel: Number(student.yearLevel) || 9,
      updatedAt: Date.now(),
    };
    if (student.tutorGroup && student.tutorGroup.trim()) {
      cleanPayload.tutorGroup = student.tutorGroup.trim().slice(0, 30);
    }

    const newStudent = cleanPayload as Student;
    setStudents((prev) => [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)));

    try {
      await setDoc(doc(db, 'students', stuId), cleanPayload);
      return newStudent;
    } catch (err) {
      console.error('Failed to add learner:', err);
      handleFirestoreError(err, OperationType.CREATE, `students/${stuId}`);
      throw err;
    }
  };

  const bulkAddStudents = async (newStudentsList: Omit<Student, 'id'>[]): Promise<number> => {
    if (!newStudentsList.length) return 0;
    const created: Student[] = [];
    const batch = writeBatch(db);
    const now = Date.now();

    newStudentsList.forEach((student, idx) => {
      const stuId = `stu_${now}_${idx}_${Math.random().toString(36).substring(2, 5)}`;
      const cleanPayload: Record<string, any> = {
        id: stuId,
        name: student.name.trim().slice(0, 150),
        houseId: student.houseId,
        yearLevel: Math.min(Math.max(Number(student.yearLevel) || 9, 1), 13),
        updatedAt: now,
      };
      if (student.tutorGroup && student.tutorGroup.trim()) {
        cleanPayload.tutorGroup = student.tutorGroup.trim().slice(0, 30);
      }
      created.push(cleanPayload as Student);
      batch.set(doc(db, 'students', stuId), cleanPayload);
    });

    setStudents((prev) => [...prev, ...created].sort((a, b) => a.name.localeCompare(b.name)));

    try {
      await batch.commit();
      return created.length;
    } catch (err) {
      console.error('Failed to bulk import learners:', err);
      handleFirestoreError(err, OperationType.WRITE, 'students');
      throw err;
    }
  };

  const updateStudent = async (id: string, updated: Partial<Student>) => {
    const existing = students.find((s) => s.id === id);
    if (!existing) return;

    const cleanPayload: Record<string, any> = {
      id,
      name: (updated.name ?? existing.name).trim().slice(0, 150),
      houseId: updated.houseId ?? existing.houseId,
      yearLevel: Math.min(Math.max(Number(updated.yearLevel ?? existing.yearLevel) || 9, 1), 13),
      updatedAt: Date.now(),
    };
    const nextTutor = updated.tutorGroup !== undefined ? updated.tutorGroup : existing.tutorGroup;
    if (nextTutor && nextTutor.trim()) {
      cleanPayload.tutorGroup = nextTutor.trim().slice(0, 30);
    }

    setStudents((prev) =>
      prev
        .map((s) => (s.id === id ? (cleanPayload as Student) : s))
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    try {
      await setDoc(doc(db, 'students', id), cleanPayload);
    } catch (err) {
      console.error('Failed to update learner:', err);
      handleFirestoreError(err, OperationType.UPDATE, `students/${id}`);
      throw err;
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      console.error('Failed to delete learner:', err);
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
      throw err;
    }
  };

  /**
   * TEAMS & GROUPS MANAGEMENT:
   * Create, edit, and delete named house teams and groups for house competitions.
   */
  const addGroup = async (group: Omit<RecipientGroup, 'id' | 'updatedAt'>): Promise<RecipientGroup> => {
    const grpId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanPayload: Record<string, any> = {
      id: grpId,
      name: group.name.trim().slice(0, 150),
      type: group.type || 'group',
      houseId: group.houseId,
      studentIds: (group.studentIds || []).slice(0, 100),
      updatedAt: Date.now(),
    };
    if (group.competitionId && group.competitionId.trim()) {
      cleanPayload.competitionId = group.competitionId.trim().slice(0, 128);
    }
    if (group.description && group.description.trim()) {
      cleanPayload.description = group.description.trim().slice(0, 500);
    }
    const creator = group.createdBy || teacherUser?.name || 'GBHS Staff';
    if (creator) {
      cleanPayload.createdBy = creator.trim().slice(0, 150);
    }

    const newGroup = cleanPayload as RecipientGroup;
    setGroups((prev) => [newGroup, ...prev]);

    try {
      await setDoc(doc(db, 'groups', grpId), cleanPayload);
      return newGroup;
    } catch (err) {
      console.error('Failed to create group:', err);
      handleFirestoreError(err, OperationType.CREATE, `groups/${grpId}`);
      throw err;
    }
  };

  const updateGroup = async (id: string, updated: Partial<RecipientGroup>) => {
    const existing = groups.find((g) => g.id === id);
    if (!existing) return;

    const cleanPayload: Record<string, any> = {
      id,
      name: (updated.name ?? existing.name).trim().slice(0, 150),
      type: updated.type ?? existing.type,
      houseId: updated.houseId ?? existing.houseId,
      studentIds: (updated.studentIds ?? existing.studentIds ?? []).slice(0, 100),
      updatedAt: Date.now(),
    };

    const nextCompId = updated.competitionId !== undefined ? updated.competitionId : existing.competitionId;
    if (nextCompId && nextCompId.trim()) {
      cleanPayload.competitionId = nextCompId.trim().slice(0, 128);
    }
    const nextDesc = updated.description !== undefined ? updated.description : existing.description;
    if (nextDesc && nextDesc.trim()) {
      cleanPayload.description = nextDesc.trim().slice(0, 500);
    }
    if (existing.createdBy) {
      cleanPayload.createdBy = existing.createdBy;
    }

    setGroups((prev) => prev.map((g) => (g.id === id ? (cleanPayload as RecipientGroup) : g)));

    try {
      await setDoc(doc(db, 'groups', id), cleanPayload);
    } catch (err) {
      console.error('Failed to update group:', err);
      handleFirestoreError(err, OperationType.UPDATE, `groups/${id}`);
      throw err;
    }
  };

  const deleteGroup = async (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteDoc(doc(db, 'groups', id));
    } catch (err) {
      console.error('Failed to delete group:', err);
      handleFirestoreError(err, OperationType.DELETE, `groups/${id}`);
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
        isSuperAdmin: isOwner || !!matchedTeacher?.isSuperAdmin,
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
    const numericPoints = Number(data.points);
    // Only celebrate positive awards; negative deductions must not trigger confetti or fanfare
    allowLeadCelebrationRef.current = numericPoints > 0;

    const teacherEmail = (
      teacherUser?.email ||
      auth.currentUser?.email ||
      'staff@gisboyshigh.net'
    ).toLowerCase().trim();

    // Sanitize payload strictly: Never include undefined fields (Firestore will reject undefined)
    const cleanPayload: Record<string, any> = {
      id: 'pe-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      houseId: data.houseId,
      points: numericPoints,
      title: data.title.trim().slice(0, 300),
      category: data.category,
      term: data.term,
      awardedBy: data.awardedBy.trim().slice(0, 150),
      timestamp: Date.now(),
      teacherEmail: teacherEmail.slice(0, 200),
    };

    if (data.notes && data.notes.trim()) {
      cleanPayload.notes = data.notes.trim().slice(0, 1000);
    }

    if (data.studentRecipients && data.studentRecipients.length > 0) {
      cleanPayload.studentRecipients = data.studentRecipients.slice(0, 100);
    }

    if (data.competitionId) {
      cleanPayload.competitionId = data.competitionId.slice(0, 128);
    }

    if (data.groupId) {
      cleanPayload.groupId = data.groupId.slice(0, 128);
    }

    if (data.groupName && data.groupName.trim()) {
      cleanPayload.groupName = data.groupName.trim().slice(0, 150);
    }

    try {
      await setDoc(doc(db, 'pointEvents', cleanPayload.id), cleanPayload);
    } catch (err) {
      console.error('Error writing point event to Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, `pointEvents/${cleanPayload.id}`);
      throw err;
    }

    // Play sound and launch confetti once write is confirmed to Cloud Firestore
    if (numericPoints < 0) {
      soundManager.playPointDeduction();
    } else {
      soundManager.playPointAward(numericPoints);
      const house = INITIAL_HOUSES[data.houseId];
      if (house) {
        triggerConfetti([house.primaryColor, house.secondaryColor, '#ffffff']);
      }
    }
  };

  /**
   * DELETE POINT EVENT (Admin Only):
   * Removes an inaccurate score from history.
   * Restricted strictly to Admin (hermanf@gisboyshigh.net).
   */
  const deletePointEvent = async (id: string) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can delete scoring entries.');
    }

    // Explicitly disallow any celebration or award fanfare when deleting scores
    allowLeadCelebrationRef.current = false;
    soundManager.playClick();

    try {
      await deleteDoc(doc(db, 'pointEvents', id));
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error deleting point event from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `pointEvents/${id}`);
      throw err;
    }
  };

  /**
   * EDIT POINT EVENT (Admin Only):
   */
  const editPointEvent = async (id: string, updatedFields: Partial<PointEvent>) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can modify scoring entries.');
    }

    allowLeadCelebrationRef.current = false;
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updatedFields } : ev)));

    try {
      await updateDoc(doc(db, 'pointEvents', id), updatedFields);
    } catch (err) {
      console.error('Error updating point event in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `pointEvents/${id}`);
      throw err;
    }
  };

  /**
   * CLEAR ALL POINTS (Admin Only):
   * Purges all point events in Firestore so all houses stay at zero (0 pts).
   * Does not auto-regenerate previous entries.
   */
  const clearAllPoints = async () => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can reset competition scores.');
    }

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
      throw err;
    }
  };

  /**
   * RESET COMPETITION DATA (Admin Only):
   * Complete reset to 0 points for all houses to start the new school year.
   */
  const resetToDefaultData = async () => {
    await clearAllPoints();
  };

  /**
   * CLEAR SPECIFIC TERM SCORES (Admin Only):
   * Purges all point events for a specific term (e.g. Term 1) from Firestore and local state.
   */
  const clearTermPoints = async (termToClear: SchoolTerm) => {
    if (!checkIsAdmin()) {
      throw new Error('Unauthorized: Only Admin (hermanf@gisboyshigh.net) can reset term scores.');
    }

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
      throw err;
    }
  };

  const exportLedgerCSV = () => {
    const headers = ['ID', 'House', 'Points', 'Category', 'Term', 'Title', 'GroupOrTeam', 'StudentRecipients', 'AwardedBy', 'Date', 'Notes'];
    const rows = events.map((e) => [
      e.id,
      INITIAL_HOUSES[e.houseId]?.name || e.houseId,
      e.points,
      `"${e.category}"`,
      e.term,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${(e.groupName || '').replace(/"/g, '""')}"`,
      `"${(e.studentRecipients || []).join('; ').replace(/"/g, '""')}"`,
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
        competitions,
        students,
        addStudent,
        bulkAddStudents,
        updateStudent,
        deleteStudent,
        groups,
        addGroup,
        updateGroup,
        deleteGroup,
        addCompetition,
        updateCompetition,
        deleteCompetition,
        reorderCompetitions,
        setCompetitionAsCurrent,
        moveCompetition,
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
