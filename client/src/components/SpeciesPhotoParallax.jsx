import React, { useRef, useState, useEffect } from 'react';

/**
 * SpeciesPhotoParallax
 * High-performance 3D parallax photo card using pointer coordinates and smooth lerp interpolation.
 * Displays dynamic multi-layer depth, perspective tilt, and realistic specular lighting reflection.
 */
export default function SpeciesPhotoParallax({
  src,
  alt = 'Species Photograph',
  category = 'Specimen',
  status = 'Monitored',
  badgeText = 'Authentic Field Photography',
  className = ''
}) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 }); // -1 to 1 range
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Target and current values for smooth animation
  const animRef = useRef({
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    rafId: null
  });

  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;
      const state = animRef.current;
      // Smooth lerp (linear interpolation)
      state.currentX += (state.targetX - state.currentX) * 0.12;
      state.currentY += (state.targetY - state.currentY) * 0.12;

      setCoords({
        x: state.currentX,
        y: state.currentY
      });

      state.rafId = requestAnimationFrame(animate);
    };

    animRef.current.rafId = requestAnimationFrame(animate);

    return () => {
      active = false;
      if (animRef.current.rafId) {
        cancelAnimationFrame(animRef.current.rafId);
      }
    };
  }, []);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

    // Clamp coordinates
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));

    animRef.current.targetX = clampedX;
    animRef.current.targetY = clampedY;
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    animRef.current.targetX = 0;
    animRef.current.targetY = 0;
  };

  // 3D rotation angles (deg)
  const rotateX = -coords.y * 14;
  const rotateY = coords.x * 14;

  // Layer translations (px)
  const bgTranslateX = -coords.x * 18;
  const bgTranslateY = -coords.y * 18;
  const fgTranslateX = coords.x * 22;
  const fgTranslateY = coords.y * 22;

  // Specular light reflection gradient position
  const glareX = ((coords.x + 1) / 2) * 100;
  const glareY = ((coords.y + 1) / 2) * 100;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full h-[400px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden cursor-crosshair select-none bg-[#07130c] border border-emerald-500/20 shadow-2xl transition-shadow duration-500 ${
        isHovered ? 'shadow-[0_25px_60px_-15px_rgba(16,185,129,0.35)]' : 'shadow-black/70'
      } ${className}`}
      style={{ perspective: '1200px' }}
    >
      {/* 3D Transform wrapper */}
      <div
        className="w-full h-full relative duration-75 ease-out transition-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`
        }}
      >
        {/* Layer 0: Ambient Botanical Backdrop */}
        <div
          className="absolute inset-[-12%] bg-cover bg-center filter blur-md opacity-40 scale-110 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            transform: `translate3d(${bgTranslateX}px, ${bgTranslateY}px, -40px)`
          }}
        />

        {/* Ambient vignette and deep forest lighting gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040d07] via-transparent to-[#040d07]/40 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-radial-vignette pointer-events-none z-10 opacity-60" />

        {/* Layer 1: Primary High-Res Specimen Photograph */}
        <div
          className="absolute inset-0 flex items-center justify-center p-3 sm:p-6"
          style={{
            transform: `translate3d(${fgTranslateX * 0.4}px, ${fgTranslateY * 0.4}px, 20px)`
          }}
        >
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#07130c]/80 z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono">
                  Loading Specimen Photo...
                </span>
              </div>
            </div>
          )}

          {imageError ? (
            <div className="text-center p-6 text-emerald-300/70">
              <p className="font-serif text-lg">Specimen photograph unavailable</p>
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover sm:object-contain rounded-2xl drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] filter contrast-[1.03] saturate-[1.05]"
              style={{
                transform: `scale(${isHovered ? 1.04 : 1})`,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          )}
        </div>

        {/* Layer 2: Floating Specular Light Glare (Follows Cursor) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-20"
          style={{
            opacity: isHovered ? 0.35 : 0,
            background: `radial-gradient(circle 320px at ${glareX}% ${glareY}%, rgba(255,255,255,0.7) 0%, rgba(16,185,129,0.2) 40%, transparent 80%)`
          }}
        />

        {/* Layer 3: Glass Badges & Interactive Metadata Overlays */}
        <div
          className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2"
          style={{ transform: 'translate3d(0, 0, 45px)' }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#092214]/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {category}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide uppercase bg-black/50 backdrop-blur-md text-emerald-200/90 border border-white/10">
            {badgeText}
          </span>
        </div>

        <div
          className="absolute top-4 right-4 z-30"
          style={{ transform: 'translate3d(0, 0, 45px)' }}
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-950/70 backdrop-blur-md text-emerald-300 border border-emerald-500/20">
            {status}
          </span>
        </div>

        {/* Bottom Interactive Parallax Hint */}
        <div
          className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between text-[11px] text-emerald-300/80 pointer-events-none"
          style={{ transform: 'translate3d(0, 0, 40px)' }}
        >
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20">
            <svg className="w-3.5 h-3.5 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            <span>Move cursor for 3D depth parallax</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5">
            <span>TILT:</span>
            <span className="text-emerald-400">{rotateY.toFixed(1)}°</span> / <span className="text-emerald-400">{rotateX.toFixed(1)}°</span>
          </div>
        </div>
      </div>
    </div>
  );
}
