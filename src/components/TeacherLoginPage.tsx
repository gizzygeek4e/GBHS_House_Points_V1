import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  KeyRound,
  Info,
  Globe,
  UserCheck,
} from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import { SPREADSHEET_ID, SHEET_TAB, SHEET_URL } from '../services/sheetsAuth';

import gbhsHeaderLogo from '../assets/gbhs_header_logo.png';

export const TeacherLoginPage: React.FC = () => {
  const {
    setCurrentView,
    signInWithGoogle,
    isSyncingSheet,
    sheetSyncError,
    authorizedTeachers,
  } = useHousePoints();

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Trigger Genuine Google Sign-In
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication denied.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-center p-4 sm:p-8">
      {/* Top Bar with Back Link */}
      <div className="max-w-md mx-auto w-full mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentView('assembly')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Assembly Leaderboard</span>
        </button>

        <button
          onClick={() => setShowDiagnostics((prev) => !prev)}
          className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showDiagnostics ? 'Hide Info' : 'Diagnostics'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Top School Red Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-red-800" />

          {/* Official School Header & Logo */}
          <div className="text-center mb-6">
            <img
              src={gbhsHeaderLogo}
              alt="Gisborne Boys' High School · Toa Hinga Kore, Toa Mate Kore"
              className="h-16 w-auto mx-auto object-contain rounded-xl shadow-lg border border-red-700/50 mb-3"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-xs font-bold text-red-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Teacher Scoring Portal</span>
            </div>
          </div>

          {/* Google Sheet Source Banner */}
          <div className="mb-5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-neutral-200 block truncate">
                  Sheet: {SHEET_TAB} (Column C)
                </span>
                <span className="text-[11px] text-neutral-500 font-mono truncate block">
                  ID: {SPREADSHEET_ID.substring(0, 16)}...
                </span>
              </div>
            </div>
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors shrink-0"
              title="Open Google Sheet in new tab"
            >
              <span>View Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Error Message Callout */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold">Sign-In Notice</p>
                <p className="text-red-200/90 leading-relaxed text-[11px]">{errorMessage}</p>
              </div>
            </div>
          )}

          {sheetSyncError && (
            <div className="mb-4 text-[11px] text-amber-400/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40">
              Note: {sheetSyncError}. Using cached authorized teacher roster.
            </div>
          )}

          {/* Diagnostics Accordion */}
          {showDiagnostics && (
            <div className="mb-5 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2 text-neutral-400">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Environment & Roster Info</span>
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                <p>Host: <span className="text-neutral-200">{currentHost}</span></p>
                <p>SuperAdmin: <span className="text-emerald-300">hermanf@gisboyshigh.net</span></p>
                <p>Known Teachers: <span className="text-neutral-200">{authorizedTeachers.length} accounts</span></p>
                <p>Sheet Tab: <span className="text-neutral-200">{SHEET_TAB}</span></p>
              </div>
            </div>
          )}

          {/* Primary Action: Sign in with Google */}
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-800/90 space-y-1.5 text-xs text-neutral-300">
              <div className="flex items-center gap-2 text-white font-semibold">
                <KeyRound className="w-4 h-4 text-red-500" />
                <span>Google Account Verification</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Sign in with your school Google account (<strong className="text-neutral-200">@gisboyshigh.net</strong>). Access is granted to verified accounts listed in <strong className="text-neutral-200">Column C</strong> of the <span className="font-mono text-neutral-200">TEACHERS_26</span> sheet.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading || isSyncingSheet}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-900 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-3 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading || isSyncingSheet ? (
                <RefreshCw className="w-4 h-4 animate-spin text-neutral-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Connecting to Google...' : 'Sign In with Google Account'}</span>
            </button>

            {/* Note for Herman and Dean Accounts */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Dean of Houses: Herman F.</span>
              </div>
              <p className="text-[10.5px] leading-normal text-neutral-400 pl-5">
                Staff account <code className="text-neutral-200">hermanf@gisboyshigh.net</code> is designated with administrative house scoring privileges.
              </p>
            </div>

            {/* Security Explanation */}
            <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Strict Column C Authorization</span>
              </div>
              <p className="text-neutral-400 leading-normal pl-5">
                Only authenticated Google users whose email matches an entry in Column C of <code className="text-neutral-200">TEACHERS_26</code> can record points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
