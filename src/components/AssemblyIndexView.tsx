import React from 'react';
import { Trophy, Sparkles, Volume2, VolumeX, ShieldCheck, UserCheck, ArrowRight, ChevronDown } from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import { SchoolTerm } from '../types';

import gbhsHeaderLogo from '../assets/gbhs_header_logo.png';
import { HouseCrestImage } from './HouseCrestImage';

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
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-between select-none">
      {/* Top Header Strip */}
      <header className="bg-neutral-950/90 border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* School Brand Lockup with Official Logo, Header & Sub Header */}
          <div className="flex items-center gap-3.5">
            <img
              src={gbhsHeaderLogo}
              alt="Gisborne Boys' High School · Toa Hinga Kore, Toa Mate Kore"
              className="h-11 sm:h-12 md:h-13 w-auto object-contain rounded-lg shadow-md border border-red-700/50 shrink-0"
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
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* Term Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as SchoolTerm)}
                aria-label="Filter by School Term"
                className="appearance-none bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-semibold text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 transition-colors cursor-pointer shadow-sm"
              >
                {terms.map((t) => (
                  <option key={t} value={t} className="bg-neutral-900 text-neutral-100 py-1">
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Confetti Quick Cheer */}
            <button
              onClick={() => triggerConfetti()}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
              title="Launch Confetti"
              aria-label="Celebrate"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleAudio}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
              title={audioEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              aria-label="Toggle Sound"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            </button>

            {/* Teacher Login / Portal Button */}
            {teacherUser ? (
              <button
                onClick={() => setCurrentView('teacher-portal')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm border border-red-500/50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Teacher Portal</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('teacher-login')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold transition-all shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                <span>Teacher Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Assembly Arena: Simplistic Stadium Pillars with Embedded Logos */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 sm:py-10 relative overflow-hidden">
        {/* Ambient glow matching current leader */}
        <div
          className="absolute top-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 pointer-events-none transition-all duration-1000"
          style={{ backgroundColor: currentLeader?.primaryColor || '#dc2626' }}
        />

        {/* Lead Status Tag */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-semibold text-neutral-300 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: currentLeader?.primaryColor || '#dc2626' }} />
            {currentLeader && currentLeader.currentTotal > 0 ? (
              <span>
                <strong className="text-white">{currentLeader?.name}</strong> leads the championship by{' '}
                <span className="text-amber-400 font-mono font-bold">
                  +{houses[1] ? (currentLeader.currentTotal - houses[1].currentTotal).toLocaleString() : 0} pts
                </span>
              </span>
            ) : (
              <span>
                <strong className="text-white">2026 House Championship Ready</strong> · All 4 houses currently at{' '}
                <span className="text-emerald-400 font-mono font-bold">0 pts</span>
              </span>
            )}
          </div>
        </div>

        {/* 4 House Stadium Columns */}
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-end h-[60vh] sm:h-[66vh] max-h-[660px]">
          {houses.map((house) => {
            // Scale bar height between 32% (so responsive full-width logo with 10px padding always fits at top) and 100%
            const percentage = maxPoints > 0 ? Math.max((house.currentTotal / maxPoints) * 100, 32) : 32;
            const isFirst = house.rank === 1;

            return (
              <div key={house.id} className="flex flex-col items-center h-full justify-end group">
                {/* Live Score & Rank above the bar pillar */}
                <div className="mb-3 flex flex-col items-center text-center transform transition-transform duration-300 group-hover:-translate-y-1">
                  {/* Rank Badge */}
                  {house.currentTotal > 0 && isFirst ? (
                    <div className="mb-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-300" />
                      <span>1ST PLACE</span>
                    </div>
                  ) : house.currentTotal > 0 ? (
                    <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-bold font-mono">
                      Rank #{house.rank}
                    </div>
                  ) : (
                    <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-[11px] font-semibold font-mono">
                      Ready · 0 pts
                    </div>
                  )}

                  {/* Points Total */}
                  <div className="mt-1">
                    <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-mono tabular-nums block tracking-tight">
                      {house.currentTotal.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-400 font-bold block mt-0.5">
                      Points
                    </span>
                  </div>
                </div>

                {/* Vertical Stadium Pillar Track */}
                <div className="w-full max-w-[190px] sm:max-w-[215px] lg:max-w-[235px] bg-neutral-950/80 rounded-t-2xl border-2 border-neutral-800/80 p-1 flex flex-col justify-end h-64 sm:h-80 lg:h-96 shadow-2xl overflow-hidden">
                  {/* Animated Rising Bar Pillar */}
                  <div
                    className={`w-full rounded-xl bg-gradient-to-t ${house.barGradient} transition-all duration-1000 ease-out relative flex flex-col items-center justify-start overflow-hidden pt-1`}
                    style={{
                      height: `${percentage}%`,
                      boxShadow: `0 0 28px ${house.primaryColor}65`,
                    }}
                  >
                    {/* Top glass highlight bar */}
                    <div className="absolute inset-x-0 top-0 h-1.5 sm:h-2 bg-white/40" />

                    {/* EMBEDDED HOUSE LOGO — Responsive width to the full width of the bar with 10px padding */}
                    <div className="w-full p-[10px] relative z-10 flex items-center justify-center shrink-0">
                      <HouseCrestImage
                        houseId={house.id}
                        houseName={house.name}
                        src={house.crest}
                        className="w-full h-auto object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </div>

                {/* Base Podium Banner */}
                <div
                  className="w-full max-w-[190px] sm:max-w-[215px] lg:max-w-[235px] py-3 text-center border-t-4 bg-neutral-950 rounded-b-xl shadow-lg"
                  style={{ borderTopColor: house.borderStroke }}
                >
                  <h2 className="font-extrabold text-sm sm:text-base text-white font-display truncate px-1">
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
