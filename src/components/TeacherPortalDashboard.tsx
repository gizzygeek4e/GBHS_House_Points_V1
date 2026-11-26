import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  PlusCircle,
  ListOrdered,
  Layers,
  Settings,
  LogOut,
  Download,
  Trash2,
  CheckCircle,
  Plus,
  Search,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Shield,
  Pencil,
  UserPlus,
  Database,
  ShieldCheck,
  X,
  ArrowUp,
  ArrowDown,
  Star,
  Trophy,
  Lock,
  Tag,
  Users,
  UserCheck,
  CheckSquare,
  Square,
  Filter,
  GraduationCap,
  MinusCircle,
  FolderPlus,
  Upload,
  UsersRound,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import {
  HouseId,
  PointCategory,
  SchoolTerm,
  TeacherAccount,
  PointEvent,
  Competition,
  AllowedScoreOption,
  Student,
  RecipientGroup,
} from '../types';
import { parseTeacherCsv } from '../services/sheetsAuth';
import gbhsCrestLogo from '../assets/gbhs_crest_logo.svg';
import { HouseCrestImage } from './HouseCrestImage';
import { PWAInstallButton } from './PWAInstallButton';

const formatPoints = (pts: number): string => (pts > 0 ? `+${pts}` : `${pts}`);

