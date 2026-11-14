import { useRef, useState, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import MagazinePage from './MagazinePage.jsx';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { playPageTurn } from '../utils/audio.js';

function calculateBookDimensions() {
  if (typeof window === 'undefined') return { width: 580, height: 800, isMobile: false };

  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  // Reserve space for top and bottom bars
  const availHeight = window.innerHeight - (isMobile ? 116 : 110);
  const availWidth = window.innerWidth - (isMobile ? 24 : 48);

  if (isMobile) {
    // Single-page portrait layout for smartphones
    let h = Math.min(availHeight, 720);
    h = Math.max(380, h);

    // Standard portrait page ratio ~0.68
    let w = Math.round(h * 0.68);
    if (w > availWidth) {
      w = availWidth;
      h = Math.round(w / 0.68);
    }

    return {
      width: Math.max(260, Math.floor(w)),
      height: Math.max(380, Math.floor(h)),
      isMobile: true
    };
  }

  // Two-page spread for tablets and desktops
  let h = Math.min(availHeight, 860);
  h = Math.max(500, h);

  let w = Math.round(h * 0.70);

  // If 2-page spread exceeds available width, constrain by width
  if (w * 2 > availWidth) {
    w = Math.floor(availWidth / 2);
    h = Math.round(w / 0.70);
  }

  return {
    width: Math.max(320, w),
    height: Math.max(460, h),
    isMobile: false
  };
}

export default function FlipBook({ magazine }) {
  const bookRef = useRef(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [sound, setSound] = useState(true);
  const [dimensions, setDimensions] = useState(calculateBookDimensions);

  const pages = magazine?.pages || [];
  const totalPages = pages.length;

  useEffect(() => {
    const handleResize = () => setDimensions(calculateBookDimensions());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
    if (sound) playPageTurn();
  }, [sound]);

  const prevPage = () => bookRef.current?.pageFlip().flipPrev();
  const nextPage = () => bookRef.current?.pageFlip().flipNext();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (totalPages === 0) {
    return (
      <div className="h-screen w-screen bg-forest-dark flex items-center justify-center">
        <div className="text-center text-cream">
          <BookOpen className="w-16 h-16 text-sage/40 mx-auto mb-4" />
          <h2 className="font-display text-3xl mb-2">No Pages Published Yet</h2>
          <p className="text-cream/60 text-sm">The administrator has not added pages to this volume.</p>
        </div>
      </div>
    );
  }

  // Calculate shift so the cover or back cover centers nicely when closed
  const isFrontCover = currentPage === 0;
  const isBackCover = currentPage >= totalPages - 1 && totalPages % 2 === 0;

  const getTransform = () => {
    if (dimensions.isMobile) return 'translateX(0)';
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      if (isFrontCover) return `translateX(-${Math.round(dimensions.width / 2)}px)`;
      if (isBackCover) return `translateX(${Math.round(dimensions.width / 2)}px)`;
    }
    return 'translateX(0)';
  };

  return (
    <div
      ref={containerRef}
      className={`h-screen w-screen bg-forest-dark flex flex-col select-none overflow-hidden ${
        fullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* Top Header & Page Indicator (Height: 48px) */}
      <header className="h-12 flex items-center justify-between sm:justify-center gap-2 sm:gap-4 text-cream/80 shrink-0 z-30 px-4">
        <span className="text-xs sm:text-sm font-semibold font-display tracking-wide truncate max-w-[180px] sm:max-w-none">
          {magazine?.title || 'BIODIVERSITY'}
        </span>
        <span className="text-cream/30 hidden sm:inline">•</span>
        <span className="text-[11px] sm:text-xs text-cream/60 font-mono shrink-0">
          {dimensions.isMobile
            ? (isFrontCover ? 'Cover' : isBackCover ? 'Back' : `P. ${currentPage + 1}/${totalPages}`)
            : (isFrontCover ? 'Front Cover' : isBackCover ? 'Back Cover' : `Pages ${currentPage}–${Math.min(currentPage + 1, totalPages)} • ${totalPages} Pages`)}
        </span>
      </header>

      {/* Main FlipBook Interactive Stage (Fills remaining height smoothly centered) */}
      <main className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden relative px-2 sm:px-0">
        <div
          className="transition-transform duration-500 ease-out will-change-transform flex items-center justify-center max-w-full max-h-full"
          style={{ transform: getTransform() }}
        >
          <HTMLFlipBook
            key={`${dimensions.width}-${dimensions.height}-${dimensions.isMobile ? 'portrait' : 'spread'}`}
            ref={bookRef}
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            minWidth={dimensions.width}
            maxWidth={dimensions.width}
            minHeight={dimensions.height}
            maxHeight={dimensions.height}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={onFlip}
            className="magazine-book"
            startPage={currentPage}
            drawShadow={true}
            flippingTime={600}
            usePortrait={dimensions.isMobile}
            startZIndex={20}
            autoSize={true}
            maxShadowOpacity={0.5}
            showPageCorners={true}
            disableFlipByClick={false}
          >
            {pages.map((page, i) => (
              <MagazinePage key={page.id || i} page={page} magazine={magazine} number={i} />
            ))}
          </HTMLFlipBook>
        </div>
      </main>

      {/* Bottom Floating Navigation Toolbar (Height: 56px) */}
      <footer className="h-14 flex items-center justify-center gap-6 shrink-0 z-30 px-4">
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className="p-3 rounded-full bg-cream/10 hover:bg-cream/25 text-cream disabled:opacity-20 transition shadow-lg hover:scale-105"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setSound(!sound)}
          className="p-2.5 rounded-full text-cream/70 hover:text-cream hover:bg-cream/10 transition"
          title={sound ? 'Mute Page Turn Sound' : 'Enable Page Turn Sound'}
        >
          {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-rose-300" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-full text-cream/70 hover:text-cream hover:bg-cream/10 transition"
          title={fullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
        >
          {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
          className="p-3 rounded-full bg-cream/10 hover:bg-cream/25 text-cream disabled:opacity-20 transition shadow-lg hover:scale-105"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}
