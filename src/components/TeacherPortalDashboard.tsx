import React, { useState } from 'react';
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
} from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import { HouseId, PointCategory, SchoolTerm, TeacherAccount, PointEvent } from '../types';
import { parseTeacherCsv } from '../services/sheetsAuth';
import gbhsHeaderLogo from '../assets/gbhs_header_logo.png';
import gbhsCrest from '../assets/gbhs_crest.png';
import { HouseCrestImage } from './HouseCrestImage';
import { PWAInstallButton } from './PWAInstallButton';

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
  } = useHousePoints();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'award' | 'ledger' | 'houses' | 'teachers' | 'settings'>('award');

  // Award Points Form State
  const [selectedHouse, setSelectedHouse] = useState<HouseId>('tumatauenga');
  const [pointsValue, setPointsValue] = useState<number>(50);
  const [customPoints, setCustomPoints] = useState<string>('50');
  const [eventTitle, setEventTitle] = useState('');
  const [category, setCategory] = useState<PointCategory>('Sports & Athletics');
  const [term, setTerm] = useState<'Term 1' | 'Term 2' | 'Term 3' | 'Term 4'>('Term 1');
  const [notes, setNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'single' | 'paste'>('single');
  const [rosterNotice, setRosterNotice] = useState<string | null>(null);
  const [addTeacherError, setAddTeacherError] = useState<string | null>(null);

  // Edit Teacher Modal State
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');

  // Delete Teacher Modal State (In-app modal avoiding browser window.confirm blocks)
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

  // SuperAdmin permission check (Herman F. or account flagged as isSuperAdmin)
  const isSuperAdmin =
    teacherUser?.email?.toLowerCase().trim() === 'hermanf@gisboyshigh.net' ||
    !!teacherUser?.isSuperAdmin;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const quickEventTitles = [
    'Inter-House Athletics 100m Sprint',
    'Inter-House Swimming 50m Freestyle',
    'Inter-House Haka Competition Award',
    'Cross Country Senior Team Points',
    'Academic Quiz & Science Bowl',
    'Weekly Tutor Attendance & Merits',
    'House Spirit & Tug-of-War Trophy',
    'Debating & Public Speaking Round',
  ];

  const handlePointPreset = (val: number) => {
    setPointsValue(val);
    setCustomPoints(val.toString());
  };

  const handleCustomPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPoints(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) setPointsValue(parsed);
  };

  const handleSubmitPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!eventTitle.trim()) {
      alert('Please enter an event or activity description.');
      return;
    }
    if (pointsValue <= 0) {
      alert('Points must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPoints({
        houseId: selectedHouse,
        points: pointsValue,
        title: eventTitle.trim(),
        category,
        term,
        awardedBy: teacherUser?.name || 'GBHS Staff',
        notes: notes.trim() || undefined,
      });

      setSubmitSuccess(true);
      setEventTitle('');
      setNotes('');

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error('Failed to award points:', err);
      setSubmitError(err?.message || 'Failed to sync score to Cloud Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered ledger events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.awardedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.notes && ev.notes.toLowerCase().includes(searchQuery.toLowerCase()));
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
                src={gbhsHeaderLogo}
                alt="Gisborne Boys' High School · Toa Hinga Kore, Toa Mate Kore"
                className="h-8 xs:h-9 sm:h-11 w-auto object-contain rounded-md shadow border border-red-700/50 shrink-0"
              />
              <span className="hidden xl:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/60 font-mono">
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

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-red-700 text-white shadow-md shadow-red-950/40 border border-red-600'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Competition Controls</span>
          </button>
        </div>

        {/* TAB 1: AWARD POINTS DESK */}
        {activeTab === 'award' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="mb-6 pb-4 border-b border-neutral-800">
                <h2 className="text-xl font-bold text-white font-display">
                  Award House Competition Points
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Points awarded here update the live Assembly Display instantly across all school screens.
                </p>
              </div>

              {submitSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-3 animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold">Points Successfully Logged!</p>
                    <p className="text-emerald-300/90 mt-0.5">
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
                {/* 1. House Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                    1. Recipient School House
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(Object.keys(rawHouses) as HouseId[]).map((id) => {
                      const house = rawHouses[id];
                      const isSelected = selectedHouse === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setSelectedHouse(id)}
                          className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
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

                {/* 2. Points Amount */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    2. Points Amount
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {[10, 25, 50, 75, 100, 150].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePointPreset(val)}
                        className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border transition-colors ${
                          pointsValue === val
                            ? 'bg-red-700 text-white border-red-500'
                            : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Custom points:</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={customPoints}
                      onChange={handleCustomPointsChange}
                      className="w-28 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-red-600"
                    />
                    <span className="text-xs text-neutral-400">points</span>
                  </div>
                </div>

                {/* 3. Category & Term */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Competition Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PointCategory)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
                    >
                      <option value="Sports & Athletics">Sports & Athletics</option>
                      <option value="Academic & STEM">Academic & STEM</option>
                      <option value="Kaupapa Māori & Haka">Kaupapa Māori & Haka</option>
                      <option value="Arts & Cultural">Arts & Cultural</option>
                      <option value="Attendance & Merits">Attendance & Merits</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      School Term
                    </label>
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-600"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                      <option value="Term 4">Term 4</option>
                    </select>
                  </div>
                </div>

                {/* 4. Event Title & Quick Chips */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Event / Achievement Reason
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                    placeholder="e.g. Senior 4x100m Athletics Relay (1st Place)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickEventTitles.map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setEventTitle(title)}
                        className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-colors"
                      >
                        + {title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Notes */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1">
                    Additional Notes / Details (Optional)
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
                  className="w-full py-3.5 px-4 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Syncing Score to Cloud Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>
                        Award +{pointsValue} Points to {rawHouses[selectedHouse]?.name}
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
                          className="px-3 py-1 rounded-lg border font-mono font-bold text-sm"
                          style={{
                            backgroundColor: `${house?.primaryColor}15`,
                            color: house?.borderStroke,
                            borderColor: `${house?.borderStroke}50`,
                          }}
                        >
                          +{ev.points} pts
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
                            <span className="text-neutral-200 truncate pr-2">{e.title}</span>
                            <span className="font-mono font-bold text-amber-400 shrink-0">
                              +{e.points} pts
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
                          {/* Modify / Edit Button */}
                          <button
                            onClick={() => {
                              setEditingTeacher(t);
                              setEditName(t.name);
                              setEditRole(t.role);
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
                          isSuperAdmin: newTeacherEmail.trim().toLowerCase() === 'hermanf@gisboyshigh.net',
                        });
                        setRosterNotice(`Added ${newTeacherName.trim() || newTeacherEmail.trim()} to the Cloud Firestore database.`);
                        setNewTeacherName('');
                        setNewTeacherEmail('');
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

                      <div className="pt-2 flex justify-end gap-2">
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
                        await editAuthorizedTeacher(editingTeacher.email, {
                          name: editName.trim(),
                          role: editRole.trim() || 'GBHS Staff',
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
          </div>
        )}

        {/* TAB 5: COMPETITION CONTROLS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 sm:p-8">
              <div className="mb-6 pb-4 border-b border-neutral-800">
                <h2 className="text-xl font-bold text-white font-display">
                  Competition Administration & Controls
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Manage school competition datasets, terms, and fresh starts.
                </p>
              </div>

              {/* Mobile App PWA Install Card */}
              <div className="mb-6">
                <PWAInstallButton variant="card" />
              </div>

              {settingsNotice && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center justify-between">
                  <span>{settingsNotice}</span>
                  <button
                    onClick={() => setSettingsNotice(null)}
                    className="text-emerald-400 hover:text-white text-xs ml-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {!isSuperAdmin ? (
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                      <ShieldCheck className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-base font-bold text-white">Administrator Restricted Area</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                      Competition resets and scoring wipe controls are restricted to the Super Administrator (<span className="text-neutral-200 font-mono">hermanf@gisboyshigh.net</span>).
                    </p>
                  </div>

                  {/* Export Official Ledger (CSV) for staff record */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Export Official Ledger (CSV)</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Download spreadsheet archive with full timestamps, teachers, and notes.
                      </p>
                    </div>
                    <button
                      onClick={exportLedgerCSV}
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Export CSV Archive</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                      onClick={exportLedgerCSV}
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Export CSV Backup</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                Delete this scoring entry from the ledger? The <strong className="text-white">{eventToDelete.points} points</strong> awarded to <strong className="text-white">{rawHouses[eventToDelete.houseId as HouseId]?.name || eventToDelete.houseId}</strong> will be permanently removed.
              </p>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <div className="font-semibold text-white">{eventToDelete.title}</div>
                <div className="text-neutral-400 text-[11px]">Logged by {eventToDelete.awardedBy} · {eventToDelete.term} · +{eventToDelete.points} pts</div>
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
    </div>
  );
};
