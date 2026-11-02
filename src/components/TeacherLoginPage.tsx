import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle2, UserCheck, Lock, ExternalLink, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { useHousePoints } from '../context/HousePointsContext';
import { SPREADSHEET_ID, SHEET_TAB, SHEET_URL } from '../services/sheetsAuth';

export const TeacherLoginPage: React.FC = () => {
  const {
    setCurrentView,
    signInWithGoogle,
    manualTeacherVerify,
    authorizedTeachers,
    isSyncingSheet,
    sheetSyncError,
  } = useHousePoints();

  const [inputEmail, setInputEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Trigger Google Sign-In with Sheets scope
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication denied.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick or manual check against the TEACHERS_26 sheet roster
  const handleVerifyEmail = (emailToVerify: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      const res = manualTeacherVerify(emailToVerify);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication denied.');
      }
    }, 350);
  };

  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) {
      setErrorMessage('Please enter your school Google email address.');
      return;
    }
    handleVerifyEmail(inputEmail.trim());
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col justify-center p-4 sm:p-8">
      {/* Top Bar with Back Link */}
      <div className="max-w-md mx-auto w-full mb-4">
        <button
          onClick={() => setCurrentView('assembly')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Assembly Leaderboard</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto">
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Top School Red Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-700 via-red-600 to-red-800" />

          {/* School Shield Icon & Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-700 via-red-800 to-black flex items-center justify-center border border-red-600/50 shadow-lg shadow-red-950/60 mb-3.5">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight font-display">
              Teacher Scoring Login
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Authorized via GBHS Google Sheet <span className="font-mono text-neutral-200">TEACHERS_26</span>.
            </p>
          </div>

          {/* Google Sheet Source Banner */}
          <div className="mb-5 p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-neutral-200 block truncate">
                  Sheet: {SHEET_TAB}
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

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="mt-0.5 text-red-300/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {sheetSyncError && (
            <div className="mb-4 text-[11px] text-amber-400/90 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40">
              Note: {sheetSyncError}. Using synced teacher roster.
            </div>
          )}

          {/* Primary Action: Sign in with Google (Firebase popup + Sheet check) */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading || isSyncingSheet}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-3 group"
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
              <span>Sign In with Google</span>
            </button>

            {/* Quick-test verified teacher accounts from TEACHERS_26 */}
            <div className="pt-2">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Or select verified staff on TEACHERS_26
              </span>
              <div className="space-y-2">
                {authorizedTeachers.slice(0, 3).map((teacher) => (
                  <button
                    key={teacher.email}
                    onClick={() => handleVerifyEmail(teacher.email)}
                    disabled={isLoading}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-left transition-colors"
                  >
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">
                        {teacher.name}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono truncate block">
                        {teacher.email}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-900 text-emerald-400 border border-neutral-800 shrink-0">
                      On Sheet
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Google Email Test Input */}
            <div className="pt-2 border-t border-neutral-800">
              <form onSubmit={handleCustomFormSubmit} className="space-y-2">
                <label className="block text-[11px] text-neutral-400">
                  Verify another email against TEACHERS_26:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="email@gisboyshigh.net"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    Check
                  </button>
                </div>
              </form>
            </div>

            {/* Security Explanation */}
            <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Strict Google Sheet Authorization</span>
              </div>
              <p className="text-neutral-400 leading-normal pl-5">
                Only users whose email appears in the <code className="text-neutral-200">TEACHERS_26</code> tab of the official school spreadsheet can log in to award house points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
