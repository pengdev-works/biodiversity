import React, { useState, useEffect } from 'react';

/**
 * SystemSplashScreen (Simple, Clean & Minimal)
 * A clean, minimalist loading experience:
 * - Solid dark botanical green background
 * - Centered University of Abra official seal (authentic colorway)
 * - UABioSphere brand logo
 * - Elegant slim progress bar and status indicator
 */
export default function SystemSplashScreen({ minDuration = 1800, onFinished }) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const t1 = setTimeout(() => setProgress(55), 450);
    const t2 = setTimeout(() => setProgress(85), 950);
    const t3 = setTimeout(() => setProgress(100), 1400);

    const tEnd = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinished) onFinished();
      }, 500);
    }, minDuration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tEnd);
    };
  }, [minDuration, onFinished]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#07170e] transition-opacity duration-500 select-none px-4 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center max-w-xs w-full">
        {/* University of Abra Official Seal (Authentic colorway) */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-2xl mb-4 border border-white/20">
          <img
            src="/images/university-of-abra-seal.png"
            alt="University of Abra Seal"
            className="w-full h-full object-contain"
          />
        </div>

        {/* UABioSphere Brand Logo */}
        <div className="mb-6">
          <img
            src="/images/uabiosphere-text-logo.png"
            alt="UABioSphere"
            className="h-10 sm:h-12 object-contain"
          />
        </div>

        {/* Minimal Slim Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimal Subtext */}
        <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-300/70">
          Loading...
        </span>
      </div>
    </div>
  );
}
