import React from 'react';
import { Trophy, Sparkles, Volume2, VolumeX, ShieldCheck, UserCheck, ArrowRight, ChevronDown } from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import { SchoolTerm } from '../types';

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
          {/* School Brand Lockup */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-black flex items-center justify-center border border-red-600/50 shadow-md shadow-red-950/50 shrink-0">
              <span className="font-extrabold text-sm tracking-wider text-white">GBHS</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white font-display">
                  Gisborne Boys' High School
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800/60 font-mono">
                  Live Assembly Display
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Te Kura Taitama o Tūranga <span className="text-neutral-600">·</span> Toa Takitini
              </p>
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
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: currentLeader?.primaryColor }} />
            <span>
              <strong className="text-white">{currentLeader?.name}</strong> leads the championship by{' '}
              <span className="text-amber-400 font-mono font-bold">
                +{houses[1] ? (currentLeader.currentTotal - houses[1].currentTotal).toLocaleString() : 0} pts
              </span>
            </span>
          </div>
        </div>

        {/* 4 House Stadium Columns */}
        <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-end h-[60vh] sm:h-[66vh] max-h-[660px]">
          {houses.map((house) => {
            // Scale bar height between 26% (so embedded logo always fits at top) and 100%
            const percentage = maxPoints > 0 ? Math.max((house.currentTotal / maxPoints) * 100, 26) : 26;
            const isFirst = house.rank === 1;

            return (
              <div key={house.id} className="flex flex-col items-center h-full justify-end group">
                {/* Live Score & Rank above the bar pillar */}
                <div className="mb-3 flex flex-col items-center text-center transform transition-transform duration-300 group-hover:-translate-y-1">
                  {/* Rank Badge */}
                  {isFirst ? (
                    <div className="mb-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <Trophy className="w-3.5 h-3.5 text-amber-300" />
                      <span>1ST PLACE</span>
                    </div>
                  ) : (
                    <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[11px] font-bold font-mono">
                      Rank #{house.rank}
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
                <div className="w-full max-w-[170px] bg-neutral-950/80 rounded-t-2xl border-2 border-neutral-800/80 p-1 flex flex-col justify-end h-64 sm:h-80 lg:h-96 shadow-2xl overflow-hidden">
                  {/* Animated Rising Bar Pillar */}
                  <div
                    className={`w-full rounded-xl bg-gradient-to-t ${house.barGradient} transition-all duration-1000 ease-out relative flex flex-col items-center justify-start overflow-hidden pt-2 sm:pt-3 px-1`}
                    style={{
                      height: `${percentage}%`,
                      boxShadow: `0 0 28px ${house.primaryColor}65`,
                    }}
                  >
                    {/* Top glass highlight bar */}
                    <div className="absolute inset-x-0 top-0 h-1.5 sm:h-2 bg-white/40" />

                    {/* EMBEDDED HOUSE LOGO — Aligned directly with the TOP of each bar without background */}
                    <div className="w-16 h-16 sm:w-22 sm:h-22 lg:w-26 lg:h-26 shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                      <img
                        src={house.crest}
                        alt={house.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.65)] select-none pointer-events-none"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>

                {/* Base Podium Banner */}
                <div
                  className="w-full max-w-[170px] py-3 text-center border-t-4 bg-neutral-950 rounded-b-xl shadow-lg"
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
