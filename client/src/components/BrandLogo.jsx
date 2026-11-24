import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo
 * Professional brand emblem uniting the authentic University of Abra official seal
 * with the signature UABioSphere lettering.
 * Note: The University of Abra seal preserves 100% of its authentic colorway (royal blue, emerald, ruby red, white).
 */
export default function BrandLogo({
  size = 'md', // 'sm' | 'md' | 'lg' | 'hero'
  showSubtitle = true,
  to = '/',
  className = '',
  textColor = 'text-white'
}) {
  const sealSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    hero: 'w-16 h-16 sm:w-20 sm:h-20'
  };

  const textLogoSizes = {
    sm: 'h-6',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-12',
    hero: 'h-14 sm:h-18'
  };

  const Content = (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none group ${className}`}>
      {/* Official University of Abra Seal (Untouched authentic colors preserved) */}
      <div className={`relative shrink-0 rounded-full overflow-hidden bg-white/95 p-0.5 shadow-md border border-white/20 transition-transform duration-300 group-hover:scale-105 ${sealSizes[size]}`}>
        <img
          src="/images/university-of-abra-seal.png"
          alt="University of Abra Official Seal"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Wordmark & Institutional Sub-badge */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center">
          <img
            src="/images/uabiosphere-text-logo.png"
            alt="UABioSphere"
            className={`${textLogoSizes[size]} object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]`}
          />
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-emerald-300/90 font-semibold truncate">
              University of Abra • Natural Sciences
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block transition-opacity hover:opacity-95">
        {Content}
      </Link>
    );
  }

  return Content;
}
