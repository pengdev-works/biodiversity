import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * SystemSplashScreen
 * Professional, elegant introductory startup loading screen for UABioSphere.
 * Renders on initial application launch with smooth progress animation,
 * revealing the University of Abra seal, UABioSphere emblem, and natural science indicators.
 */
export default function SystemSplashScreen({ minDuration = 1800, onFinished }) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Initializing UABioSphere Natural Sciences Portal...');

  useEffect(() => {
    // Only show once per session or on full reload
    const hasLoaded = sessionStorage.getItem('uabiosphere_splash_shown');
    if (hasLoaded) {
      setIsVisible(false);
      if (onFinished) onFinished();
      return;
    }

    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Connecting to University of Abra Biodiversity Registry...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(78);
      setStatusText('Loading 3D Specimen Morphologies & Ecological Catalog...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('UABioSphere Ready.');
    }, 1400);

    const tEnd = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('uabiosphere_splash_shown', 'true');
        if (onFinished) onFinished();
      }, 600);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#051109] transition-opacity duration-700 select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-950/40 via-[#051109] to-[#020704] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.3) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg mx-auto">
        {/* University of Abra Seal (Authentic colorway untouched) */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1 shadow-2xl border-2 border-emerald-400/40">
            <img
              src="/images/university-of-abra-seal.png"
              alt="University of Abra Official Seal"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* UABioSphere Brand Logo */}
        <div className="mb-4">
          <img
            src="/images/uabiosphere-text-logo.png"
            alt="UABioSphere"
            className="h-12 sm:h-16 object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* University of Abra Subtitle */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-widest mb-8">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>University of Abra • Natural Sciences Portal</span>
        </div>

        {/* Progress bar */}
        <div className="w-64 sm:w-80 h-1.5 bg-black/60 rounded-full overflow-hidden border border-emerald-500/20 mb-3 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <p className="text-[11px] sm:text-xs font-mono text-emerald-300/80 animate-pulse tracking-wide h-4">
          {statusText}
        </p>

        {/* System copyright footer */}
        <div className="mt-12 text-[10px] font-mono text-emerald-400/50">
          © {new Date().getFullYear()} University of Abra • Instruction • Research • Extension • Production
        </div>
      </div>
    </div>
  );
}
