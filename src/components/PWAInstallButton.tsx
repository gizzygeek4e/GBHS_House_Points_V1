import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'prominent' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInAppBrowser, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running inside installed standalone PWA, suppress button unless in card mode
  if (isInstalled && variant !== 'card') {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setJustInstalled(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  if (isInstalled || justInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-emerald-200">App Installed on Device</div>
            <div className="text-neutral-400 mt-0.5">Running in standalone full-screen mode.</div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 hover:border-neutral-600 text-[11px] sm:text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${className}`}
          title="Install Gisborne Boys' High School House app to your phone"
          aria-label="Install App on Phone"
        >
          <Smartphone className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="hidden xs:inline">Install App</span>
          <span className="xs:hidden">Install</span>
        </button>
      )}

      {variant === 'prominent' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white text-xs font-bold transition-all shadow-lg hover:shadow-red-900/30 border border-red-500/40 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install GBHS Houses on Phone</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-red-500 shrink-0" />
              <h4 className="font-bold text-sm text-white">Install Mobile App on Phone</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-lg">
              Add the official GBHS House Championship icon to your phone&apos;s home screen. Launches instantly in full-screen mode without browser address bars.
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 border border-red-500/50 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install on Device</span>
          </button>
        </div>
      )}

      {/* Guided Installation Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800/80 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">How to Install on Your Phone</h3>
                  <p className="text-[11px] text-neutral-400">Quick 10-second setup</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Why did it say "not allowed"? Diagnostic Banner */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Why did your phone say &quot;Not Allowed&quot;?</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                If you opened this link from inside an email (Gmail), chat app (WhatsApp, Messenger), or preview iframe, your phone blocks installation inside that temporary app window.
              </p>
              <p className="text-[11px] text-amber-300 font-semibold">
                To fix it: Tap the menu (<strong>⋮</strong> or <strong>Share</strong>) and choose <span className="underline">&quot;Open in Chrome&quot;</span> or <span className="underline">&quot;Open in Safari&quot;</span> first!
              </p>
            </div>

            {/* Step-by-Step Instructions based on OS */}
            <div className="space-y-3 text-xs">
              {isIOS ? (
                <div className="space-y-2.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>Instructions for iPhone / iPad (Safari)</span>
                  </div>
                  <div className="space-y-2 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-neutral-300 text-[11.5px]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <p>
                        Ensure you are using <strong>Safari</strong> (not Chrome or the Gmail app view).
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 text-blue-400 inline" /> at the bottom of your screen.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        Scroll down and tap <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 text-neutral-400 inline" />.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <p>
                        Tap <strong className="text-red-400">Add</strong> in the top-right corner. The GBHS crest icon is now on your home screen!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>Instructions for Android (Google Chrome)</span>
                  </div>
                  <div className="space-y-2 bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-neutral-300 text-[11.5px]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <p>
                        Open this link in standard <strong>Google Chrome</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <p>
                        Tap the <strong>three dots menu (⋮)</strong> in the top-right corner of Chrome.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <p>
                        Tap <strong className="text-white">&quot;Install app&quot;</strong> or <strong className="text-white">&quot;Add to Home screen&quot;</strong>.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <p>
                        Confirm by tapping <strong className="text-red-400">Install</strong>. The app will install with its native GBHS launcher icon.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
