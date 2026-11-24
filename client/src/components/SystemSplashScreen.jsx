import React, { useState, useEffect } from 'react';
import { Leaf, Dna, Box, Globe2, ShieldCheck } from 'lucide-react';

/**
 * SystemSplashScreen
 * Redesigned to align directly with UABioSphere's design system:
 * - Deep botanical green backdrop (#07150d / #030a06)
 * - Frosted glassmorphism card with subtle emerald borders
 * - Authentic University of Abra Seal (100% original colorway)
 * - Official UABioSphere wordmark
 * - Pulsing ecological taxonomy metrics & smooth animated loading track
 */
export default function SystemSplashScreen({ minDuration = 2200, onFinished }) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(15);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { label: 'Initializing Portal...', subtext: 'Connecting to University of Abra Natural Sciences Engine' },
    { label: 'Verifying Catalog...', subtext: 'Fetching species observations & Neon PostgreSQL records' },
    { label: 'Preparing 3D Engine...', subtext: 'Synthesizing WebGL specimen geometry & shader materials' },
    { label: 'UABioSphere Online', subtext: 'Welcome to the Living Nature Portal' }
  ];

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(42);
      setCurrentStepIndex(1);
    }, 500);

    const t2 = setTimeout(() => {
      setProgress(78);
      setCurrentStepIndex(2);
    }, 1100);

    const t3 = setTimeout(() => {
      setProgress(100);
      setCurrentStepIndex(3);
    }, 1700);

    const tEnd = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinished) onFinished();
      }, 700);
    }, minDuration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tEnd);
    };
  }, [minDuration, onFinished]);

  if (!isVisible) return null;

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#040e07] transition-opacity duration-700 select-none overflow-hidden px-4 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 bg-radial from-[#092214] via-[#040e07] to-[#010502] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(16,185,129,0.35) 0%, transparent 60%)'
        }}
      />

      {/* Decorative botanical ambient rings */}
      <div className="absolute w-[500px] h-[500px] rounded-full border border-emerald-500/10 animate-spin pointer-events-none" style={{ animationDuration: '30s' }} />
      <div className="absolute w-[700px] h-[700px] rounded-full border border-emerald-500/5 animate-spin pointer-events-none" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />

      {/* Main Glassmorphic Loading Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0a1b11]/85 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border border-emerald-500/30 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
        {/* Floating Top Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 mb-6 shadow-sm">
          <Leaf className="w-3 h-3 text-emerald-400" />
          <span>Natural Sciences Field Registry</span>
        </div>

        {/* Brand Crest & Seal Lockup */}
        <div className="flex items-center justify-center gap-3.5 mb-5">
          {/* University of Abra Seal (Strictly untouched authentic colors) */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-0.5 shadow-xl border-2 border-emerald-400/40 shrink-0">
            <img
              src="/images/university-of-abra-seal.png"
              alt="University of Abra Official Seal"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="h-10 w-[1px] bg-emerald-500/30" />

          {/* UABioSphere Lettering */}
          <div className="text-left">
            <img
              src="/images/uabiosphere-text-logo.png"
              alt="UABioSphere"
              className="h-9 sm:h-11 object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
            />
            <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400/80 block mt-0.5">
              University of Abra
            </span>
          </div>
        </div>

        {/* Feature Icons Row */}
        <div className="flex items-center justify-center gap-6 py-4 my-2 border-y border-emerald-500/15 w-full text-emerald-300/70 text-xs">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-emerald-400">
              <Dna className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono uppercase">Taxonomy</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-emerald-400">
              <Box className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono uppercase">3D Models</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-emerald-400">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono uppercase">Habitats</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono uppercase">Research</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full mt-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/80 mb-2">
            <span className="truncate pr-2 font-medium">{currentStep.label}</span>
            <span className="shrink-0">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-emerald-500/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 transition-all duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Subtext indicator */}
          <p className="text-[10px] text-emerald-200/60 font-light mt-2.5 h-4 truncate">
            {currentStep.subtext}
          </p>
        </div>

        {/* Institutional Accreditation Footer */}
        <div className="mt-6 pt-4 border-t border-emerald-500/10 w-full text-[9px] font-mono text-emerald-400/50 flex items-center justify-between">
          <span>Instruction • Research</span>
          <span>Extension • Production</span>
        </div>
      </div>
    </div>
  );
}
