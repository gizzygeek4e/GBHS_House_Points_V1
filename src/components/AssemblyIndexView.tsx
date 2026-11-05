import React from 'react';
import { Trophy, Sparkles, Volume2, VolumeX, ShieldCheck, UserCheck, ArrowRight, ChevronDown } from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import { SchoolTerm } from '../types';

import gbhsHeaderLogo from '../assets/gbhs_header_logo.png';
import { HouseCrestImage } from './HouseCrestImage';
import { PWAInstallButton } from './PWAInstallButton';

export const AssemblyIndexView: React.FC = () => {
  const {
    houses,
    selectedTerm,
    setSelectedTerm,
    triggerConfetti,
    audioEnabled,
    toggleAudio,
    teacherUser,
    setCurrentView,
  } = useHousePoints();

  const terms: SchoolTerm[] = ['All Year', 'Term 1', 'Term 2', 'Term 3', 'Term 4'];
  const maxPoints = Math.max(...houses.map((h) => h.currentTotal), 100);
  const currentLeader = houses[0];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#07090e] text-neutral-100 flex flex-col justify-between select-none">
      {/* Top Header Strip - Mobile Optimized Single-Line Flow */}
      <header className="bg-neutral-950/90 border-b border-neutral-800/80 px-2.5 xs:px-4 sm:px-8 py-2 xs:py-2.5 sm:py-3.5 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* School Brand Lockup with Official Logo, Header & Sub Header */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <img
              src={gbhsHeaderLogo}
              alt="Gisborne Boys' High School · Toa Hinga Kore, Toa Mate Kore"
              className="h-8 xs:h-9 sm:h-11 md:h-12 w-auto object-contain rounded-md shadow-sm border border-red-700/50 shrink-0"
            />
            <div className="hidden lg:flex flex-col justify-center border-l border-neutral-800 pl-3">
              <span className="font-extrabold text-xs uppercase tracking-wider text-white font-display">
                House Championship
              </span>
              <span className="text-[10px] text-red-400 font-mono font-bold">
                Live Assembly Display
              </span>
            </div>
          </div>

          {/* Controls: Term Selector & Teacher Portal Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Term Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as SchoolTerm)}
                aria-label="Filter by School Term"
                className="appearance-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-semibold text-[11px] sm:text-xs rounded-lg pl-2.5 pr-7 sm:pl-3 sm:pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors cursor-pointer shadow-sm"
              >
                {terms.map((t) => (
                  <option key={t} value={t} className="bg-neutral-900 text-neutral-100 py-1">
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Confetti Quick Cheer */}
            <button
              onClick={() => triggerConfetti()}
              className="p-1.5 sm:p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
              title="Launch Confetti"
              aria-label="Celebrate"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleAudio}
              className="p-1.5 sm:p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors shrink-0 cursor-pointer"
              title={audioEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              aria-label="Toggle Sound"
            >
              {audioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
              )}
            </button>

            {/* PWA In-App Mobile Install Button */}
            <PWAInstallButton variant="compact" />

            {/* Teacher Login / Portal Button */}
            {teacherUser ? (
              <button
                onClick={() => setCurrentView('teacher-portal')}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm border border-red-500/50 shrink-0 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Teacher Portal</span>
                <span className="xs:hidden">Portal</span>
                <ArrowRight className="w-3 h-3 ml-0.5 hidden xs:inline" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('teacher-login')}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-[11px] sm:text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="hidden xs:inline">Teacher Login</span>
                <span className="xs:hidden">Staff</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Assembly Arena: 4 House Stadium Pillars Side-by-Side in One Row */}
      <main className="flex-1 flex flex-col items-center justify-center px-1.5 xs:px-3 sm:px-6 lg:px-8 py-2 xs:py-3 sm:py-6 lg:py-8 relative overflow-x-hidden">
        {/* Ambient glow matching current leader */}
        <div
          className="absolute top-1/4 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] rounded-full blur-[80px] sm:blur-[120px] opacity-15 pointer-events-none transition-all duration-1000"
          style={{ backgroundColor: currentLeader?.primaryColor || '#dc2626' }}
        />

        {/* Lead Status Tag */}
        <div className="mb-2 xs:mb-3 sm:mb-6 text-center z-10 w-full px-2">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] sm:text-xs font-semibold text-neutral-300 shadow-md max-w-full truncate">
            <span
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm shrink-0"
              style={{ backgroundColor: currentLeader?.primaryColor || '#dc2626' }}
            />
            {currentLeader && currentLeader.currentTotal > 0 ? (
              <span className="truncate">
                <strong className="text-white">{currentLeader?.name}</strong> leads by{' '}
                <span className="text-amber-400 font-mono font-bold">
                  +{houses[1] ? (currentLeader.currentTotal - houses[1].currentTotal).toLocaleString() : 0} pts
                </span>
              </span>
            ) : (
              <span className="truncate">
                <strong className="text-white">2026 House Championship Ready</strong> · All 4 houses at{' '}
                <span className="text-emerald-400 font-mono font-bold">0 pts</span>
              </span>
            )}
          </div>
        </div>

        {/* 4 House Stadium Columns — FIXED IN ONE SINGLE ROW ACROSS ALL DEVICES */}
        <div className="w-full max-w-6xl grid grid-cols-4 gap-1.5 xs:gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-end h-[56vh] xs:h-[60vh] sm:h-[64vh] md:h-[68vh] max-h-[640px]">
          {houses.map((house) => {
            // Scale bar height between 30% (so responsive full-width logo with padding always fits at top) and 100%
            const percentage = maxPoints > 0 ? Math.max((house.currentTotal / maxPoints) * 100, 30) : 30;
            const isFirst = house.rank === 1;

            return (
              <div key={house.id} className="flex flex-col items-center h-full justify-end group min-w-0">
                {/* Live Score & Rank above the bar pillar */}
                <div className="mb-1.5 xs:mb-2 sm:mb-3 flex flex-col items-center text-center transform transition-transform duration-300 group-hover:-translate-y-1 w-full px-0.5">
                  {/* Rank Badge */}
                  {house.currentTotal > 0 && isFirst ? (
                    <div className="mb-1 px-1.5 xs:px-2 sm:px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[9px] xs:text-[10px] sm:text-xs font-black flex items-center justify-center gap-1 shadow-sm shrink-0">
                      <Trophy className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
                      <span className="hidden xs:inline">1ST PLACE</span>
                      <span className="xs:hidden">1ST</span>
                    </div>
                  ) : house.currentTotal > 0 ? (
                    <div className="mb-1 px-1.5 xs:px-2 sm:px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[9px] xs:text-[10px] sm:text-[11px] font-bold font-mono shrink-0">
                      <span className="hidden xs:inline">Rank #{house.rank}</span>
                      <span className="xs:hidden">#{house.rank}</span>
                    </div>
                  ) : (
                    <div className="mb-1 px-1.5 xs:px-2 py-0.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-[9px] xs:text-[10px] sm:text-[11px] font-semibold font-mono shrink-0">
                      <span className="hidden sm:inline">Ready · 0 pts</span>
                      <span className="sm:hidden">0 pts</span>
                    </div>
                  )}

                  {/* Points Total */}
                  <div className="mt-0.5">
                    <span className="text-base xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white font-mono tabular-nums block tracking-tight leading-none">
                      {house.currentTotal.toLocaleString()}
                    </span>
                    <span className="text-[7px] xs:text-[8px] sm:text-[10px] md:text-xs uppercase tracking-wider text-neutral-400 font-bold block mt-0.5">
                      Points
                    </span>
                  </div>
                </div>

                {/* Vertical Stadium Pillar Track */}
                <div className="w-full max-w-[95px] xs:max-w-[125px] sm:max-w-[190px] md:max-w-[215px] lg:max-w-[235px] bg-neutral-950/80 rounded-t-xl sm:rounded-t-2xl border sm:border-2 border-neutral-800/80 p-0.5 sm:p-1 flex flex-col justify-end h-48 xs:h-56 sm:h-72 md:h-84 lg:h-96 shadow-2xl overflow-hidden">
                  {/* Animated Rising Bar Pillar */}
                  <div
                    className={`w-full rounded-lg sm:rounded-xl bg-gradient-to-t ${house.barGradient} transition-all duration-1000 ease-out relative flex flex-col items-center justify-start overflow-hidden pt-0.5 sm:pt-1`}
                    style={{
                      height: `${percentage}%`,
                      boxShadow: `0 0 20px ${house.primaryColor}55`,
                    }}
                  >
                    {/* Top glass highlight bar */}
                    <div className="absolute inset-x-0 top-0 h-1 sm:h-2 bg-white/40" />

                    {/* EMBEDDED HOUSE LOGO — Responsive width to full width with 10px padding on desktop, 6px-8px on mobile */}
                    <div className="w-full p-1.5 xs:p-2 sm:p-[10px] relative z-10 flex items-center justify-center shrink-0">
                      <HouseCrestImage
                        houseId={house.id}
                        houseName={house.name}
                        src={house.crest}
                        className="w-full h-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* Base Podium Banner */}
                <div
                  className="w-full max-w-[95px] xs:max-w-[125px] sm:max-w-[190px] md:max-w-[215px] lg:max-w-[235px] py-1.5 xs:py-2 sm:py-3 text-center border-t-2 sm:border-t-4 bg-neutral-950 rounded-b-lg sm:rounded-b-xl shadow-lg px-0.5"
                  style={{ borderTopColor: house.borderStroke }}
                >
                  <h2 className="font-extrabold text-[10px] xs:text-xs sm:text-sm md:text-base text-white font-display truncate">
                    {house.name}
                  </h2>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