export const TeacherPortalDashboard: React.FC = () => {
  const {
    teacherUser,
    logoutTeacher,
    setCurrentView,
    houses,
    rawHouses,
    events,
    addPoints,
    deletePointEvent,
    exportLedgerCSV,
    authorizedTeachers,
    updateAuthorizedTeachers,
    addAuthorizedTeacher,
    editAuthorizedTeacher,
    removeAuthorizedTeacher,
    resetToDefaultData,
    clearAllPoints,
    clearTermPoints,
    triggerConfetti,
    competitions,
    students,
    archivedStudents,
    allStudents,
    addStudent,
    bulkAddStudents,
    updateStudent,
    deleteStudent,
    clearLearnerDirectory,
    restoreStudent,
    restoreAllArchivedStudents,
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
  } = useHousePoints();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'award' | 'learners' | 'ledger' | 'houses' | 'teachers' | 'settings'>('award');

  // SuperAdmin permission check (Herman F. or account flagged as isSuperAdmin)
  const isSuperAdmin =
    teacherUser?.email?.toLowerCase().trim() === 'hermanf@gisboyshigh.net' ||
    !!teacherUser?.isSuperAdmin;

  // Selected Competition state (defaults to top-ranked competition, i.e. order 0)
  const [selectedCompId, setSelectedCompId] = useState<string>('');

  // Active competition object
  const activeCompetition = useMemo(() => {
    if (!competitions || competitions.length === 0) return null;
    return competitions.find((c) => c.id === selectedCompId) || competitions[0];
  }, [competitions, selectedCompId]);

  // Award Points Form State
  const [selectedHouse, setSelectedHouse] = useState<HouseId>('tumatauenga');
  const [pointsValue, setPointsValue] = useState<number>(100);
  const [customPoints, setCustomPoints] = useState<string>('100');
  const [scoreSignMode, setScoreSignMode] = useState<'award' | 'deduct'>('award');
  const [adminCustomInput, setAdminCustomInput] = useState<string>('');
  const [selectedScoreLabel, setSelectedScoreLabel] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<PointCategory>('Sports & Athletics');
  const [term, setTerm] = useState<'Term 1' | 'Term 2' | 'Term 3' | 'Term 4'>('Term 1');
  const [notes, setNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSubmittedPoints, setLastSubmittedPoints] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Student & Group Recipient Selection State
  const [recipientTargetMode, setRecipientTargetMode] = useState<'groups' | 'learners'>('groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [rosterSourceMode, setRosterSourceMode] = useState<'competition' | 'whole_school'>('competition');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentYearFilter, setStudentYearFilter] = useState<number | 'all'>('all');

  // Learners, Teams & Groups Management State
  const [learnersSubTab, setLearnersSubTab] = useState<'groups' | 'students'>('groups');
  const [learnersNotice, setLearnersNotice] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupHouseFilter, setGroupHouseFilter] = useState<HouseId | 'all'>('all');
  const [groupCompFilter, setGroupCompFilter] = useState<string>('all');
  const [learnerDirSearch, setLearnerDirSearch] = useState('');
  const [learnerDirHouseFilter, setLearnerDirHouseFilter] = useState<HouseId | 'all'>('all');
  const [learnerDirYearFilter, setLearnerDirYearFilter] = useState<number | 'all'>('all');

  // Group Create / Edit / Delete Modal State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RecipientGroup | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormType, setGroupFormType] = useState<'team' | 'group'>('team');
  const [groupFormHouseId, setGroupFormHouseId] = useState<HouseId>('tumatauenga');
  const [groupFormCompId, setGroupFormCompId] = useState<string>('');
  const [groupFormDescription, setGroupFormDescription] = useState('');
  const [groupFormStudentIds, setGroupFormStudentIds] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [groupFormError, setGroupFormError] = useState<string | null>(null);
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [autoSelectNewGroupInAward, setAutoSelectNewGroupInAward] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<RecipientGroup | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  // Learner Create / Edit / Bulk Import / Delete Modal State
  const [showLearnerModal, setShowLearnerModal] = useState(false);
  const [editingLearner, setEditingLearner] = useState<Student | null>(null);
  const [learnerFormName, setLearnerFormName] = useState('');
  const [learnerFormHouseId, setLearnerFormHouseId] = useState<HouseId>('tumatauenga');
  const [learnerFormYear, setLearnerFormYear] = useState<number>(9);
  const [learnerFormTutor, setLearnerFormTutor] = useState('');
  const [learnerFormError, setLearnerFormError] = useState<string | null>(null);
  const [isSavingLearner, setIsSavingLearner] = useState(false);
  const [autoSelectNewLearnerInAward, setAutoSelectNewLearnerInAward] = useState(false);
  const [learnerToDelete, setLearnerToDelete] = useState<Student | null>(null);
  const [isDeletingLearner, setIsDeletingLearner] = useState(false);

  const [showBulkLearnersModal, setShowBulkLearnersModal] = useState(false);
  const [bulkLearnersHouseId, setBulkLearnersHouseId] = useState<HouseId>('tumatauenga');
  const [bulkLearnersText, setBulkLearnersText] = useState('');
  const [bulkLearnersError, setBulkLearnersError] = useState<string | null>(null);
  const [isImportingLearners, setIsImportingLearners] = useState(false);

  // Clear Directory (Non-Destructive Archive) & Restore State
  const [showClearLearnersConfirm, setShowClearLearnersConfirm] = useState(false);
  const [isClearingLearners, setIsClearingLearners] = useState(false);
  const [showArchivedLearners, setShowArchivedLearners] = useState(false);
  const [isRestoringLearners, setIsRestoringLearners] = useState(false);

  // Sync competition changes to form fields and roster mode
  useEffect(() => {
    if (activeCompetition) {
      if (!selectedCompId || selectedCompId !== activeCompetition.id) {
        setSelectedCompId(activeCompetition.id);
      }
      setCategory(activeCompetition.category);
      if (activeCompetition.term && activeCompetition.term !== 'All Year') {
        setTerm(activeCompetition.term as any);
      }
      // If competition specifies custom roster and has student IDs, default to competition roster mode; otherwise whole school
      if (
        activeCompetition.recipientMode === 'custom_roster' &&
        activeCompetition.customStudentIds &&
        activeCompetition.customStudentIds.length > 0
      ) {
        setRosterSourceMode('competition');
      } else {
        setRosterSourceMode('whole_school');
      }
      // Reset selected students on competition change
      setSelectedStudentIds([]);

      // If current pointsValue (by magnitude) is not in the allowed scores of this competition, pick the first allowed score
      const matched = activeCompetition.allowedScores.find(
        (s) => s.points === pointsValue || (scoreSignMode === 'deduct' && -Math.abs(s.points) === pointsValue)
      );
      if (!matched && activeCompetition.allowedScores.length > 0) {
        const firstScore = activeCompetition.allowedScores[0];
        const nextVal =
          firstScore.points < 0
            ? firstScore.points
            : scoreSignMode === 'deduct'
            ? -Math.abs(firstScore.points)
            : firstScore.points;
        setPointsValue(nextVal);
        setCustomPoints(nextVal.toString());
        setSelectedScoreLabel(firstScore.label);
      } else if (matched) {
        setSelectedScoreLabel(matched.label);
      }
    }
  }, [activeCompetition]);

  // Students belonging to currently selected house
  const houseStudents = useMemo(() => {
    return (students || []).filter((s) => s.houseId === selectedHouse);
  }, [students, selectedHouse]);

  // Custom competition participant IDs that belong to the current house
  const competitionHouseStudentIds = useMemo(() => {
    const customIds = activeCompetition?.customStudentIds || [];
    return customIds.filter((id) => houseStudents.some((s) => s.id === id));
  }, [activeCompetition, houseStudents]);

  // Filtered students displayed in Section 3 Checkbox Space
  const displayedStudents = useMemo(() => {
    let list = houseStudents;

    if (rosterSourceMode === 'competition') {
      if (activeCompetition?.customStudentIds && activeCompetition.customStudentIds.length > 0) {
        list = list.filter((s) => activeCompetition.customStudentIds!.includes(s.id));
      }
    }

    if (studentYearFilter !== 'all') {
      list = list.filter((s) => s.yearLevel === studentYearFilter);
    }

    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.tutorGroup && s.tutorGroup.toLowerCase().includes(q)) ||
          `year ${s.yearLevel}`.includes(q)
      );
    }

    return list;
  }, [houseStudents, rosterSourceMode, activeCompetition, studentYearFilter, studentSearch]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFilteredStudents = () => {
    const ids = displayedStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearStudentSelection = () => {
    setSelectedStudentIds([]);
  };

  const selectedStudents = useMemo(() => {
    return (students || []).filter((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  const selectedStudentNames = useMemo(() => {
    return selectedStudents.map((s) => s.name);
  }, [selectedStudents]);

  // Groups belonging to currently selected house (prioritizing groups linked to activeCompetition)
  const houseGroups = useMemo(() => {
    const list = (groups || []).filter((g) => g.houseId === selectedHouse);
    if (!activeCompetition) return list;
    return [...list].sort((a, b) => {
      const aMatch = a.competitionId === activeCompetition.id ? 1 : 0;
      const bMatch = b.competitionId === activeCompetition.id ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [groups, selectedHouse, activeCompetition]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return (groups || []).find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const selectedGroupMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return (allStudents || []).filter((s) => selectedGroup.studentIds.includes(s.id));
  }, [selectedGroup, allStudents]);

  // Modal helpers for Groups & Learners
  const openCreateGroupModal = (
    presetHouse?: HouseId,
    presetCompId?: string,
    selectAfterInAward = false
  ) => {
    setEditingGroup(null);
    setGroupFormName('');
    setGroupFormType('team');
    setGroupFormHouseId(presetHouse || selectedHouse);
    setGroupFormCompId(presetCompId !== undefined ? presetCompId : '');
    setGroupFormDescription('');
    setGroupFormStudentIds([]);
    setGroupMemberSearch('');
    setGroupFormError(null);
    setAutoSelectNewGroupInAward(selectAfterInAward);
    setShowGroupModal(true);
  };

  const openEditGroupModal = (group: RecipientGroup) => {
    setEditingGroup(group);
    setGroupFormName(group.name);
    setGroupFormType(group.type);
    setGroupFormHouseId(group.houseId);
    setGroupFormCompId(group.competitionId || '');
    setGroupFormDescription(group.description || '');
    setGroupFormStudentIds(group.studentIds || []);
    setGroupMemberSearch('');
    setGroupFormError(null);
    setAutoSelectNewGroupInAward(false);
    setShowGroupModal(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupFormError(null);
    if (!groupFormName.trim()) {
      setGroupFormError('Please enter a team or group name.');
      return;
    }

    setIsSavingGroup(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: groupFormName.trim(),
          type: groupFormType,
          houseId: groupFormHouseId,
          competitionId: groupFormCompId || undefined,
          description: groupFormDescription.trim() || undefined,
          studentIds: groupFormStudentIds,
        });
        setLearnersNotice(`Updated ${groupFormType} "${groupFormName.trim()}"!`);
      } else {
        const created = await addGroup({
          name: groupFormName.trim(),
          type: groupFormType,
          houseId: groupFormHouseId,
          competitionId: groupFormCompId || undefined,
          description: groupFormDescription.trim() || undefined,
          studentIds: groupFormStudentIds,
          createdBy: teacherUser?.name || 'GBHS Staff',
        });
        if (autoSelectNewGroupInAward) {
          setSelectedHouse(created.houseId);
          setRecipientTargetMode('groups');
          setSelectedGroupId(created.id);
          setSelectedStudentIds([]);
        }
        setLearnersNotice(`Created ${groupFormType} "${created.name}" with ${created.studentIds.length} learner${created.studentIds.length === 1 ? '' : 's'}!`);
      }
      setTimeout(() => setLearnersNotice(null), 4000);
      setShowGroupModal(false);
      setEditingGroup(null);
    } catch (err: any) {
      setGroupFormError(err?.message || 'Failed to save team/group.');
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsDeletingGroup(true);
    try {
      await deleteGroup(groupToDelete.id);
      if (selectedGroupId === groupToDelete.id) {
        setSelectedGroupId(null);
      }
      setLearnersNotice(`Removed "${groupToDelete.name}".`);
      setTimeout(() => setLearnersNotice(null), 3500);
      setGroupToDelete(null);
    } catch (err: any) {
      setGroupFormError(err?.message || 'Failed to delete group.');
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const openCreateLearnerModal = (presetHouse?: HouseId, selectAfterInAward = false) => {
    setEditingLearner(null);
    setLearnerFormName('');
    setLearnerFormHouseId(presetHouse || selectedHouse);
    setLearnerFormYear(9);
    setLearnerFormTutor('');
    setLearnerFormError(null);
    setAutoSelectNewLearnerInAward(selectAfterInAward);
    setShowLearnerModal(true);
  };

  const openEditLearnerModal = (student: Student) => {
    setEditingLearner(student);
    setLearnerFormName(student.name);
    setLearnerFormHouseId(student.houseId);
    setLearnerFormYear(student.yearLevel);
    setLearnerFormTutor(student.tutorGroup || '');
    setLearnerFormError(null);
    setAutoSelectNewLearnerInAward(false);
    setShowLearnerModal(true);
  };

  const handleSaveLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    setLearnerFormError(null);
    if (!learnerFormName.trim()) {
      setLearnerFormError('Please enter the learner full name.');
      return;
    }

    setIsSavingLearner(true);
    try {
      if (editingLearner) {
        await updateStudent(editingLearner.id, {
          name: learnerFormName.trim(),
          houseId: learnerFormHouseId,
          yearLevel: learnerFormYear,
          tutorGroup: learnerFormTutor.trim() || undefined,
        });
        setLearnersNotice(`Updated learner "${learnerFormName.trim()}".`);
      } else {
        const created = await addStudent({
          name: learnerFormName.trim(),
          houseId: learnerFormHouseId,
          yearLevel: learnerFormYear,
          tutorGroup: learnerFormTutor.trim() || undefined,
        });
        if (autoSelectNewLearnerInAward) {
          setSelectedHouse(created.houseId);
          setRecipientTargetMode('learners');
          setRosterSourceMode('whole_school');
          setSelectedGroupId(null);
          setSelectedStudentIds((prev) => Array.from(new Set([...prev, created.id])));
        }
        setLearnersNotice(`Added learner "${created.name}" to ${rawHouses[created.houseId]?.name}.`);
      }
      setTimeout(() => setLearnersNotice(null), 4000);
      setShowLearnerModal(false);
      setEditingLearner(null);
    } catch (err: any) {
      setLearnerFormError(err?.message || 'Failed to save learner.');
    } finally {
      setIsSavingLearner(false);
    }
  };

  const handleConfirmDeleteLearner = async () => {
    if (!learnerToDelete) return;
    setIsDeletingLearner(true);
    try {
      await deleteStudent(learnerToDelete.id);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== learnerToDelete.id));
      setLearnersNotice(`Removed learner "${learnerToDelete.name}".`);
      setTimeout(() => setLearnersNotice(null), 3500);
      setLearnerToDelete(null);
    } catch (err: any) {
      setLearnersNotice(`Failed to remove learner: ${err?.message || 'Error'}`);
    } finally {
      setIsDeletingLearner(false);
    }
  };

  const handleBulkImportLearners = async () => {
    setBulkLearnersError(null);
    const lines = bulkLearnersText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setBulkLearnersError('Paste at least one learner line (e.g. "Wiremu Parata, 11, TU-11A" or one name per line).');
      return;
    }

    const parsed: Omit<Student, 'id'>[] = [];
    for (const line of lines) {
      const parts = line.split(/[\t,]+/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;
      const name = parts[0];
      if (!name) continue;
      let yearLevel = 9;
      let tutorGroup: string | undefined;
      let houseId: HouseId = bulkLearnersHouseId;

      for (let i = 1; i < parts.length; i++) {
        const token = parts[i];
        const lower = token.toLowerCase();
        if (lower.includes('tawhiri') || lower.includes('tāwhiri')) {
          houseId = 'tawhirimatea';
        } else if (lower.includes('tumat') || lower.includes('tūmat')) {
          houseId = 'tumatauenga';
        } else if (lower.includes('tangaroa')) {
          houseId = 'tangaroa';
        } else if (lower.includes('tane') || lower.includes('tāne')) {
          houseId = 'tanemahuta';
        } else {
          const yrMatch = token.match(/^(?:y|yr|year\s*)?(\d{1,2})$/i);
          if (yrMatch) {
            const yr = parseInt(yrMatch[1], 10);
            if (yr >= 1 && yr <= 13) {
              yearLevel = yr;
              continue;
            }
          }
          tutorGroup = token;
        }
      }

      parsed.push({ name, houseId, yearLevel, tutorGroup });
    }

    if (parsed.length === 0) {
      setBulkLearnersError('Could not parse any valid learner names.');
      return;
    }

    setIsImportingLearners(true);
    try {
      const count = await bulkAddStudents(parsed);
      setShowBulkLearnersModal(false);
      setBulkLearnersText('');
      setLearnersNotice(`Imported ${count} learner${count === 1 ? '' : 's'} to Cloud Firestore!`);
      setTimeout(() => setLearnersNotice(null), 4000);
    } catch (err: any) {
      setBulkLearnersError(err?.message || 'Failed to bulk import learners.');
    } finally {
      setIsImportingLearners(false);
    }
  };

  const handleConfirmClearDirectory = async () => {
    setIsClearingLearners(true);
    try {
      const count = await clearLearnerDirectory();
      setSelectedStudentIds([]);
      setShowClearLearnersConfirm(false);
      setLearnersNotice(
        `Cleared ${count} learner${count === 1 ? '' : 's'} from the active directory. Records are safely archived (not deleted), and all allocated points remain intact.`
      );
      setTimeout(() => setLearnersNotice(null), 5000);
    } catch (err: any) {
      setLearnersNotice(`Failed to clear learner directory: ${err?.message || 'Error'}`);
    } finally {
      setIsClearingLearners(false);
    }
  };

  const handleRestoreSingleLearner = async (student: Student) => {
    setIsRestoringLearners(true);
    try {
      await restoreStudent(student.id);
      setLearnersNotice(`Restored "${student.name}" to the active learner directory.`);
      setTimeout(() => setLearnersNotice(null), 3500);
    } catch (err: any) {
      setLearnersNotice(`Failed to restore learner: ${err?.message || 'Error'}`);
    } finally {
      setIsRestoringLearners(false);
    }
  };

  const handleRestoreAllArchived = async () => {
    setIsRestoringLearners(true);
    try {
      const count = await restoreAllArchivedStudents();
      setShowArchivedLearners(false);
      setLearnersNotice(`Restored ${count} archived learner${count === 1 ? '' : 's'} back to the active directory.`);
      setTimeout(() => setLearnersNotice(null), 4000);
    } catch (err: any) {
      setLearnersNotice(`Failed to restore archived learners: ${err?.message || 'Error'}`);
    } finally {
      setIsRestoringLearners(false);
    }
  };

  const handleJumpToAwardGroup = (group: RecipientGroup) => {
    setSelectedHouse(group.houseId);
    if (group.competitionId && competitions.some((c) => c.id === group.competitionId)) {
      setSelectedCompId(group.competitionId);
    }
    setRecipientTargetMode('groups');
    setSelectedGroupId(group.id);
    setSelectedStudentIds([]);
    setActiveTab('award');
  };

  // Handler for selecting an allowed competition score tier
  const handleSelectScoreOption = (score: AllowedScoreOption) => {
    const resolvedPoints =
      score.points < 0
        ? score.points
        : scoreSignMode === 'deduct'
        ? -Math.abs(score.points)
        : score.points;
    setPointsValue(resolvedPoints);
    setCustomPoints(resolvedPoints.toString());
    setSelectedScoreLabel(score.label);
  };

  const handleSwitchScoreSignMode = (mode: 'award' | 'deduct') => {
    setScoreSignMode(mode);
    setPointsValue((prev) => {
      const next = mode === 'deduct' ? -Math.abs(prev || 10) : Math.abs(prev || 10);
      setCustomPoints(next.toString());
      return next;
    });
  };

  // Ledger Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterHouse, setFilterHouse] = useState<string>('All');

  // Selected house for detailed profile in "houses" tab
  const [activeHouseProfile, setActiveHouseProfile] = useState<HouseId>('tumatauenga');

  // Teacher Management State (Cloud Firestore)
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState('GBHS Staff');
  const [newTeacherIsAdmin, setNewTeacherIsAdmin] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'single' | 'paste'>('single');
  const [rosterNotice, setRosterNotice] = useState<string | null>(null);
  const [addTeacherError, setAddTeacherError] = useState<string | null>(null);

  // Edit Teacher Modal State
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  // Admin Promotion / Demotion Confirmation Modal State
  const [teacherAdminToggleTarget, setTeacherAdminToggleTarget] = useState<TeacherAccount | null>(null);
  const [isTogglingTeacherAdmin, setIsTogglingTeacherAdmin] = useState(false);

  // Delete Teacher Modal State
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherAccount | null>(null);
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false);

  // Delete Ledger Event Modal State
  const [eventToDelete, setEventToDelete] = useState<PointEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Settings Confirmation Modals State
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [showClearTermConfirm, setShowClearTermConfirm] = useState(false);
  const [termToReset, setTermToReset] = useState<SchoolTerm>('Term 1');
  const [isResetting, setIsResetting] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Admin Competitions Management State
  const [showAddCompModal, setShowAddCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [compToDelete, setCompToDelete] = useState<Competition | null>(null);
  const [isDeletingComp, setIsDeletingComp] = useState(false);
  const [isSavingComp, setIsSavingComp] = useState(false);
  const [compFormError, setCompFormError] = useState<string | null>(null);

  // Add/Edit Competition Form Fields
  const [compName, setCompName] = useState('');
  const [compCategory, setCompCategory] = useState<PointCategory>('Sports & Athletics');
  const [compTerm, setCompTerm] = useState<SchoolTerm>('Term 1');
  const [compDescription, setCompDescription] = useState('');
  const [compIsActive, setCompIsActive] = useState(true);
  const [compAllowedScores, setCompAllowedScores] = useState<AllowedScoreOption[]>([
    { points: 100, label: '1st Place' },
    { points: 75, label: '2nd Place' },
    { points: 50, label: '3rd Place' },
    { points: 25, label: '4th Place' },
    { points: 10, label: 'Participation' },
  ]);
  const [newScorePoints, setNewScorePoints] = useState('');
  const [newScoreLabel, setNewScoreLabel] = useState('');
  const [compRecipientMode, setCompRecipientMode] = useState<'whole_school' | 'custom_roster'>('whole_school');
  const [compCustomStudentIds, setCompCustomStudentIds] = useState<string[]>([]);
  const [compStudentSearch, setCompStudentSearch] = useState('');

  const openAddCompModal = () => {
    setCompName('');
    setCompCategory('Sports & Athletics');
    setCompTerm('Term 1');
    setCompDescription('');
    setCompIsActive(true);
    setCompAllowedScores([
      { points: 100, label: '1st Place' },
      { points: 75, label: '2nd Place' },
      { points: 50, label: '3rd Place' },
      { points: 25, label: '4th Place' },
      { points: 10, label: 'Participation' },
    ]);
    setNewScorePoints('');
    setNewScoreLabel('');
    setCompRecipientMode('whole_school');
    setCompCustomStudentIds([]);
    setCompStudentSearch('');
    setCompFormError(null);
    setShowAddCompModal(true);
  };

  const openEditCompModal = (comp: Competition) => {
    setEditingComp(comp);
    setCompName(comp.name);
    setCompCategory(comp.category);
    setCompTerm(comp.term);
    setCompDescription(comp.description || '');
    setCompIsActive(comp.isActive);
    setCompAllowedScores([...comp.allowedScores]);
    setNewScorePoints('');
    setNewScoreLabel('');
    setCompRecipientMode(comp.recipientMode || 'whole_school');
    setCompCustomStudentIds(comp.customStudentIds || []);
    setCompStudentSearch('');
    setCompFormError(null);
  };

  const handleToggleCompCustomStudent = (studentId: string) => {
    setCompCustomStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAddScoreTier = () => {
    const pts = parseInt(newScorePoints.trim(), 10);
    if (isNaN(pts) || pts === 0 || pts < -1000 || pts > 1000) {
      setCompFormError('Please enter a non-zero number between -1000 and 1000 for points.');
      return;
    }
    const label = newScoreLabel.trim() || undefined;
    setCompAllowedScores([...compAllowedScores, { points: pts, label }]);
    setNewScorePoints('');
    setNewScoreLabel('');
    setCompFormError(null);
  };

  const handleRemoveScoreTier = (index: number) => {
    setCompAllowedScores(compAllowedScores.filter((_, i) => i !== index));
  };

  const applyScorePreset = (presetType: 'placings' | 'trophy' | 'academic' | 'merits' | 'penalties') => {
    if (presetType === 'placings') {
      setCompAllowedScores([
        { points: 100, label: '1st Place' },
        { points: 75, label: '2nd Place' },
        { points: 50, label: '3rd Place' },
        { points: 25, label: '4th Place' },
        { points: 10, label: 'Participation / Entry' },
      ]);
    } else if (presetType === 'trophy') {
      setCompAllowedScores([
        { points: 150, label: '1st Place Trophy' },
        { points: 100, label: '2nd Place' },
        { points: 75, label: '3rd Place' },
        { points: 50, label: '4th Place' },
      ]);
    } else if (presetType === 'academic') {
      setCompAllowedScores([
        { points: 80, label: '1st Place' },
        { points: 60, label: '2nd Place' },
        { points: 40, label: '3rd Place' },
        { points: 20, label: '4th Place' },
      ]);
    } else if (presetType === 'merits') {
      setCompAllowedScores([
        { points: 50, label: 'Excellence (Gold)' },
        { points: 30, label: 'Commendation (Silver)' },
        { points: 15, label: 'Merit Award' },
        { points: 5, label: 'Weekly Tutor Check' },
      ]);
    } else if (presetType === 'penalties') {
      setCompAllowedScores([
        { points: -10, label: 'Minor Infringement' },
        { points: -25, label: 'Rule Breach / Late' },
        { points: -50, label: 'Major Penalty' },
      ]);
    }
  };

  const appendPenaltyTiers = () => {
    const penalties: AllowedScoreOption[] = [
      { points: -10, label: 'Minor Infringement' },
      { points: -25, label: 'Rule Breach' },
      { points: -50, label: 'Major Penalty' },
    ];
    const existingValues = new Set(compAllowedScores.map((s) => s.points));
    const toAdd = penalties.filter((p) => !existingValues.has(p.points));
    if (toAdd.length > 0) {
      setCompAllowedScores([...compAllowedScores, ...toAdd]);
    }
  };

  const handleSaveNewCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompFormError(null);
    if (!compName.trim()) {
      setCompFormError('Please enter a competition name.');
      return;
    }
    if (compAllowedScores.length === 0) {
      setCompFormError('Please configure at least one allowed score tier.');
      return;
    }

    setIsSavingComp(true);
    try {
      await addCompetition({
        name: compName.trim(),
        category: compCategory,
        term: compTerm,
        description: compDescription.trim() || undefined,
        isActive: compIsActive,
        allowedScores: compAllowedScores,
        recipientMode: compRecipientMode,
        customStudentIds: compRecipientMode === 'custom_roster' ? compCustomStudentIds : [],
        order: competitions.length,
      });
      setShowAddCompModal(false);
      setSettingsNotice(`Successfully created competition "${compName.trim()}"!`);
      setTimeout(() => setSettingsNotice(null), 4000);
    } catch (err: any) {
      setCompFormError(err?.message || 'Failed to save competition.');
    } finally {
      setIsSavingComp(false);
    }
  };

  const handleSaveEditedCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp) return;
    setCompFormError(null);
    if (!compName.trim()) {
      setCompFormError('Please enter a competition name.');
      return;
    }
    if (compAllowedScores.length === 0) {
      setCompFormError('Please configure at least one allowed score tier.');
      return;
    }

    setIsSavingComp(true);
    try {
      await updateCompetition(editingComp.id, {
        name: compName.trim(),
        category: compCategory,
        term: compTerm,
        description: compDescription.trim() || undefined,
        isActive: compIsActive,
        allowedScores: compAllowedScores,
        recipientMode: compRecipientMode,
        customStudentIds: compRecipientMode === 'custom_roster' ? compCustomStudentIds : [],
      });
      setEditingComp(null);
      setSettingsNotice(`Successfully updated competition "${compName.trim()}"!`);
      setTimeout(() => setSettingsNotice(null), 4000);
    } catch (err: any) {
      setCompFormError(err?.message || 'Failed to update competition.');
    } finally {
      setIsSavingComp(false);
    }
  };

  const handleConfirmDeleteCompetition = async () => {
    if (!compToDelete) return;
    setIsDeletingComp(true);
    try {
      await deleteCompetition(compToDelete.id);
      setCompToDelete(null);
      setSettingsNotice(`Competition removed.`);
      setTimeout(() => setSettingsNotice(null), 3000);
    } catch (err: any) {
      alert(`Failed to delete competition: ${err?.message}`);
    } finally {
      setIsDeletingComp(false);
    }
  };

  const handleAdminCustomPointsApply = () => {
    const parsed = parseInt(adminCustomInput.trim(), 10);
    if (isNaN(parsed) || parsed === 0 || parsed < -1000 || parsed > 1000) {
      setSubmitError('Custom adjustment must be a non-zero whole number between -1000 and 1000.');
      return;
    }
    setSubmitError(null);
    setPointsValue(parsed);
    setCustomPoints(parsed.toString());
    setScoreSignMode(parsed < 0 ? 'deduct' : 'award');
    setSelectedScoreLabel('Admin Adjustment');
  };

  const handleSubmitPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (pointsValue === 0 || pointsValue < -1000 || pointsValue > 1000 || isNaN(pointsValue)) {
      setSubmitError('Points must be a non-zero value between -1000 and 1000.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCat = activeCompetition ? activeCompetition.category : category;
      const activeTerm =
        activeCompetition && activeCompetition.term !== 'All Year'
          ? (activeCompetition.term as any)
          : term;

      // Determine recipients: either selected group members or individually checked learners
      const usingGroup = recipientTargetMode === 'groups' && selectedGroup !== null;
      const recipientNames = usingGroup
        ? selectedGroupMembers.map((m) => m.name)
        : selectedStudentNames;

      const matchedTier = activeCompetition?.allowedScores?.find((s) => {
        const effective =
          s.points < 0
            ? s.points
            : scoreSignMode === 'deduct'
            ? -Math.abs(s.points)
            : s.points;
        return effective === pointsValue;
      });
      const tierLabel = selectedScoreLabel ?? matchedTier?.label;
      const labelSuffix = tierLabel ? ` · ${tierLabel}` : '';
      const prefix = pointsValue < 0 ? 'Deduction: ' : '';
      const rawTitle = activeCompetition
        ? `${prefix}${activeCompetition.name}${labelSuffix}`
        : pointsValue < 0
        ? 'House Points Deduction'
        : 'House Competition Points';
      const generatedTitle = rawTitle.slice(0, 300);

      await addPoints({
        houseId: selectedHouse,
        points: pointsValue,
        title: generatedTitle,
        category: activeCat,
        term: activeTerm,
        awardedBy: teacherUser?.name || 'GBHS Staff',
        notes: notes.trim() || undefined,
        studentRecipients: recipientNames.length > 0 ? recipientNames : undefined,
        competitionId: activeCompetition?.id,
        groupId: usingGroup ? selectedGroup!.id : undefined,
        groupName: usingGroup ? selectedGroup!.name : undefined,
      });

      setLastSubmittedPoints(pointsValue);
      setSubmitSuccess(true);
      setNotes('');
      setSelectedStudentIds([]);
      setSelectedGroupId(null);

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to log points:', err);
      setSubmitError(err?.message || 'Failed to sync score to Cloud Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered ledger events
  const filteredEvents = events.filter((ev) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      ev.title.toLowerCase().includes(q) ||
      ev.awardedBy.toLowerCase().includes(q) ||
      (ev.notes && ev.notes.toLowerCase().includes(q)) ||
      (ev.groupName && ev.groupName.toLowerCase().includes(q)) ||
      (ev.studentRecipients && ev.studentRecipients.some((r) => r.toLowerCase().includes(q)));
    const matchesCat = filterCategory === 'All' || ev.category === filterCategory;
    const matchesH = filterHouse === 'All' || ev.houseId === filterHouse;
    return matchesSearch && matchesCat && matchesH;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-between">
      {/* Top Staff Header - Compact & Mobile Responsive */}
      <header className="bg-neutral-950/95 border-b border-neutral-800/80 px-3 sm:px-8 py-2.5 sm:py-3.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Return Link */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            <button
              onClick={() => setCurrentView('assembly')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Assembly</span>
            </button>

            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-neutral-800 min-w-0">
              <img
                src={gbhsCrestLogo}
                alt="Gisborne Boys' High School · Toa Hinga Kore, Toa Mate Kore"
                className="h-8 xs:h-9 sm:h-11 w-auto object-contain rounded-lg shadow border border-red-600/50 shrink-0"
              />
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#ed1c24] font-display leading-tight truncate">
                  Gisborne Boys&apos; High School
                </span>
                <span className="text-[9px] sm:text-[11px] text-white font-medium tracking-normal leading-tight truncate">
                  Toa hinga kore, toa mate kore.
                </span>
              </div>
              <span className="hidden xl:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/60 font-mono ml-1 shrink-0">
                Teacher Scoring Portal
              </span>
            </div>
          </div>

          {/* Teacher Info & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 max-w-[140px] xs:max-w-[200px] sm:max-w-none">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-800 text-white flex items-center justify-center font-bold text-[11px] sm:text-xs uppercase shadow-sm shrink-0">
                {teacherUser?.name?.charAt(0) || 'T'}
              </div>
              <div className="text-left min-w-0 truncate">
                <div className="text-xs font-bold text-white leading-tight truncate">
                  {teacherUser?.name}
                </div>
                <div className="text-[9px] sm:text-[10px] text-neutral-400 font-mono truncate hidden xs:block">
                  {teacherUser?.email}
                </div>
              </div>
            </div>

            <button
              onClick={logoutTeacher}
              className="p-1.5 sm:p-2 rounded-lg bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-800 text-neutral-400 hover:text-red-300 transition-colors shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Teacher Content Area */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1">
        {/* Navigation Tabs - Horizontal Swipeable on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 sm:mb-6 border-b border-neutral-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('award')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'award'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Award Points Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('learners')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'learners'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <UsersRound className="w-3.5 h-3.5 text-sky-400" />
            <span>Learners, Teams &amp; Groups ({students.length} · {groups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Live Points Ledger ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('houses')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'houses'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>House Profiles & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Staff Directory ({authorizedTeachers.length})</span>
          </button>

          {/* Hidden Admin-Only Tab: Competition Controls */}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Competition Controls</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-950 text-red-300 font-mono border border-red-800">
                Admin
              </span>
            </button>
          )}
        </div>

        {/* TAB 1: AWARD POINTS DESK */}
        {activeTab === 'award' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="mb-6 pb-4 border-b border-neutral-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-white font-display">
                      Award House Competition Points
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Select the competition and official points tier. Updates the live Assembly Display instantly across all school screens.
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-semibold text-neutral-300 self-start sm:self-auto cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-amber-400" />
                      <span>Manage Defaults</span>
                    </button>
                  )}
                </div>
              </div>

              {submitSuccess && (
                <div
                  className={`mb-6 p-4 rounded-xl border text-xs flex items-center gap-3 animate-fadeIn ${
                    lastSubmittedPoints < 0
                      ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                      : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                  }`}
                >
                  <CheckCircle
                    className={`w-5 h-5 shrink-0 ${
                      lastSubmittedPoints < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  />
                  <div>
                    <p className="font-bold">
                      {lastSubmittedPoints < 0
                        ? `Point Deduction (${lastSubmittedPoints} pts) Logged!`
                        : `Points (${formatPoints(lastSubmittedPoints)} pts) Successfully Logged!`}
                    </p>
                    <p
                      className={`mt-0.5 ${
                        lastSubmittedPoints < 0 ? 'text-rose-300/90' : 'text-emerald-300/90'
                      }`}
                    >
                      The live leaderboard and school hall screens have been updated.
                    </p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-3 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="font-bold">Failed to Log Points</p>
                    <p className="text-red-300/90 mt-0.5">{submitError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitPoints} className="space-y-6">
                {/* 1. COMPETITION (FIRST OPTION!) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      1. School Competition
                    </label>
                    {activeCompetition && (
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {competitions.findIndex((c) => c.id === activeCompetition.id) === 0 ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" /> Current Primary Competition
                          </span>
                        ) : (
                          `Competition #${competitions.findIndex((c) => c.id === activeCompetition.id) + 1}`
                        )}
                      </span>
                    )}
                  </div>

                  {/* Competition Main Dropdown */}
                  <div className="relative mb-2.5">
                    <select
                      value={selectedCompId}
                      onChange={(e) => setSelectedCompId(e.target.value)}
                      aria-label="Select School Competition"
                      className="w-full bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-xl px-3.5 py-3 text-sm font-semibold text-white focus:outline-none cursor-pointer shadow-sm appearance-none"
                    >
                      {competitions.map((comp, idx) => (
                        <option key={comp.id} value={comp.id} className="bg-neutral-900 text-white py-1">
                          {idx === 0 ? `⭐ ${comp.name} [Current Top]` : `${idx + 1}. ${comp.name}`} ({comp.category} · {comp.term})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                      ▼
                    </div>
                  </div>

                  {/* Quick Select Chips for Active Competitions */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[11px] text-neutral-500 mr-1 font-medium">Quick switch:</span>
                    {competitions.slice(0, 5).map((comp, idx) => {
                      const isCompSelected = (activeCompetition?.id || '') === comp.id;
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => setSelectedCompId(comp.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                            isCompSelected
                              ? 'bg-red-950/80 text-red-200 border-red-700 font-bold'
                              : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {idx === 0 && '⭐ '}
                          {comp.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Competition Info Banner */}
                  {activeCompetition && (
                    <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">
                            {activeCompetition.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                            {activeCompetition.category}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                            {activeCompetition.term}
                          </span>
                        </div>
                        {activeCompetition.description && (
                          <p className="text-neutral-400 text-[11px] mt-1 leading-relaxed">
                            {activeCompetition.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. POINTS AMOUNT (SUPPORTS POSITIVE AWARDS & NEGATIVE PENALTIES) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                      2. Points to Award or Deduct (Official Competition Tiers)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                        <button
                          type="button"
                          onClick={() => handleSwitchScoreSignMode('award')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            scoreSignMode === 'award'
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Award</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchScoreSignMode('deduct')}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            scoreSignMode === 'deduct'
                              ? 'bg-rose-700 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <MinusCircle className="w-3 h-3" />
                          <span>Deduct (-)</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-neutral-400 font-mono">
                        Selected:{' '}
                        <strong
                          className={`font-bold font-mono ${
                            pointsValue < 0 ? 'text-rose-400' : 'text-white'
                          }`}
                        >
                          {formatPoints(pointsValue)} pts
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Allowed Score Buttons configured for this competition */}
                  {activeCompetition && activeCompetition.allowedScores && activeCompetition.allowedScores.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {activeCompetition.allowedScores.map((score, sIdx) => {
                        const effectivePoints =
                          score.points < 0
                            ? score.points
                            : scoreSignMode === 'deduct'
                            ? -Math.abs(score.points)
                            : score.points;
                        const isNegative = effectivePoints < 0;
                        const isScoreSelected = pointsValue === effectivePoints;

                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSelectScoreOption(score)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                              isScoreSelected
                                ? isNegative
                                  ? 'bg-rose-800 text-white border-rose-500 shadow-md ring-2 ring-rose-500/50 scale-[1.02]'
                                  : 'bg-red-700 text-white border-red-500 shadow-md ring-2 ring-red-500/50 scale-[1.02]'
                                : isNegative
                                ? 'bg-rose-950/30 text-rose-200 border-rose-900/60 hover:border-rose-700 hover:bg-rose-950/60'
                                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                            }`}
                          >
                            <span className="font-mono font-extrabold text-lg leading-tight">
                              {formatPoints(effectivePoints)}
                            </span>
                            <span
                              className={`text-[11px] mt-1 truncate max-w-full font-medium ${
                                isScoreSelected
                                  ? isNegative
                                    ? 'text-rose-100'
                                    : 'text-red-100'
                                  : 'text-neutral-400'
                              }`}
                            >
                              {score.label || `${Math.abs(effectivePoints)} Points`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-400 text-xs">
                      No custom defaults defined for this event. Using standard 50 pts default.
                    </div>
                  )}

                  {/* Admin-only quick custom positive/negative override, or Fair Play lock for staff */}
                  {isSuperAdmin ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-400 mt-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Admin Override: Teachers are restricted to official tiers above. As Admin, you can enter a custom +/- score if needed:
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="-1000"
                          max="1000"
                          value={adminCustomInput}
                          onChange={(e) => setAdminCustomInput(e.target.value)}
                          placeholder="e.g. -15 or 40"
                          className="w-28 px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={handleAdminCustomPointsApply}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-400 mt-2.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        Scores are locked to official competition tiers (Award or Deduct) to guarantee fair play across all houses.
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. RECIPIENT SCHOOL HOUSE, TEAMS/GROUPS & STUDENT NAME SELECTOR */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                        3. Recipient School House, Team / Group or Learners
                      </label>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        House: <strong className="text-white font-bold">{rawHouses[selectedHouse]?.name}</strong>
                      </span>
                    </div>

                    {/* House Selection Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(Object.keys(rawHouses) as HouseId[]).map((id) => {
                        const house = rawHouses[id];
                        const isSelected = selectedHouse === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setSelectedHouse(id);
                              setSelectedStudentIds([]);
                              setSelectedGroupId(null);
                            }}
                            className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-950 border-white ring-2 ring-red-600 scale-[1.02]'
                                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div
                              className="w-12 h-12 p-1 rounded-xl bg-neutral-900 border mb-2"
                              style={{ borderColor: house.borderStroke }}
                            >
                              <img
                                src={house.crest}
                                alt={house.name}
                                className="w-full h-full object-contain"
                                loading="eager"
                              />
                            </div>
                            <span className="font-bold text-xs text-white font-display truncate w-full">
                              {house.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 truncate w-full">
                              {house.colorName} · {house.currentTotal} pts
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teams / Groups OR Individual Learners Selector Box */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Users className="w-4 h-4 text-red-500" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Recipient Selector
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                            {rawHouses[selectedHouse]?.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Choose a competition team/group, select individual learners, or leave unselected for a whole-house score.
                        </p>
                      </div>

                      {/* Target Mode Toggle: Teams & Groups vs Individual Learners */}
                      <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setRecipientTargetMode('groups')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            recipientTargetMode === 'groups'
                              ? 'bg-red-700 text-white shadow-sm font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <UsersRound className="w-3 h-3" />
                          <span>Teams &amp; Groups ({houseGroups.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecipientTargetMode('learners')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            recipientTargetMode === 'learners'
                              ? 'bg-red-700 text-white shadow-sm font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <GraduationCap className="w-3 h-3" />
                          <span>Individual Learners ({houseStudents.length})</span>
                        </button>
                      </div>
                    </div>

                    {recipientTargetMode === 'groups' ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-300 font-medium">
                            Select a house team or group for{' '}
                            <strong className="text-white">{rawHouses[selectedHouse]?.name}</strong>:
                          </span>
                          <div className="flex items-center gap-2">
                            {selectedGroupId && (
                              <button
                                type="button"
                                onClick={() => setSelectedGroupId(null)}
                                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-neutral-300 cursor-pointer"
                              >
                                Clear Group
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                openCreateGroupModal(selectedHouse, activeCompetition?.id || '', true)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-700/70 text-[11px] font-bold text-red-200 cursor-pointer transition-colors"
                            >
                              <FolderPlus className="w-3.5 h-3.5 text-red-400" />
                              <span>+ Create Group</span>
                            </button>
                          </div>
                        </div>

                        {houseGroups.length === 0 ? (
                          <div className="p-5 rounded-xl bg-neutral-900/50 border border-dashed border-neutral-800 text-center space-y-2">
                            <p className="text-xs text-neutral-400">
                              No teams or groups created for {rawHouses[selectedHouse]?.name} yet.
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                openCreateGroupModal(selectedHouse, activeCompetition?.id || '', true)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                              <span>Create {rawHouses[selectedHouse]?.name} Competition Group</span>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                            {houseGroups.map((grp) => {
                              const isSelected = selectedGroupId === grp.id;
                              const isCompLinked =
                                activeCompetition && grp.competitionId === activeCompetition.id;
                              const linkedComp = grp.competitionId
                                ? competitions.find((c) => c.id === grp.competitionId)
                                : null;

                              return (
                                <button
                                  key={grp.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedGroupId(isSelected ? null : grp.id)
                                  }
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-red-950/50 border-red-500 ring-1 ring-red-500'
                                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-xs text-white truncate">
                                      {grp.name}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-neutral-950 text-neutral-300 border border-neutral-800 shrink-0">
                                      {grp.type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className="text-[10px] text-neutral-400 font-mono">
                                      {grp.studentIds.length} member{grp.studentIds.length === 1 ? '' : 's'}
                                    </span>
                                    {linkedComp && (
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-[160px] ${
                                          isCompLinked
                                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                                        }`}
                                      >
                                        {isCompLinked ? '★ ' : ''}
                                        {linkedComp.name}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 border-t border-neutral-800/80">
                          {selectedGroup ? (
                            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-emerald-300">
                                  Selected {selectedGroup.type}: {selectedGroup.name} ({selectedGroupMembers.length} members)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEditGroupModal(selectedGroup)}
                                  className="text-neutral-300 hover:text-white underline text-[10px] cursor-pointer"
                                >
                                  Edit Members
                                </button>
                              </div>
                              {selectedGroupMembers.length > 0 && (
                                <p className="text-[10px] text-neutral-300 truncate">
                                  Members: {selectedGroupMembers.map((m) => m.name).join(', ')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/50 border border-neutral-800 text-[11px] text-neutral-400">
                              <CheckCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              <span>
                                <strong>Entire House Award:</strong> No specific group is selected. Score will apply to {rawHouses[selectedHouse]?.name} as a whole.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Roster Source Toggle + Quick Add Learner */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                            <button
                              type="button"
                              onClick={() => setRosterSourceMode('competition')}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                rosterSourceMode === 'competition'
                                  ? 'bg-red-700 text-white shadow-sm font-bold'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <Trophy className="w-3 h-3" />
                              <span>Competition Squad ({competitionHouseStudentIds.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRosterSourceMode('whole_school')}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                rosterSourceMode === 'whole_school'
                                  ? 'bg-red-700 text-white shadow-sm font-bold'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <GraduationCap className="w-3 h-3" />
                              <span>Whole Student Population ({houseStudents.length})</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => openCreateLearnerModal(selectedHouse, true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] font-semibold text-neutral-200 cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3 text-emerald-400" />
                            <span>+ Quick Add Learner</span>
                          </button>
                        </div>

                        {/* Filter Bar: Search, Year Pills, Select/Clear Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                          {/* Search Input */}
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                            <input
                              type="text"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              placeholder={`Search ${rawHouses[selectedHouse]?.name} students by name or tutor...`}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-600 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                            />
                            {studentSearch && (
                              <button
                                type="button"
                                onClick={() => setStudentSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Year Level Filter Pills */}
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            <span className="text-[10px] text-neutral-500 font-semibold mr-0.5">Year:</span>
                            {(['all', 9, 10, 11, 12, 13] as const).map((yr) => (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => setStudentYearFilter(yr)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                                  studentYearFilter === yr
                                    ? 'bg-red-950 text-red-200 border-red-700'
                                    : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
                                }`}
                              >
                                {yr === 'all' ? 'All' : `Y${yr}`}
                              </button>
                            ))}
                          </div>

                          {/* Bulk Selection Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={handleSelectAllFilteredStudents}
                              disabled={displayedStudents.length === 0}
                              className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 text-[10px] font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Select All ({displayedStudents.length})
                            </button>
                            {selectedStudentIds.length > 0 && (
                              <button
                                type="button"
                                onClick={handleClearStudentSelection}
                                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Checkbox Students List Space */}
                        <div className="mt-2">
                          {displayedStudents.length === 0 ? (
                            <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800/80 text-center text-xs text-neutral-400 space-y-1.5">
                              <p>
                                {rosterSourceMode === 'competition' && competitionHouseStudentIds.length === 0
                                  ? `No specific participants registered for ${rawHouses[selectedHouse]?.name} in this competition squad yet.`
                                  : 'No students found matching your search filter.'}
                              </p>
                              {rosterSourceMode === 'competition' && (
                                <button
                                  type="button"
                                  onClick={() => setRosterSourceMode('whole_school')}
                                  className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer underline"
                                >
                                  Switch to Whole Student Population ({houseStudents.length} students)
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                              {displayedStudents.map((st) => {
                                const isChecked = selectedStudentIds.includes(st.id);
                                return (
                                  <label
                                    key={st.id}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                      isChecked
                                        ? 'bg-red-950/40 border-red-600/90 ring-1 ring-red-600/60'
                                        : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleStudentSelection(st.id)}
                                        className="w-4 h-4 rounded text-red-600 bg-neutral-950 border-neutral-700 focus:ring-0 focus:outline-none cursor-pointer accent-red-600 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <span className="font-semibold text-white block truncate">
                                          {st.name}
                                        </span>
                                        <span className="text-[10px] text-neutral-400 font-mono">
                                          Year {st.yearLevel} {st.tutorGroup ? `· ${st.tutorGroup}` : ''}
                                        </span>
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                                        isChecked
                                          ? 'bg-red-900/80 text-white'
                                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                                      }`}
                                    >
                                      {st.tutorGroup || `Y${st.yearLevel}`}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Selection Summary / House Award Note */}
                        <div className="pt-2 border-t border-neutral-800/80">
                          {selectedStudents.length > 0 ? (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  {selectedStudents.length} {selectedStudents.length === 1 ? 'Student' : 'Students'} Selected:
                                </span>
                                <button
                                  type="button"
                                  onClick={handleClearStudentSelection}
                                  className="text-[10px] text-neutral-400 hover:text-neutral-200 underline"
                                >
                                  Deselect All
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                {selectedStudents.map((st) => (
                                  <span
                                    key={st.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-[11px] text-white font-medium"
                                  >
                                    <span>{st.name}</span>
                                    <span className="text-[9px] text-neutral-400 font-mono">({st.tutorGroup || `Y${st.yearLevel}`})</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleStudentSelection(st.id)}
                                      className="text-neutral-400 hover:text-red-400 ml-0.5 cursor-pointer"
                                      title="Remove"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900/50 border border-neutral-800 text-[11px] text-neutral-400">
                              <CheckCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                              <span>
                                <strong>Entire House Award:</strong> No individual students are selected. Score will apply to {rawHouses[selectedHouse]?.name} as a whole-house entry.
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. ADDITIONAL NOTES */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    4. Additional Notes / Details (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Record breaking performance by Year 11 squad"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-4 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    pointsValue < 0
                      ? 'bg-rose-800 hover:bg-rose-700 shadow-rose-950/50'
                      : 'bg-red-700 hover:bg-red-600 shadow-red-950/50'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Syncing Score to Cloud Firestore...</span>
                    </>
                  ) : pointsValue < 0 ? (
                    <>
                      <MinusCircle className="w-4 h-4" />
                      <span>
                        Deduct {pointsValue} Points from {rawHouses[selectedHouse]?.name}
                        {recipientTargetMode === 'groups' && selectedGroup
                          ? ` · ${selectedGroup.name}`
                          : recipientTargetMode === 'learners' && selectedStudents.length > 0
                          ? ` (${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'})`
                          : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>
                        Award {formatPoints(pointsValue)} Points to {rawHouses[selectedHouse]?.name}
                        {recipientTargetMode === 'groups' && selectedGroup
                          ? ` · ${selectedGroup.name}`
                          : recipientTargetMode === 'learners' && selectedStudents.length > 0
                          ? ` (${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'})`
                          : ''}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE POINTS LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white font-display">
                  Official House Points Audit Ledger
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Search, verify, and manage all competition records awarded by teachers.
                </p>
              </div>

              <button
                onClick={exportLedgerCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Export Official CSV</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search event, athletics, swimming, haka, or teacher name..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterHouse}
                  onChange={(e) => setFilterHouse(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-600"
                >
                  <option value="All">All Houses</option>
                  <option value="tawhirimatea">Tāwhirimātea (Purple)</option>
                  <option value="tumatauenga">Tūmatauenga (Red)</option>
                  <option value="tangaroa">Tangaroa (Yellow)</option>
                  <option value="tanemahuta">Tāne Mahuta (Green)</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-red-600"
                >
                  <option value="All">All Categories</option>
                  <option value="Sports & Athletics">Sports & Athletics</option>
                  <option value="Academic & STEM">Academic & STEM</option>
                  <option value="Kaupapa Māori & Haka">Kaupapa Māori & Haka</option>
                  <option value="Arts & Cultural">Arts & Cultural</option>
                  <option value="Attendance & Merits">Attendance & Merits</option>
                </select>
              </div>
            </div>

            {/* Event List */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800/80">
              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-500">
                  No records match your current filters.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const house = rawHouses[ev.houseId];
                  return (
                    <div
                      key={ev.id}
                      className="p-4 sm:p-5 hover:bg-neutral-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-11 h-11 p-1 rounded-xl bg-neutral-950 border shrink-0"
                          style={{ borderColor: house?.borderStroke }}
                        >
                          <HouseCrestImage
                            houseId={ev.houseId}
                            houseName={house?.name || ev.houseId}
                            src={house?.crest}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-bold font-display"
                              style={{ color: house?.primaryColor }}
                            >
                              {house?.name}
                            </span>
                            <span className="text-neutral-600 text-xs">·</span>
                            <span className="text-xs text-neutral-400 font-medium">
                              {ev.category}
                            </span>
                            <span className="text-neutral-600 text-xs">·</span>
                            <span className="text-xs text-neutral-400">{ev.term}</span>
                          </div>

                          <h4 className="text-sm sm:text-base font-semibold text-white leading-snug">
                            {ev.title}
                          </h4>

                          {ev.notes && (
                            <p className="text-xs text-neutral-400 mt-0.5 italic">{ev.notes}</p>
                          )}

                          {ev.groupName && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-sky-950/70 text-sky-200 border border-sky-700/60 font-semibold">
                                <UsersRound className="w-3 h-3 text-sky-400" />
                                Team / Group: {ev.groupName}
                              </span>
                            </div>
                          )}

                          {ev.studentRecipients && ev.studentRecipients.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                                <Users className="w-3 h-3 text-red-400" />
                                Recipients ({ev.studentRecipients.length}):
                              </span>
                              {ev.studentRecipients.map((name, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 text-neutral-200 border border-neutral-700/80 font-medium"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="text-[11px] text-neutral-400 mt-1">
                            Logged by {ev.awardedBy} ·{' '}
                            {new Date(ev.timestamp).toLocaleDateString('en-NZ', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span
                          className={`px-3 py-1 rounded-lg border font-mono font-bold text-sm ${
                            ev.points < 0 ? 'bg-rose-950/70 text-rose-300 border-rose-700/70' : ''
                          }`}
                          style={
                            ev.points < 0
                              ? undefined
                              : {
                                  backgroundColor: `${house?.primaryColor}15`,
                                  color: house?.borderStroke,
                                  borderColor: `${house?.borderStroke}50`,
                                }
                          }
                        >
                          {formatPoints(ev.points)} pts
                        </span>

                        {isSuperAdmin && (
                          <button
                            onClick={() => setEventToDelete(ev)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete entry"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HOUSE PROFILES & ANALYTICS */}
        {activeTab === 'houses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: 4 Houses Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Select House
              </h3>
              {houses.map((house) => {
                const isSelected = activeHouseProfile === house.id;
                return (
                  <button
                    key={house.id}
                    onClick={() => setActiveHouseProfile(house.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-neutral-900 border-white ring-1 ring-red-600'
                        : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 p-1 rounded-xl bg-neutral-900 border shrink-0"
                        style={{ borderColor: house.borderStroke }}
                      >
                        <HouseCrestImage
                          houseId={house.id}
                          houseName={house.name}
                          src={house.crest}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white font-display">
                          {house.name}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {house.colorName} · Rank #{house.rank}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-white font-mono tabular-nums">
                        {house.currentTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-neutral-400 block">points</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Detailed Analytics for Selected House */}
            <div className="lg:col-span-2 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
              {(() => {
                const house = rawHouses[activeHouseProfile];
                const houseEvents = events.filter((e) => e.houseId === house.id);
                const categoryBreakdown: Record<string, number> = {};
                houseEvents.forEach((ev) => {
                  categoryBreakdown[ev.category] = (categoryBreakdown[ev.category] || 0) + ev.points;
                });

                return (
                  <>
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-800">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 p-1.5 rounded-2xl bg-neutral-950 border-2 shrink-0 shadow-lg"
                          style={{ borderColor: house.borderStroke }}
                        >
                          <HouseCrestImage
                            houseId={house.id}
                            houseName={house.name}
                            src={house.crest}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                            {house.colorName} House · Rank #{house.rank}
                          </div>
                          <h2 className="text-2xl font-black text-white font-display">
                            {house.name}
                          </h2>
                          <p className="text-xs text-neutral-400 mt-0.5">{house.patron}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-3xl font-black text-white font-mono tabular-nums">
                          {house.currentTotal.toLocaleString()}
                        </span>
                        <span className="text-xs text-neutral-400 block font-medium">total points</span>
                      </div>
                    </div>

                    {/* Cultural Background */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Cultural Meaning & Patron Atua
                      </h4>
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
                        {house.meaning}
                      </p>
                      <p className="text-xs text-neutral-400 italic mt-1.5">
                        Motto: "{house.motto}"
                      </p>
                    </div>

                    {/* Category Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                        Points Distribution by Category
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          'Sports & Athletics',
                          'Academic & STEM',
                          'Kaupapa Māori & Haka',
                          'Arts & Cultural',
                          'Attendance & Merits',
                        ].map((cat) => {
                          const val = categoryBreakdown[cat] || 0;
                          return (
                            <div
                              key={cat}
                              className="p-3 rounded-xl bg-neutral-950 border border-neutral-800"
                            >
                              <span className="text-[11px] text-neutral-400 truncate block mb-1">
                                {cat}
                              </span>
                              <span className="text-lg font-bold text-white font-mono tabular-nums">
                                {val.toLocaleString()}{' '}
                                <span className="text-xs font-normal text-neutral-400">pts</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent 5 victories for this house */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                        Recent Logged Events ({houseEvents.length})
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {houseEvents.slice(0, 5).map((e) => (
                          <div
                            key={e.id}
                            className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60 flex items-center justify-between text-xs"
                          >
                            <span className="text-neutral-200 truncate pr-2">
                              {e.title}
                              {e.groupName ? ` (${e.groupName})` : ''}
                            </span>
                            <span
                              className={`font-mono font-bold shrink-0 ${
                                e.points < 0 ? 'text-rose-400' : 'text-amber-400'
                              }`}
                            >
                              {formatPoints(e.points)} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 4: CLOUD FIRESTORE STAFF DIRECTORY */}
        {activeTab === 'teachers' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      Cloud Firestore Directory
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-display">
                    Authorized Teachers & Staff
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Directly synced with Cloud Firestore. Only verified Google accounts listed below can log in to award house points.
                  </p>
                </div>

                {isSuperAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRosterNotice(null);
                        setImportMode('single');
                        setShowAddTeacherModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Teacher</span>
                    </button>

                    <button
                      onClick={() => {
                        setRosterNotice(null);
                        setImportMode('paste');
                        setShowAddTeacherModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors border border-neutral-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bulk Paste List</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-400 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Read-Only Directory</span>
                  </div>
                )}
              </div>

              {/* Notice Message */}
              {rosterNotice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{rosterNotice}</span>
                </div>
              )}

              {/* Cloud Database Status Card */}
              <div className="mb-6 p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-neutral-200">
                      Cloud Firestore Real-Time Database Active
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    {authorizedTeachers.length} Authorized Accounts
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  All additions, edits, and removals sync in real-time across Cloud Firestore. Any teacher added here (e.g. Corban) can immediately sign in with their Google account.
                </p>
              </div>

              {/* Current Teacher List with Edit and Delete Actions */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Staff Accounts ({authorizedTeachers.length})
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {isSuperAdmin
                      ? 'Modify or remove permissions below'
                      : 'Admin-managed staff access (View only)'}
                  </span>
                </div>

                {authorizedTeachers.map((t) => (
                  <div
                    key={t.email}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-750 transition-colors flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-red-900/60 text-red-200 border border-red-700/50 flex items-center justify-center font-bold text-xs shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-2 truncate">
                          <span className="truncate">{t.name}</span>
                          {t.isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950 text-red-300 border border-red-800 shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate">{t.email}</div>
                        <div className="text-[10.5px] text-neutral-500 truncate mt-0.5 sm:hidden">{t.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-neutral-400 hidden sm:inline mr-1">{t.role}</span>
                      
                      {isSuperAdmin && (
                        <>
                          {/* Promote to Admin / Revoke Admin Toggle Button */}
                          {t.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net' ? (
                            <span
                              className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-amber-400/90 hidden md:inline-flex items-center gap-1"
                              title="Primary School Administrator"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Primary</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTeacherAdminToggleTarget(t)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                t.isSuperAdmin
                                  ? 'bg-amber-950/60 hover:bg-amber-900/70 border-amber-700/70 text-amber-300'
                                  : 'bg-neutral-900 hover:bg-red-950/70 border-neutral-700 hover:border-red-700/70 text-neutral-300 hover:text-red-200'
                              }`}
                              title={
                                t.isSuperAdmin
                                  ? `Revoke Admin privileges from ${t.name}`
                                  : `Promote ${t.name} to Admin`
                              }
                            >
                              {t.isSuperAdmin ? (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="hidden sm:inline">Remove Admin</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3.5 h-3.5 text-red-400" />
                                  <span className="hidden sm:inline">Make Admin</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Modify / Edit Button */}
                          <button
                            onClick={() => {
                              setEditingTeacher(t);
                              setEditName(t.name);
                              setEditRole(t.role);
                              setEditIsAdmin(!!t.isSuperAdmin || t.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net');
                            }}
                            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title={`Modify details for ${t.name}`}
                            aria-label="Edit Teacher"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {/* Remove / Delete Button */}
                          {t.email.toLowerCase() === 'hermanf@gisboyshigh.net' ? (
                            <span
                              className="p-2 rounded-lg text-neutral-600 cursor-not-allowed"
                              title="SuperAdmin account cannot be removed"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
                            </span>
                          ) : (
                            <button
                              onClick={() => setTeacherToDelete(t)}
                              className="p-2 rounded-lg bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-900/60 text-neutral-400 hover:text-red-300 transition-colors cursor-pointer"
                              title={`Remove ${t.name}`}
                              aria-label="Remove Teacher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal for Adding Teachers */}
            {showAddTeacherModal && isSuperAdmin && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <h3 className="font-bold text-base text-white">
                      Add Staff to Cloud Database
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddTeacherModal(false);
                        setAddTeacherError(null);
                      }}
                      className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {addTeacherError && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{addTeacherError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 p-1 bg-neutral-950 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setImportMode('single');
                        setAddTeacherError(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        importMode === 'single'
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Add Single Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportMode('paste');
                        setAddTeacherError(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        importMode === 'paste'
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      Bulk Paste List
                    </button>
                  </div>

                  {importMode === 'single' ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newTeacherEmail.trim() || !newTeacherEmail.includes('@')) {
                          setAddTeacherError('Please enter a valid Google account email.');
                          return;
                        }
                        addAuthorizedTeacher({
                          name: newTeacherName.trim() || newTeacherEmail.split('@')[0],
                          email: newTeacherEmail.trim().toLowerCase(),
                          role: newTeacherRole.trim() || 'GBHS Staff',
                          isSuperAdmin:
                            newTeacherEmail.trim().toLowerCase() === 'hermanf@gisboyshigh.net' ||
                            newTeacherIsAdmin,
                        });
                        setRosterNotice(`Added ${newTeacherName.trim() || newTeacherEmail.trim()} to the Cloud Firestore database.`);
                        setNewTeacherName('');
                        setNewTeacherEmail('');
                        setNewTeacherIsAdmin(false);
                        setAddTeacherError(null);
                        setShowAddTeacherModal(false);
                      }}
                      className="space-y-3.5 text-xs"
                    >
                      <div>
                        <label className="block text-neutral-300 font-semibold mb-1">
                          Teacher Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Corban"
                          value={newTeacherName}
                          onChange={(e) => {
                            setNewTeacherName(e.target.value);
                            setAddTeacherError(null);
                          }}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:outline-none rounded-lg text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-300 font-semibold mb-1">
                          School Google Email (@gisboyshigh.net) *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. corban@gisboyshigh.net"
                          value={newTeacherEmail}
                          onChange={(e) => {
                            setNewTeacherEmail(e.target.value);
                            setAddTeacherError(null);
                          }}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:outline-none rounded-lg text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-300 font-semibold mb-1">
                          Role / House Assignment
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Tangaroa House Dean"
                          value={newTeacherRole}
                          onChange={(e) => setNewTeacherRole(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:outline-none rounded-lg text-white"
                        />
                      </div>

                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTeacherIsAdmin}
                          onChange={(e) => setNewTeacherIsAdmin(e.target.checked)}
                          className="mt-0.5 accent-red-600 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Grant Administrator Privileges</span>
                          </span>
                          <span className="block text-[11px] text-neutral-400">
                            Allows managing competitions, score defaults, staff directory, and ledger edits.
                          </span>
                        </div>
                      </label>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTeacherModal(false);
                            setNewTeacherIsAdmin(false);
                            setAddTeacherError(null);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors"
                        >
                          Save to Database
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <p className="text-neutral-400 leading-relaxed">
                        Paste rows or email addresses. Tab, comma, or newline-separated values will be automatically parsed and committed to Cloud Firestore.
                      </p>
                      <textarea
                        rows={6}
                        value={pasteText}
                        onChange={(e) => {
                          setPasteText(e.target.value);
                          setAddTeacherError(null);
                        }}
                        placeholder={`Corban\tSports Lead\tcorban@gisboyshigh.net\nMs. K. Walker\tAquatics Dean\tk.walker@gisboyshigh.net`}
                        className="w-full p-3 bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:outline-none rounded-lg text-white font-mono text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTeacherModal(false);
                            setAddTeacherError(null);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseTeacherCsv(pasteText);
                            if (parsed.length === 0) {
                              setAddTeacherError('No valid email addresses found in pasted text.');
                              return;
                            }
                            const merged = [...authorizedTeachers];
                            parsed.forEach((p) => {
                              const idx = merged.findIndex((m) => m.email.toLowerCase() === p.email.toLowerCase());
                              if (idx >= 0) {
                                merged[idx] = p;
                              } else {
                                merged.push(p);
                              }
                            });
                            updateAuthorizedTeachers(merged);
                            setRosterNotice(`Successfully synced ${parsed.length} staff to Cloud Firestore.`);
                            setPasteText('');
                            setAddTeacherError(null);
                            setShowAddTeacherModal(false);
                          }}
                          className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors"
                        >
                          Import & Sync to Cloud
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal for Modifying / Editing Existing Teacher */}
            {editingTeacher && isSuperAdmin && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-blue-400" />
                      <h3 className="font-bold text-base text-white">
                        Modify Teacher Details
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingTeacher(null)}
                      className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!editName.trim()) {
                        setRosterNotice('Teacher name cannot be empty.');
                        return;
                      }
                      try {
                        const isPrimary = editingTeacher.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net';
                        await editAuthorizedTeacher(editingTeacher.email, {
                          name: editName.trim(),
                          role: editRole.trim() || 'GBHS Staff',
                          isSuperAdmin: isPrimary ? true : editIsAdmin,
                        });
                        setRosterNotice(`Updated details for ${editName.trim()} in Cloud Firestore.`);
                        setEditingTeacher(null);
                      } catch (err: any) {
                        setRosterNotice(`Failed to update teacher: ${err?.message || 'Error'}`);
                      }
                    }}
                    className="space-y-3.5 text-xs"
                  >
                    <div>
                      <label className="block text-neutral-400 font-semibold mb-1">
                        Google Account Email (Identifier)
                      </label>
                      <input
                        type="email"
                        disabled
                        value={editingTeacher.email}
                        className="w-full px-3 py-2 bg-neutral-950/60 border border-neutral-800/80 rounded-lg text-neutral-400 font-mono cursor-not-allowed"
                      />
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Email addresses serve as Google OAuth IDs. To change an email, remove this teacher and add a new entry.
                      </p>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-semibold mb-1">
                        Display Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Corban"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:outline-none rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-semibold mb-1">
                        Role / House Assignment
                      </label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        placeholder="e.g. Tangaroa House Dean"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 focus:outline-none rounded-lg text-white"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={editingTeacher.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net'}
                          checked={
                            editingTeacher.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net'
                              ? true
                              : editIsAdmin
                          }
                          onChange={(e) => setEditIsAdmin(e.target.checked)}
                          className="mt-0.5 accent-red-600 cursor-pointer disabled:opacity-60"
                        />
                        <div className="space-y-0.5">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Administrator Privileges</span>
                          </span>
                          <span className="block text-[11px] text-neutral-400">
                            {editingTeacher.email.toLowerCase().trim() === 'hermanf@gisboyshigh.net'
                              ? 'Primary School Administrator account always retains Admin privileges.'
                              : 'Grants full access to Competition Controls, custom score adjustments, ledger deletions, and Staff Directory management.'}
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingTeacher(null)}
                        className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Modal for Deleting Teacher Confirmation */}
            {teacherToDelete && isSuperAdmin && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2 text-red-400">
                      <Trash2 className="w-4 h-4" />
                      <h3 className="font-bold text-base text-white">
                        Remove Staff Member
                      </h3>
                    </div>
                    <button
                      onClick={() => !isDeletingTeacher && setTeacherToDelete(null)}
                      disabled={isDeletingTeacher}
                      className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-neutral-300 leading-relaxed">
                      Are you sure you want to remove <strong className="text-white">{teacherToDelete.name}</strong> from the Cloud Firestore database?
                    </p>
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1 font-mono text-[11px]">
                      <div className="text-neutral-400">Email: <span className="text-neutral-200">{teacherToDelete.email}</span></div>
                      <div className="text-neutral-400">Role: <span className="text-neutral-200">{teacherToDelete.role}</span></div>
                    </div>
                    <p className="text-red-400/90 text-[11px] leading-relaxed">
                      They will immediately lose scoring access in the Teacher Portal and won't be able to log in with their Google account.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      disabled={isDeletingTeacher}
                      onClick={() => setTeacherToDelete(null)}
                      className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingTeacher}
                      onClick={async () => {
                        setIsDeletingTeacher(true);
                        try {
                          await removeAuthorizedTeacher(teacherToDelete.email);
                          setRosterNotice(`Successfully removed ${teacherToDelete.name} (${teacherToDelete.email}) from authorized staff.`);
                          setTeacherToDelete(null);
                        } catch (err: any) {
                          setRosterNotice(`Error removing teacher: ${err?.message || 'Failed'}`);
                        } finally {
                          setIsDeletingTeacher(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isDeletingTeacher ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Removing...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Remove</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Promoting / Demoting Teacher Admin Privileges */}
            {teacherAdminToggleTarget && isSuperAdmin && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2 text-amber-400">
                      <ShieldCheck className="w-4 h-4" />
                      <h3 className="font-bold text-base text-white">
                        {teacherAdminToggleTarget.isSuperAdmin
                          ? 'Revoke Admin Privileges'
                          : 'Promote Teacher to Admin'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isTogglingTeacherAdmin && setTeacherAdminToggleTarget(null)}
                      disabled={isTogglingTeacherAdmin}
                      className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="text-neutral-300 leading-relaxed">
                      {teacherAdminToggleTarget.isSuperAdmin ? (
                        <>
                          Change <strong className="text-white">{teacherAdminToggleTarget.name}</strong> back to a standard Teacher account? They will still be able to sign in and award competition points.
                        </>
                      ) : (
                        <>
                          Promote <strong className="text-white">{teacherAdminToggleTarget.name}</strong> to an <strong className="text-amber-300">Administrator</strong>?
                        </>
                      )}
                    </p>
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1 font-mono text-[11px]">
                      <div className="text-neutral-400">Email: <span className="text-neutral-200">{teacherAdminToggleTarget.email}</span></div>
                      <div className="text-neutral-400">Role: <span className="text-neutral-200">{teacherAdminToggleTarget.role}</span></div>
                    </div>
                    {!teacherAdminToggleTarget.isSuperAdmin && (
                      <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-800/40 text-amber-200 space-y-1">
                        <p className="font-bold text-xs">Admin Access Includes:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90">
                          <li>Managing Competition Controls, default score tiers &amp; ordering</li>
                          <li>Adding, editing, promoting, or removing staff accounts</li>
                          <li>Deleting ledger entries and resetting term or year scores</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      disabled={isTogglingTeacherAdmin}
                      onClick={() => setTeacherAdminToggleTarget(null)}
                      className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isTogglingTeacherAdmin}
                      onClick={async () => {
                        setIsTogglingTeacherAdmin(true);
                        const nextAdmin = !teacherAdminToggleTarget.isSuperAdmin;
                        try {
                          await editAuthorizedTeacher(teacherAdminToggleTarget.email, {
                            isSuperAdmin: nextAdmin,
                          });
                          setRosterNotice(
                            nextAdmin
                              ? `${teacherAdminToggleTarget.name} has been promoted to Administrator.`
                              : `${teacherAdminToggleTarget.name} has been changed back to standard Teacher access.`
                          );
                          setTeacherAdminToggleTarget(null);
                        } catch (err: any) {
                          setRosterNotice(`Failed to update admin role: ${err?.message || 'Error'}`);
                        } finally {
                          setIsTogglingTeacherAdmin(false);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50 ${
                        teacherAdminToggleTarget.isSuperAdmin
                          ? 'bg-neutral-700 hover:bg-neutral-600'
                          : 'bg-red-700 hover:bg-red-600'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {isTogglingTeacherAdmin
                          ? 'Updating...'
                          : teacherAdminToggleTarget.isSuperAdmin
                          ? 'Confirm Remove Admin'
                          : 'Confirm Make Admin'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: LEARNERS, TEAMS & COMPETITION GROUPS MANAGEMENT */}
        {activeTab === 'learners' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
              {/* Header & Primary Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <UsersRound className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold text-white font-display">
                      Learners, Teams &amp; Competition Groups
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    Manage your school learners, build house teams or competition groups, and jump straight to awarding or deducting points for any group.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCreateGroupModal(selectedHouse, activeCompetition?.id || '', false)}
                    className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Group / Team</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateLearnerModal(selectedHouse, false)}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Add Learner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkLearnersHouseId(selectedHouse);
                      setBulkLearnersText('');
                      setBulkLearnersError(null);
                      setShowBulkLearnersModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Bulk Import</span>
                  </button>
                </div>
              </div>

              {learnersNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{learnersNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLearnersNotice(null)}
                    className="text-emerald-400 hover:text-white text-xs ml-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Sub-tab Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLearnersSubTab('groups')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      learnersSubTab === 'groups'
                        ? 'bg-red-700 text-white shadow-md'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    <UsersRound className="w-4 h-4" />
                    <span>Teams &amp; Groups ({(groups || []).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearnersSubTab('students')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      learnersSubTab === 'students'
                        ? 'bg-red-700 text-white shadow-md'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Learners Directory ({(students || []).length})</span>
                  </button>
                </div>

                {learnersSubTab === 'students' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {archivedStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowArchivedLearners((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                          showArchivedLearners
                            ? 'bg-amber-950/70 border-amber-700 text-amber-200'
                            : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {showArchivedLearners
                            ? `Viewing Archived (${archivedStudents.length})`
                            : `Archived (${archivedStudents.length})`}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={students.length === 0}
                      onClick={() => setShowClearLearnersConfirm(true)}
                      title="Clear active learner directory without deleting records or allocated points"
                      className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-700/60 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-400" />
                      <span>Clear Directory</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SUB-TAB A: TEAMS & GROUPS */}
              {learnersSubTab === 'groups' && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        placeholder="Search teams or groups..."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl text-xs text-white"
                      />
                    </div>
                    <select
                      value={groupHouseFilter}
                      onChange={(e) => setGroupHouseFilter(e.target.value as HouseId | 'all')}
                      className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl text-xs text-white cursor-pointer"
                    >
                      <option value="all">All Houses</option>
                      {(Object.keys(rawHouses) as HouseId[]).map((hid) => (
                        <option key={hid} value={hid}>
                          {rawHouses[hid].name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={groupCompFilter}
                      onChange={(e) => setGroupCompFilter(e.target.value)}
                      className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl text-xs text-white cursor-pointer"
                    >
                      <option value="all">All Competitions</option>
                      <option value="general">General (Unlinked)</option>
                      {competitions.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtered Groups Grid */}
                  {(() => {
                    const filteredGroups = (groups || []).filter((grp) => {
                      if (groupHouseFilter !== 'all' && grp.houseId !== groupHouseFilter) return false;
                      if (groupCompFilter === 'general' && grp.competitionId) return false;
                      if (
                        groupCompFilter !== 'all' &&
                        groupCompFilter !== 'general' &&
                        grp.competitionId !== groupCompFilter
                      ) {
                        return false;
                      }
                      if (groupSearch.trim()) {
                        const q = groupSearch.trim().toLowerCase();
                        const matchName = grp.name.toLowerCase().includes(q);
                        const matchDesc = grp.description?.toLowerCase().includes(q);
                        if (!matchName && !matchDesc) return false;
                      }
                      return true;
                    });

                    if (filteredGroups.length === 0) {
                      return (
                        <div className="p-10 rounded-2xl bg-neutral-950/70 border border-dashed border-neutral-800 text-center space-y-3">
                          <UsersRound className="w-8 h-8 text-neutral-600 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-200">No Teams or Groups Found</p>
                            <p className="text-xs text-neutral-400 max-w-md mx-auto">
                              Create a house competition team or group (e.g. Senior Relay Squad or Haka Roopu) and assign learners so staff can score them in one tap.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openCreateGroupModal(selectedHouse, activeCompetition?.id || '', false)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
                          >
                            <FolderPlus className="w-4 h-4" />
                            <span>Create First Group / Team</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredGroups.map((grp) => {
                          const house = rawHouses[grp.houseId];
                          const linkedComp = grp.competitionId
                            ? competitions.find((c) => c.id === grp.competitionId)
                            : null;
                          const members = (allStudents || []).filter((s) => grp.studentIds.includes(s.id));

                          return (
                            <div
                              key={grp.id}
                              className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 flex flex-col justify-between gap-4 transition-all"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {house && (
                                      <div
                                        className="w-9 h-9 rounded-xl bg-neutral-900 border p-1 shrink-0"
                                        style={{ borderColor: house.borderStroke }}
                                      >
                                        <img
                                          src={house.crest}
                                          alt={house.name}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h3 className="font-bold text-sm text-white truncate font-display">
                                        {grp.name}
                                      </h3>
                                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                        <span className="text-[10px] font-semibold text-neutral-400">
                                          {house?.name || grp.houseId}
                                        </span>
                                        <span className="text-neutral-700">·</span>
                                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] uppercase font-mono font-bold text-neutral-300">
                                          {grp.type}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
                                          {members.length} learner{members.length === 1 ? '' : 's'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {linkedComp && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-[11px] font-medium">
                                    <Trophy className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{linkedComp.name}</span>
                                  </div>
                                )}

                                {grp.description && (
                                  <p className="text-xs text-neutral-400 leading-relaxed">
                                    {grp.description}
                                  </p>
                                )}

                                {/* Member Preview Chips */}
                                {members.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {members.slice(0, 6).map((m) => (
                                      <span
                                        key={m.id}
                                        className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300"
                                      >
                                        {m.name}
                                      </span>
                                    ))}
                                    {members.length > 6 && (
                                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-mono">
                                        +{members.length - 6} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-neutral-500 italic">
                                    No individual learners assigned yet (house-level team).
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800/80">
                                <button
                                  type="button"
                                  onClick={() => handleJumpToAwardGroup(grp)}
                                  className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>Award / Deduct Points</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditGroupModal(grp)}
                                    title="Edit Group"
                                    className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-blue-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGroupToDelete(grp)}
                                    title="Delete Group"
                                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-800 text-red-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUB-TAB B: LEARNERS DIRECTORY */}
              {learnersSubTab === 'students' && (
                <div className="space-y-4">
                  {/* Info Banner when viewing Archived vs Active */}
                  {showArchivedLearners && (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                          <Archive className="w-3.5 h-3.5 text-amber-400" />
                          <span>Archived Learner Directory ({archivedStudents.length})</span>
                        </div>
                        <p className="text-[11px] text-amber-200/80">
                          Cleared learners are safely kept here without losing any points allocated to them. Restore individual learners or bring the whole list back anytime.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {archivedStudents.length > 0 && (
                          <button
                            type="button"
                            disabled={isRestoringLearners}
                            onClick={handleRestoreAllArchived}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            <span>{isRestoringLearners ? 'Restoring...' : 'Restore All'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowArchivedLearners(false)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
                        >
                          Back to Active
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={learnerDirSearch}
                        onChange={(e) => setLearnerDirSearch(e.target.value)}
                        placeholder="Search by learner name or tutor..."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl text-xs text-white"
                      />
                    </div>
                    <select
                      value={learnerDirHouseFilter}
                      onChange={(e) => setLearnerDirHouseFilter(e.target.value as HouseId | 'all')}
                      className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl text-xs text-white cursor-pointer"
                    >
                      <option value="all">All Houses</option>
                      {(Object.keys(rawHouses) as HouseId[]).map((hid) => (
                        <option key={hid} value={hid}>
                          {rawHouses[hid].name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={learnerDirYearFilter}
                      onChange={(e) =>
                        setLearnerDirYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                      }
                      className="px-3 py-2 bg-neutral-950 border border-neutral-800 focus:border-red-500 rounded-xl text-xs text-white cursor-pointer"
                    >
                      <option value="all">All Year Levels</option>
                      {[9, 10, 11, 12, 13].map((yr) => (
                        <option key={yr} value={yr}>
                          Year {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const sourceList = showArchivedLearners ? archivedStudents : students;
                    const filteredLearners = (sourceList || []).filter((s) => {
                      if (learnerDirHouseFilter !== 'all' && s.houseId !== learnerDirHouseFilter) return false;
                      if (learnerDirYearFilter !== 'all' && s.yearLevel !== learnerDirYearFilter) return false;
                      if (learnerDirSearch.trim()) {
                        const q = learnerDirSearch.trim().toLowerCase();
                        const matchName = s.name.toLowerCase().includes(q);
                        const matchTutor = s.tutorGroup?.toLowerCase().includes(q);
                        if (!matchName && !matchTutor) return false;
                      }
                      return true;
                    });

                    if (filteredLearners.length === 0) {
                      return (
                        <div className="p-10 rounded-2xl bg-neutral-950/70 border border-dashed border-neutral-800 text-center space-y-3">
                          <GraduationCap className="w-8 h-8 text-neutral-600 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-neutral-200">
                              {showArchivedLearners
                                ? 'No Archived Learners'
                                : students.length === 0
                                ? 'Active Learner Directory Is Cleared'
                                : 'No Learners Match Filters'}
                            </p>
                            <p className="text-xs text-neutral-400 max-w-md mx-auto">
                              {showArchivedLearners
                                ? 'There are no archived learners matching your current filters.'
                                : students.length === 0
                                ? 'Add or bulk import your updated learner roll anytime. Previously allocated points remain safely in the ledger.'
                                : 'Add individual learners or bulk import your school roll.'}
                            </p>
                          </div>
                          {!showArchivedLearners && (
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => openCreateLearnerModal(selectedHouse, false)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold cursor-pointer"
                              >
                                <UserPlus className="w-4 h-4" />
                                <span>Add Learner</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkLearnersHouseId(selectedHouse);
                                  setBulkLearnersText('');
                                  setBulkLearnersError(null);
                                  setShowBulkLearnersModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Bulk Import</span>
                              </button>
                              {archivedStudents.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setShowArchivedLearners(true)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-700/60 text-amber-200 text-xs font-semibold cursor-pointer"
                                >
                                  <ArchiveRestore className="w-4 h-4 text-amber-400" />
                                  <span>View Archived ({archivedStudents.length})</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[540px] overflow-y-auto pr-1">
                        {filteredLearners.map((s) => {
                          const house = rawHouses[s.houseId];
                          return (
                            <div
                              key={s.id}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                                showArchivedLearners
                                  ? 'bg-neutral-950/50 border-amber-900/40'
                                  : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                              }`}
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="font-bold text-xs text-white truncate">{s.name}</div>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-neutral-400">
                                  <span
                                    className="px-1.5 py-0.5 rounded bg-neutral-900 border font-semibold text-neutral-200"
                                    style={{ borderColor: house?.borderStroke || '#404040' }}
                                  >
                                    {house?.name || s.houseId}
                                  </span>
                                  <span className="font-mono">Y{s.yearLevel}</span>
                                  {s.tutorGroup && (
                                    <span className="font-mono text-neutral-500">{s.tutorGroup}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {showArchivedLearners ? (
                                  <button
                                    type="button"
                                    disabled={isRestoringLearners}
                                    onClick={() => handleRestoreSingleLearner(s)}
                                    title="Restore to active directory"
                                    className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <ArchiveRestore className="w-3 h-3" />
                                    <span>Restore</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openEditLearnerModal(s)}
                                      title="Edit learner"
                                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-blue-300 cursor-pointer"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setLearnerToDelete(s)}
                                      title="Remove learner"
                                      className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-800 text-red-400 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HIDDEN ADMIN-ONLY COMPETITION CONTROLS & SCORE MATRIX */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!isSuperAdmin ? (
              <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Administrator Restricted Area</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Competition ordering, default allowed scores, and championship reset controls are restricted to School Administrators.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('award')}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs cursor-pointer transition-colors shadow-md"
                >
                  Return to Award Points Desk
                </button>
              </div>
            ) : (
              <>
                {/* Main Competitions Header Card */}
                <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h2 className="text-xl font-bold text-white font-display">
                          Competition Administration & Defaults Matrix
                        </h2>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                        Control the competitions teachers see on their scoring desk. Change allowed score defaults per event, add new competitions, and reorder events so your <strong>current active competition is at the top</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openAddCompModal}
                      className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-red-950/50 cursor-pointer transition-all self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Competition</span>
                    </button>
                  </div>

                  {settingsNotice && (
                    <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{settingsNotice}</span>
                      </div>
                      <button
                        onClick={() => setSettingsNotice(null)}
                        className="text-emerald-400 hover:text-white text-xs ml-2 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Current Active Competition Callout (#1 Position) */}
                  {competitions.length > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-neutral-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-600/50 text-amber-400 shrink-0 mt-0.5">
                          <Star className="w-5 h-5 fill-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                              Current Primary Competition (Top of Teacher Desk)
                            </span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-neutral-900 text-neutral-300 border border-neutral-800">
                              {competitions[0].category}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5 font-display">
                            {competitions[0].name}
                          </h4>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            This competition is selected by default when teachers open their scoring portal.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap sm:justify-end shrink-0">
                        {competitions[0].allowedScores.map((score, sIdx) => (
                          <span
                            key={sIdx}
                            className={`px-2 py-1 rounded border text-[11px] font-mono font-bold ${
                              score.points < 0
                                ? 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                                : 'bg-neutral-900 border-neutral-800 text-amber-300'
                            }`}
                          >
                            {formatPoints(score.points)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competitions Order & Score Defaults List */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        All Competitions ({competitions.length}) · Ordered by Display Priority
                      </h3>
                      <span className="text-[11px] text-neutral-500">
                        Use arrows or &quot;Set as Current&quot; to change ordering
                      </span>
                    </div>

                    <div className="space-y-3">
                      {competitions.map((comp, index) => {
                        const isTop = index === 0;
                        return (
                          <div
                            key={comp.id}
                            className={`p-4 rounded-xl border transition-all ${
                              isTop
                                ? 'bg-neutral-950/90 border-amber-500/40 ring-1 ring-amber-500/20'
                                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              {/* Left Info */}
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isTop ? (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700 font-bold text-[10px] flex items-center gap-1 font-mono">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      #1 CURRENT TOP
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-neutral-400 border border-neutral-800 font-mono text-[10px] font-bold">
                                      #{index + 1}
                                    </span>
                                  )}

                                  <h4 className="font-bold text-sm text-white truncate font-display">
                                    {comp.name}
                                  </h4>

                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 text-neutral-300 border border-neutral-800">
                                    {comp.category}
                                  </span>

                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 text-neutral-400 border border-neutral-800">
                                    {comp.term}
                                  </span>

                                  {!comp.isActive && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-neutral-500 border border-neutral-800">
                                      Archived
                                    </span>
                                  )}
                                </div>

                                {comp.description && (
                                  <p className="text-xs text-neutral-400 leading-relaxed">
                                    {comp.description}
                                  </p>
                                )}

                                {/* Allowed Score Defaults Chips */}
                                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mr-1">
                                    Allowed Points:
                                  </span>
                                  {comp.allowedScores.map((score, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${
                                        score.points < 0
                                          ? 'bg-rose-950/40 border-rose-800/50'
                                          : 'bg-neutral-900 border-neutral-800'
                                      }`}
                                    >
                                      <span
                                        className={`font-mono font-bold ${
                                          score.points < 0 ? 'text-rose-400' : 'text-red-400'
                                        }`}
                                      >
                                        {formatPoints(score.points)}
                                      </span>
                                      {score.label && (
                                        <span className="text-neutral-400 text-[10px]">
                                          ({score.label})
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Right Action Buttons */}
                              <div className="flex items-center gap-1.5 self-start md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800 w-full md:w-auto justify-end">
                                {/* Set as Current (Move to #1) */}
                                {!isTop && (
                                  <button
                                    type="button"
                                    onClick={() => setCompetitionAsCurrent(comp.id)}
                                    title="Pin this competition as Current Primary (#1 for teachers)"
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-xs font-bold cursor-pointer transition-colors shadow-sm"
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Set as Current</span>
                                  </button>
                                )}

                                {/* Move Up */}
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveCompetition(comp.id, 'up')}
                                  title="Move Up in order"
                                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>

                                {/* Move Down */}
                                <button
                                  type="button"
                                  disabled={index === competitions.length - 1}
                                  onClick={() => moveCompetition(comp.id, 'down')}
                                  title="Move Down in order"
                                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Competition & Allowed Scores */}
                                <button
                                  type="button"
                                  onClick={() => openEditCompModal(comp)}
                                  title="Edit allowed default scores & competition info"
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-blue-300 text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="hidden sm:inline">Edit Defaults</span>
                                </button>

                                {/* Delete Competition */}
                                <button
                                  type="button"
                                  onClick={() => setCompToDelete(comp)}
                                  title="Delete Competition"
                                  className="p-1.5 rounded-lg bg-neutral-900 hover:bg-red-950/80 border border-neutral-800 hover:border-red-800 text-red-400 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Championship Resets & Archive Tools */}
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4">
                  <div className="pb-3 border-b border-neutral-800">
                    <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-red-400" />
                      <span>Championship Scoring Resets & Data Archive</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Reset scores for a fresh start or export ledger spreadsheets.
                    </p>
                  </div>

                  {/* Reset All Scores to 0 */}
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-red-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>Reset All Competition Scores to 0 (Full Reset)</span>
                      </h4>
                      <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                        Permanently wipes all scoring records in Cloud Firestore. All 4 houses will be set to 0 points across all terms so you can enter actual scores for this school year. Sample data will never reload.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResetAllConfirm(true)}
                      className="px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 border border-red-600 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset All Scores to 0</span>
                    </button>
                  </div>

                  {/* Reset Specific Term to 0 (e.g. Term 1) */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-white">
                        Reset Scores for a Specific Term
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Select a specific school term (e.g. Term 1) to clear its records to 0 points without affecting other terms.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={termToReset}
                        onChange={(e) => setTermToReset(e.target.value as SchoolTerm)}
                        className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="Term 1">Term 1</option>
                        <option value="Term 2">Term 2</option>
                        <option value="Term 3">Term 3</option>
                        <option value="Term 4">Term 4</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowClearTermConfirm(true)}
                        className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Reset {termToReset} to 0</span>
                      </button>
                    </div>
                  </div>

                  {/* Export Official Ledger (CSV) */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Export Official Ledger (CSV)</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Download full spreadsheet archive with timestamps, teachers, and notes before resetting.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={exportLedgerCSV}
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Export CSV Backup</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Modal for Deleting Ledger Event Confirmation */}
      {eventToDelete && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-4 h-4" />
                <h3 className="font-bold text-base text-white">Delete Scoring Entry</h3>
              </div>
              <button
                onClick={() => !isDeletingEvent && setEventToDelete(null)}
                disabled={isDeletingEvent}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Delete this scoring entry from the ledger? The <strong className="text-white">{formatPoints(eventToDelete.points)} points</strong> {eventToDelete.points < 0 ? 'deducted from' : 'awarded to'} <strong className="text-white">{rawHouses[eventToDelete.houseId as HouseId]?.name || eventToDelete.houseId}</strong> will be permanently removed.
              </p>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <div className="font-semibold text-white">{eventToDelete.title}</div>
                <div className="text-neutral-400 text-[11px]">Logged by {eventToDelete.awardedBy} · {eventToDelete.term} · {formatPoints(eventToDelete.points)} pts</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={() => setEventToDelete(null)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={async () => {
                  setIsDeletingEvent(true);
                  try {
                    await deletePointEvent(eventToDelete.id);
                    setEventToDelete(null);
                  } finally {
                    setIsDeletingEvent(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingEvent ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Resetting All Scores to 0 (Full Competition Reset) */}
      {showResetAllConfirm && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-base text-white">Reset All Scores to 0</h3>
              </div>
              <button
                onClick={() => !isResetting && setShowResetAllConfirm(false)}
                disabled={isResetting}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Are you sure you want to completely reset the competition? All existing scoring records across all terms will be <strong className="text-white">permanently deleted</strong> from Cloud Firestore.
              </p>
              <div className="p-3 bg-red-950/30 rounded-xl border border-red-900/40 text-red-300 space-y-1">
                <p className="font-bold text-xs text-red-200">What happens after this reset:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-300/90">
                  <li>All 4 houses will be set to exactly <strong>0 points</strong>.</li>
                  <li>No sample dummy records will ever reload.</li>
                  <li>You will have a completely clean slate to log actual 2026 school scores.</li>
                </ul>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Tip: You can export a CSV spreadsheet backup before resetting if needed.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetAllConfirm(false)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await clearAllPoints();
                    setShowResetAllConfirm(false);
                    setSettingsNotice('Competition successfully reset: All scores are at 0 points with a clean slate for this year.');
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting to 0...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Reset All to 0</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Resetting a Specific Term to 0 (e.g. Term 1) */}
      {showClearTermConfirm && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-amber-400">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-base text-white">Reset {termToReset} Scores to 0</h3>
              </div>
              <button
                onClick={() => !isResetting && setShowClearTermConfirm(false)}
                disabled={isResetting}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Delete all scoring records logged under <strong className="text-white">{termToReset}</strong>? All 4 houses will be set to <strong className="text-white">0 points for {termToReset}</strong>. Scores for other terms will remain untouched.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowClearTermConfirm(false)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  try {
                    await clearTermPoints(termToReset);
                    setShowClearTermConfirm(false);
                    setSettingsNotice(`All scoring records for ${termToReset} have been reset to 0 points.`);
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting {termToReset}...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Reset {termToReset}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding New Competition */}
      {showAddCompModal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Add New Competition</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCompModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {compFormError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs">
                {compFormError}
              </div>
            )}

            <form onSubmit={handleSaveNewCompetition} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Competition Name *
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Senior Swimming Sports or House Haka"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Category *</label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as PointCategory)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                  >
                    <option value="Sports & Athletics">Sports & Athletics</option>
                    <option value="Academic & STEM">Academic & STEM</option>
                    <option value="Kaupapa Māori & Haka">Kaupapa Māori & Haka</option>
                    <option value="Arts & Cultural">Arts & Cultural</option>
                    <option value="Attendance & Merits">Attendance & Merits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Default School Term</label>
                  <select
                    value={compTerm}
                    onChange={(e) => setCompTerm(e.target.value as SchoolTerm)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                    <option value="All Year">All Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Description / Event Rules (Optional)
                </label>
                <textarea
                  rows={2}
                  value={compDescription}
                  onChange={(e) => setCompDescription(e.target.value)}
                  placeholder="e.g. Track finals and field events; relays awarded double"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white"
                />
              </div>

              {/* Allowed Default Scores Matrix Builder */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-neutral-200 font-bold">
                      Allowed Points Defaults *
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      These are the only points options teachers can award for this event.
                    </span>
                  </div>
                </div>

                {/* Score Preset Templates */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('placings')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    1st–4th (100, 75, 50, 25, 10)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('trophy')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Major Trophy (150, 100, 75, 50)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('academic')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Academic (80, 60, 40, 20)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('merits')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Merits (50, 30, 15, 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('penalties')}
                    className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Penalties (-10, -25, -50)
                  </button>
                  <button
                    type="button"
                    onClick={appendPenaltyTiers}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-rose-950/70 border border-rose-800/50 text-rose-300 text-[10px] font-semibold cursor-pointer"
                  >
                    + Append Penalties
                  </button>
                </div>

                {/* Existing Scores List */}
                <div className="space-y-1.5 pt-2">
                  {compAllowedScores.map((score, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded border font-mono font-bold text-xs ${
                            score.points < 0
                              ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                              : 'bg-red-950 text-red-300 border-red-800/60'
                          }`}
                        >
                          {formatPoints(score.points)} pts
                        </span>
                        <span className="text-white text-xs font-medium">
                          {score.label || 'Default Tier'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveScoreTier(sIdx)}
                        className="text-neutral-500 hover:text-red-400 p-1 rounded cursor-pointer"
                        title="Remove score tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Score Tier */}
                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                  <input
                    type="number"
                    min="-1000"
                    max="1000"
                    placeholder="Points (e.g. 50 or -25)"
                    value={newScorePoints}
                    onChange={(e) => setNewScorePoints(e.target.value)}
                    className="w-32 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. 1st Place)"
                    value={newScoreLabel}
                    onChange={(e) => setNewScoreLabel(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddScoreTier}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Student Recipient Roster Policy */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div>
                  <label className="block text-neutral-200 font-bold">
                    Student Recipient Roster Policy
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Specify whether teachers award points across the whole school population or a custom competition squad.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                      compRecipientMode === 'whole_school'
                        ? 'bg-neutral-900 border-red-600 text-white font-bold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addCompRecipientMode"
                      value="whole_school"
                      checked={compRecipientMode === 'whole_school'}
                      onChange={() => setCompRecipientMode('whole_school')}
                      className="accent-red-600"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs">Whole Student Population</span>
                      <span className="text-[10px] text-neutral-400 font-normal">All GBHS students eligible</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                      compRecipientMode === 'custom_roster'
                        ? 'bg-neutral-900 border-red-600 text-white font-bold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addCompRecipientMode"
                      value="custom_roster"
                      checked={compRecipientMode === 'custom_roster'}
                      onChange={() => setCompRecipientMode('custom_roster')}
                      className="accent-red-600"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs">Custom Competition Squad</span>
                      <span className="text-[10px] text-neutral-400 font-normal">Registered finalists / roster ({compCustomStudentIds.length})</span>
                    </div>
                  </label>
                </div>

                {compRecipientMode === 'custom_roster' && (
                  <div className="pt-2 border-t border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-300 font-semibold">
                        Select Registered Squad / Finalists ({compCustomStudentIds.length} selected):
                      </span>
                      {compCustomStudentIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCompCustomStudentIds([])}
                          className="text-[10px] text-red-400 hover:text-red-300 underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={compStudentSearch}
                      onChange={(e) => setCompStudentSearch(e.target.value)}
                      placeholder="Filter students by name or tutor..."
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs"
                    />
                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-neutral-900/40 rounded-lg border border-neutral-800">
                      {(students || [])
                        .filter((s) => {
                          if (!compStudentSearch.trim()) return true;
                          const q = compStudentSearch.toLowerCase();
                          return s.name.toLowerCase().includes(q) || (s.tutorGroup && s.tutorGroup.toLowerCase().includes(q));
                        })
                        .map((s) => {
                          const isSelected = compCustomStudentIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer ${
                                isSelected
                                  ? 'bg-red-950/60 border-red-600 text-white font-semibold'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCompCustomStudent(s.id)}
                                className="accent-red-600 shrink-0"
                              />
                              <span className="truncate flex-1">{s.name}</span>
                              <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                                {s.tutorGroup || `Y${s.yearLevel}`}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingComp}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md"
                >
                  {isSavingComp ? 'Saving...' : 'Create Competition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Editing Competition & Allowed Default Scores */}
      {editingComp && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-base text-white">Edit Competition & Defaults</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingComp(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {compFormError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs">
                {compFormError}
              </div>
            )}

            <form onSubmit={handleSaveEditedCompetition} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Competition Name *
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Category *</label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as PointCategory)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                  >
                    <option value="Sports & Athletics">Sports & Athletics</option>
                    <option value="Academic & STEM">Academic & STEM</option>
                    <option value="Kaupapa Māori & Haka">Kaupapa Māori & Haka</option>
                    <option value="Arts & Cultural">Arts & Cultural</option>
                    <option value="Attendance & Merits">Attendance & Merits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Default School Term</label>
                  <select
                    value={compTerm}
                    onChange={(e) => setCompTerm(e.target.value as SchoolTerm)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                    <option value="All Year">All Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Description / Event Rules
                </label>
                <textarea
                  rows={2}
                  value={compDescription}
                  onChange={(e) => setCompDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white"
                />
              </div>

              {/* Allowed Default Scores Matrix Builder */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-neutral-200 font-bold">
                      Allowed Points Defaults *
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      These are the exact score buttons teachers can choose on their desk.
                    </span>
                  </div>
                </div>

                {/* Score Preset Templates */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('placings')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    1st–4th (100, 75, 50, 25, 10)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('trophy')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Major Trophy (150, 100, 75, 50)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('academic')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Academic (80, 60, 40, 20)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('merits')}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Merits (50, 30, 15, 5)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScorePreset('penalties')}
                    className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold cursor-pointer"
                  >
                    Penalties (-10, -25, -50)
                  </button>
                  <button
                    type="button"
                    onClick={appendPenaltyTiers}
                    className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-rose-950/70 border border-rose-800/50 text-rose-300 text-[10px] font-semibold cursor-pointer"
                  >
                    + Append Penalties
                  </button>
                </div>

                {/* Existing Scores List */}
                <div className="space-y-1.5 pt-2">
                  {compAllowedScores.map((score, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded border font-mono font-bold text-xs ${
                            score.points < 0
                              ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                              : 'bg-red-950 text-red-300 border-red-800/60'
                          }`}
                        >
                          {formatPoints(score.points)} pts
                        </span>
                        <span className="text-white text-xs font-medium">
                          {score.label || 'Default Tier'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveScoreTier(sIdx)}
                        className="text-neutral-500 hover:text-red-400 p-1 rounded cursor-pointer"
                        title="Remove score tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Score Tier */}
                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                  <input
                    type="number"
                    min="-1000"
                    max="1000"
                    placeholder="Points (e.g. 50 or -25)"
                    value={newScorePoints}
                    onChange={(e) => setNewScorePoints(e.target.value)}
                    className="w-32 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. 1st Place)"
                    value={newScoreLabel}
                    onChange={(e) => setNewScoreLabel(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddScoreTier}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Student Recipient Roster Policy */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div>
                  <label className="block text-neutral-200 font-bold">
                    Student Recipient Roster Policy
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Specify whether teachers award points across the whole school population or a custom competition squad.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                      compRecipientMode === 'whole_school'
                        ? 'bg-neutral-900 border-red-600 text-white font-bold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editCompRecipientMode"
                      value="whole_school"
                      checked={compRecipientMode === 'whole_school'}
                      onChange={() => setCompRecipientMode('whole_school')}
                      className="accent-red-600"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs">Whole Student Population</span>
                      <span className="text-[10px] text-neutral-400 font-normal">All GBHS students eligible</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer ${
                      compRecipientMode === 'custom_roster'
                        ? 'bg-neutral-900 border-red-600 text-white font-bold'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editCompRecipientMode"
                      value="custom_roster"
                      checked={compRecipientMode === 'custom_roster'}
                      onChange={() => setCompRecipientMode('custom_roster')}
                      className="accent-red-600"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs">Custom Competition Squad</span>
                      <span className="text-[10px] text-neutral-400 font-normal">Registered finalists / roster ({compCustomStudentIds.length})</span>
                    </div>
                  </label>
                </div>

                {compRecipientMode === 'custom_roster' && (
                  <div className="pt-2 border-t border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-300 font-semibold">
                        Select Registered Squad / Finalists ({compCustomStudentIds.length} selected):
                      </span>
                      {compCustomStudentIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCompCustomStudentIds([])}
                          className="text-[10px] text-red-400 hover:text-red-300 underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={compStudentSearch}
                      onChange={(e) => setCompStudentSearch(e.target.value)}
                      placeholder="Filter students by name or tutor..."
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs"
                    />
                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-neutral-900/40 rounded-lg border border-neutral-800">
                      {(students || [])
                        .filter((s) => {
                          if (!compStudentSearch.trim()) return true;
                          const q = compStudentSearch.toLowerCase();
                          return s.name.toLowerCase().includes(q) || (s.tutorGroup && s.tutorGroup.toLowerCase().includes(q));
                        })
                        .map((s) => {
                          const isSelected = compCustomStudentIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer ${
                                isSelected
                                  ? 'bg-red-950/60 border-red-600 text-white font-semibold'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCompCustomStudent(s.id)}
                                className="accent-red-600 shrink-0"
                              />
                              <span className="truncate flex-1">{s.name}</span>
                              <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                                {s.tutorGroup || `Y${s.yearLevel}`}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingComp(null)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingComp}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md"
                >
                  {isSavingComp ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Confirming Competition Deletion */}
      {compToDelete && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-4 h-4" />
                <h3 className="font-bold text-base text-white">Delete Competition</h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingComp && setCompToDelete(null)}
                disabled={isDeletingComp}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Are you sure you want to delete the competition <strong className="text-white">&quot;{compToDelete.name}&quot;</strong>?
              </p>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <div className="text-neutral-400">Category: <span className="text-neutral-200">{compToDelete.category}</span></div>
                <div className="text-neutral-400">Term: <span className="text-neutral-200">{compToDelete.term}</span></div>
                <div className="text-neutral-400">Allowed Tiers: <span className="text-neutral-200">{compToDelete.allowedScores.map(s => formatPoints(s.points)).join(', ')}</span></div>
              </div>
              <p className="text-neutral-400 text-[11px]">
                Teachers will no longer see this competition on their scoring desk. Previously awarded ledger points will remain intact.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isDeletingComp}
                onClick={() => setCompToDelete(null)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingComp}
                onClick={handleConfirmDeleteCompetition}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingComp ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create / Edit Team or Competition Group */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-base text-white">
                  {editingGroup ? 'Edit Team / Competition Group' : 'Create House Competition Group / Team'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSavingGroup && setShowGroupModal(false)}
                disabled={isSavingGroup}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {groupFormError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs">
                {groupFormError}
              </div>
            )}

            <form onSubmit={handleSaveGroup} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">Group or Team Name *</label>
                <input
                  type="text"
                  required
                  value={groupFormName}
                  onChange={(e) => setGroupFormName(e.target.value)}
                  placeholder="e.g. Tūmatauenga Senior Relay A or Haka Roopu"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Type *</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setGroupFormType('team')}
                      className={`py-1.5 rounded font-semibold cursor-pointer transition-colors ${
                        groupFormType === 'team'
                          ? 'bg-red-700 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupFormType('group')}
                      className={`py-1.5 rounded font-semibold cursor-pointer transition-colors ${
                        groupFormType === 'group'
                          ? 'bg-red-700 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Group
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">School House *</label>
                  <select
                    value={groupFormHouseId}
                    onChange={(e) => {
                      const nextHouse = e.target.value as HouseId;
                      setGroupFormHouseId(nextHouse);
                      setGroupFormStudentIds([]);
                    }}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                  >
                    {(Object.keys(rawHouses) as HouseId[]).map((hid) => (
                      <option key={hid} value={hid}>
                        {rawHouses[hid].name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Link to House Competition (Optional)
                </label>
                <select
                  value={groupFormCompId}
                  onChange={(e) => setGroupFormCompId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                >
                  <option value="">General / Available Across Any Competition</option>
                  {competitions.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} ({comp.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">Notes / Role (Optional)</label>
                <textarea
                  rows={2}
                  value={groupFormDescription}
                  onChange={(e) => setGroupFormDescription(e.target.value)}
                  placeholder="e.g. Term 1 inter-house touch rugby squad"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white"
                />
              </div>

              {/* Group Member Learners Selection */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="block text-neutral-200 font-bold">
                      Group Members ({groupFormStudentIds.length} selected)
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Showing learners in {rawHouses[groupFormHouseId]?.name}.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {groupFormStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setGroupFormStudentIds([])}
                        className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openCreateLearnerModal(groupFormHouseId, false)}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-[10px] font-bold cursor-pointer"
                    >
                      + Add Learner
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={groupMemberSearch}
                  onChange={(e) => setGroupMemberSearch(e.target.value)}
                  placeholder="Filter house learners by name or tutor..."
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs"
                />

                {(() => {
                  const eligibleMembers = (students || []).filter((s) => {
                    if (s.houseId !== groupFormHouseId) return false;
                    if (groupMemberSearch.trim()) {
                      const q = groupMemberSearch.trim().toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        (s.tutorGroup && s.tutorGroup.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  });

                  if (eligibleMembers.length === 0) {
                    return (
                      <div className="p-4 text-center text-neutral-500 bg-neutral-900/40 rounded-lg border border-neutral-800">
                        No learners found for {rawHouses[groupFormHouseId]?.name}.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1 bg-neutral-900/40 rounded-lg border border-neutral-800">
                      {eligibleMembers.map((s) => {
                        const checked = groupFormStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2 p-1.5 rounded border text-[11px] cursor-pointer ${
                              checked
                                ? 'bg-red-950/60 border-red-600 text-white font-semibold'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setGroupFormStudentIds((prev) =>
                                  prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                                )
                              }
                              className="accent-red-600 shrink-0"
                            />
                            <span className="truncate flex-1">{s.name}</span>
                            <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                              {s.tutorGroup || `Y${s.yearLevel}`}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingGroup}
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingGroup}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md"
                >
                  {isSavingGroup
                    ? 'Saving...'
                    : editingGroup
                    ? 'Save Group Changes'
                    : 'Create Team / Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Delete Team / Group */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-4 h-4" />
                <h3 className="font-bold text-base text-white">Delete Team / Group</h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingGroup && setGroupToDelete(null)}
                disabled={isDeletingGroup}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">&quot;{groupToDelete.name}&quot;</strong> from {rawHouses[groupToDelete.houseId]?.name}?
              </p>
              <p className="text-neutral-400 text-[11px]">
                Existing points previously logged for this group in the ledger will stay intact.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isDeletingGroup}
                onClick={() => setGroupToDelete(null)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingGroup}
                onClick={handleConfirmDeleteGroup}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingGroup ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Individual Learner */}
      {showLearnerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  {editingLearner ? 'Edit Learner Profile' : 'Add New Learner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isSavingLearner && setShowLearnerModal(false)}
                disabled={isSavingLearner}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {learnerFormError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs">
                {learnerFormError}
              </div>
            )}

            <form onSubmit={handleSaveLearner} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={learnerFormName}
                  onChange={(e) => setLearnerFormName(e.target.value)}
                  placeholder="e.g. Wiremu Parata"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">School House *</label>
                <select
                  value={learnerFormHouseId}
                  onChange={(e) => setLearnerFormHouseId(e.target.value as HouseId)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                >
                  {(Object.keys(rawHouses) as HouseId[]).map((hid) => (
                    <option key={hid} value={hid}>
                      {rawHouses[hid].name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Year Level *</label>
                  <select
                    value={learnerFormYear}
                    onChange={(e) => setLearnerFormYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                  >
                    {[9, 10, 11, 12, 13].map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-bold mb-1">Tutor Group (Optional)</label>
                  <input
                    type="text"
                    value={learnerFormTutor}
                    onChange={(e) => setLearnerFormTutor(e.target.value)}
                    placeholder="e.g. TU-11A"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingLearner}
                  onClick={() => setShowLearnerModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLearner}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md"
                >
                  {isSavingLearner
                    ? 'Saving...'
                    : editingLearner
                    ? 'Save Changes'
                    : 'Add Learner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Confirm Delete Learner */}
      {learnerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-4 h-4" />
                <h3 className="font-bold text-base text-white">Remove Learner</h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeletingLearner && setLearnerToDelete(null)}
                disabled={isDeletingLearner}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Remove <strong className="text-white">{learnerToDelete.name}</strong> ({rawHouses[learnerToDelete.houseId]?.name}, Year {learnerToDelete.yearLevel}) from the learner directory?
              </p>
              <p className="text-neutral-400 text-[11px]">
                Past points ledger records will remain untouched.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isDeletingLearner}
                onClick={() => setLearnerToDelete(null)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingLearner}
                onClick={handleConfirmDeleteLearner}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingLearner ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Bulk Import Learners */}
      {showBulkLearnersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Bulk Import Learners</h3>
              </div>
              <button
                type="button"
                onClick={() => !isImportingLearners && setShowBulkLearnersModal(false)}
                disabled={isImportingLearners}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bulkLearnersError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs">
                {bulkLearnersError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Default House (when house is omitted on a line)
                </label>
                <select
                  value={bulkLearnersHouseId}
                  onChange={(e) => setBulkLearnersHouseId(e.target.value as HouseId)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white cursor-pointer"
                >
                  {(Object.keys(rawHouses) as HouseId[]).map((hid) => (
                    <option key={hid} value={hid}>
                      {rawHouses[hid].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">
                  Paste Learner List (One per line)
                </label>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Format: <code className="text-neutral-200 font-mono">Full Name, Year, Tutor, House</code> (Year, Tutor, and House are optional). Accepts CSV or spreadsheet tab-separated paste.
                </p>
                <textarea
                  rows={7}
                  value={bulkLearnersText}
                  onChange={(e) => setBulkLearnersText(e.target.value)}
                  placeholder={`Wiremu Parata, 11, TU-11A, Tumatauenga\nRawiri Nikora, 12, TA-12B, Tangaroa\nLiam Henderson, 10, TN-10C`}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isImportingLearners}
                  onClick={() => setShowBulkLearnersModal(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImportingLearners}
                  onClick={handleBulkImportLearners}
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isImportingLearners ? 'Importing...' : 'Import Learners'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 6: Confirm Clear Learner Directory (Non-Destructive Archive) */}
      {showClearLearnersConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Archive className="w-4 h-4" />
                <h3 className="font-bold text-base text-white">Clear Active Learner Directory</h3>
              </div>
              <button
                type="button"
                onClick={() => !isClearingLearners && setShowClearLearnersConfirm(false)}
                disabled={isClearingLearners}
                className="text-neutral-400 hover:text-white text-xs p-1 rounded-lg bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                This will move all <strong className="text-white">{students.length} active learners</strong> out of the active directory so you can upload or add an updated learner list.
              </p>
              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-emerald-200 space-y-1">
                <p className="font-bold text-xs">Safe, Non-Destructive Action:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-200/90">
                  <li>Learner records are <strong>archived, not deleted</strong>, and can be restored anytime.</li>
                  <li>All points allocated to learners and house totals remain <strong>100% intact</strong>.</li>
                  <li>Existing competition teams and groups keep their history.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isClearingLearners}
                onClick={() => setShowClearLearnersConfirm(false)}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingLearners}
                onClick={handleConfirmClearDirectory}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isClearingLearners ? 'Clearing...' : 'Yes, Clear Directory'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
