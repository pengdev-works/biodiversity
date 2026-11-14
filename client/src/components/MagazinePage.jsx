import { forwardRef, useRef, useState, useLayoutEffect } from 'react';
import { Leaf, MapPin, Shield, TreePine } from 'lucide-react';

function AutoFitTitle({ text, maxPx = 48, minPx = 16, className = '' }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [size, setSize] = useState(maxPx);

  useLayoutEffect(() => {
    function fit() {
      const parent = containerRef.current;
      const textEl = textRef.current;
      if (!parent || !textEl) return;

      // Reset to max so we can accurately measure natural width
      textEl.style.fontSize = `${maxPx}px`;

      // Use offsetWidth for container so padding is excluded
      const available = parent.offsetWidth;
      const natural = textEl.scrollWidth;
      if (available > 0 && natural > available) {
        const ratio = (available - 2) / natural;
        const fitted = Math.max(minPx, Math.floor(maxPx * ratio));
        setSize(fitted);
      } else {
        setSize(maxPx);
      }
    }

    // Run immediately + after a brief paint for accurate layout
    fit();
    const raf = requestAnimationFrame(fit);
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
    };
  }, [text, maxPx, minPx]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <h1
        ref={textRef}
        className={`whitespace-nowrap font-display font-extrabold text-cream drop-shadow-md leading-tight tracking-tight ${className}`}
        style={{ fontSize: `${size}px` }}
      >
        {text}
      </h1>
    </div>
  );
}

const MagazinePage = forwardRef(({ page, magazine, number }, ref) => {
  const content = page.content_json
    ? (typeof page.content_json === 'string' ? JSON.parse(page.content_json) : page.content_json)
    : {};

  const isCover = page.template_type === 'cover';
  const isBackCover = page.template_type === 'back-cover';

  const renderContent = () => {
    switch (page.template_type) {
      case 'cover':
        return <CoverTemplate magazine={magazine} content={content} />;
      case 'toc':
        return <TocTemplate content={content} pages={magazine?.pages} />;
      case 'intro':
        return <IntroTemplate content={content} magazine={magazine} />;
      case 'species-feature':
        return <SpeciesFeatureTemplate content={content} />;
      case 'species-detail':
        return <SpeciesDetailTemplate content={content} />;
      case 'gallery':
        return <GalleryTemplate content={content} />;
      case 'back-cover':
        return <BackCoverTemplate magazine={magazine} content={content} />;
      default:
        return <BlankTemplate content={content} number={number} />;
    }
  };

  // Determine if this is a left page or right page in dual spread
  const isLeftPage = number % 2 !== 0;

  return (
    <div
      ref={ref}
      className="relative w-full h-full overflow-hidden bg-paper select-none shadow-sm"
      data-density={isCover || isBackCover ? 'hard' : 'soft'}
    >
      {renderContent()}

      {/* Realistic Book Spine Shadow */}
      {!isCover && !isBackCover && (
        <div
          className={`absolute inset-y-0 ${
            isLeftPage
              ? 'right-0 w-8 bg-gradient-to-l from-black/15 via-black/5 to-transparent'
              : 'left-0 w-8 bg-gradient-to-r from-black/15 via-black/5 to-transparent'
          } pointer-events-none z-20`}
        />
      )}

      {/* Page Number for inner editorial pages */}
      {!isCover && !isBackCover && (
        <div
          className={`absolute bottom-5 ${
            isLeftPage ? 'left-8 text-left' : 'right-8 text-right'
          } text-forest/40 text-[11px] font-editorial italic z-20`}
        >
          {number + 1}
        </div>
      )}
    </div>
  );
});

MagazinePage.displayName = 'MagazinePage';
export default MagazinePage;

// ── Template components ──────────────────────────────────────────────────────

function CoverTemplate({ magazine, content }) {
  const title = magazine?.title || 'BIODIVERSITY';
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-forest-dark via-forest to-forest-dark text-cream relative p-8 sm:p-10 justify-between">
      {/* Background cover image if uploaded */}
      {magazine?.cover_photo_url && (
        <img
          src={magazine.cover_photo_url}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none" />

      {/* Decorative luxury gold/earth frame */}
      <div className="absolute inset-4 border border-earth/40 pointer-events-none z-10" />
      <div className="absolute inset-5 border border-earth/20 pointer-events-none z-10" />

      {/* Top Header */}
      <div className="relative z-10 pt-4 px-2">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-5 h-5 text-sage" />
          <span className="text-sage text-[10px] sm:text-xs uppercase tracking-widest font-semibold font-mono">
            Interactive Biodiversity Magazine
          </span>
        </div>
        
        {/* Auto-fitting title: SVG with computed viewBox so text is NEVER clipped */}
        <AutoFitTitle text={title} maxPx={52} minPx={18} className="my-2" />

        {magazine?.subtitle && (
          <p className="text-cream/85 text-sm sm:text-base font-editorial italic mt-3 max-w-md leading-relaxed">
            {magazine.subtitle}
          </p>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 pb-4 px-2 flex items-end justify-between border-t border-cream/20 pt-4">
        <div>
          {magazine?.edition && (
            <p className="text-earth-light text-xs sm:text-sm font-semibold tracking-wide">
              {magazine.edition}
            </p>
          )}
          {magazine?.volume && (
            <p className="text-cream/60 text-[11px] font-mono mt-0.5">
              {magazine.volume}
            </p>
          )}
        </div>
        <div className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center text-sage">
          <Leaf className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function TocTemplate({ content, pages }) {
  const entries = content.entries || [];
  return (
    <div className="w-full h-full p-10 sm:p-14 bg-cream flex flex-col justify-between">
      <div>
        <div className="border-b-2 border-forest pb-4 mb-8">
          <span className="text-sage text-xs uppercase tracking-widest font-semibold">Table of Contents</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest mt-1">In This Issue</h2>
        </div>
        <div className="space-y-4">
          {entries.map((e, i) => (
            <div key={i} className="flex items-baseline gap-4 py-2.5 border-b border-forest/10">
              <span className="text-earth font-display font-bold text-xl w-8 shrink-0">{e.page}</span>
              <span className="font-editorial text-forest text-base flex-1">{e.title}</span>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="py-12 text-center text-forest/40 italic text-sm">
              Table of contents will reflect active published articles.
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-forest/10 flex items-center justify-between text-xs text-forest/50 font-editorial">
        <span>BIODIVERSITY Digital Collection</span>
        <span>Field Research Publications</span>
      </div>
    </div>
  );
}

function IntroTemplate({ content, magazine }) {
  return (
    <div className="w-full h-full p-10 sm:p-14 bg-paper flex flex-col justify-center">
      <span className="text-sage text-xs uppercase tracking-widest font-semibold mb-2">Editorial Introduction</span>
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-forest mb-6 leading-tight">
        {content.title || magazine?.intro_title || 'Welcome'}
      </h2>
      <p className="font-editorial text-forest/80 leading-relaxed text-base sm:text-lg drop-cap whitespace-pre-line">
        {content.body || magazine?.intro_body || ''}
      </p>
    </div>
  );
}

function SpeciesFeatureTemplate({ content }) {
  const sp = content.species || {};
  return (
    <div className="w-full h-full relative bg-forest-dark text-cream overflow-hidden flex flex-col justify-end">
      {sp.cover_photo_url ? (
        <img
          src={sp.cover_photo_url}
          alt={sp.common_name || ''}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-forest">
          <Leaf className="w-24 h-24 text-sage/20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />
      <div className="relative z-10 p-8 sm:p-12">
        {sp.category_name && (
          <span className="inline-block bg-sage/90 text-cream text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full mb-3">
            {sp.category_name}
          </span>
        )}
        <h2
          className="font-display font-bold leading-tight drop-shadow-md"
          style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', overflowWrap: 'break-word' }}
        >
          {sp.common_name || 'Featured Specimen'}
        </h2>
        {sp.scientific_name && (
          <p className="text-cream/80 italic font-editorial text-lg sm:text-xl mt-1.5">
            {sp.scientific_name}
          </p>
        )}
      </div>
    </div>
  );
}

function SpeciesDetailTemplate({ content }) {
  const sp = content.species || {};
  return (
    <div className="w-full h-full p-8 sm:p-12 bg-paper flex flex-col justify-between overflow-hidden">
      <div>
        <div className="border-l-4 border-earth pl-4 mb-6">
          <span className="text-sage text-xs uppercase tracking-widest font-semibold">
            {sp.category_name || 'Taxa Profile'}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-forest mt-0.5">
            {sp.common_name || 'Species Dossier'}
          </h2>
          {sp.scientific_name && (
            <p className="italic text-forest/60 text-sm mt-0.5 font-editorial">
              {sp.scientific_name}
            </p>
          )}
        </div>

        {sp.description && (
          <p className="font-editorial text-forest/80 text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line drop-cap">
            {sp.description}
          </p>
        )}
      </div>

      <div className="pt-6 border-t border-forest/10 space-y-3">
        {sp.habitat && (
          <div className="flex items-start gap-2.5 text-xs text-forest/70">
            <TreePine className="w-4 h-4 text-sage shrink-0 mt-0.5" />
            <span><strong>Habitat:</strong> {sp.habitat}</span>
          </div>
        )}
        {sp.location && (
          <div className="flex items-start gap-2.5 text-xs text-forest/70">
            <MapPin className="w-4 h-4 text-earth shrink-0 mt-0.5" />
            <span><strong>Documented Range:</strong> {sp.location}</span>
          </div>
        )}
        {sp.conservation_status && (
          <div className="flex items-center gap-2 pt-1">
            <Shield className="w-4 h-4 text-forest/60 shrink-0" />
            <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${getStatusColor(sp.conservation_status)}`}>
              IUCN Red List: {sp.conservation_status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryTemplate({ content }) {
  const photos = content.photos || [];
  return (
    <div className="w-full h-full bg-forest-dark p-6 sm:p-8 flex flex-col justify-between">
      <div className="mb-4">
        <span className="text-sage text-xs uppercase tracking-widest font-semibold">Photo Gallery</span>
        <h3 className="font-display text-2xl font-bold text-cream mt-0.5">Field Photography</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {photos.slice(0, 4).map((p, i) => (
          <div key={i} className="overflow-hidden rounded-xl bg-black/40 relative group">
            <img src={p.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            {p.caption && (
              <span className="absolute bottom-2 left-2 bg-black/70 text-cream text-[10px] px-2 py-0.5 rounded">
                {p.caption}
              </span>
            )}
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center text-cream/40">
            <Leaf className="w-12 h-12 text-sage/30 mb-2" />
            <p className="text-xs">No gallery images assigned</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BackCoverTemplate({ magazine, content }) {
  return (
    <div className="w-full h-full bg-forest-dark flex flex-col items-center justify-center text-cream p-10 sm:p-14 text-center relative border-4 border-earth/30">
      <div className="absolute inset-4 border border-earth/20 pointer-events-none" />

      <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center mb-6 text-sage shadow-md">
        <Leaf className="w-8 h-8" />
      </div>
      <p className="font-display text-3xl font-bold mb-3 tracking-wide">
        {magazine?.title || 'BIODIVERSITY'}
      </p>
      <p className="text-cream/70 text-sm font-editorial italic max-w-xs leading-relaxed mb-8">
        {content.closing || 'Preserving biodiversity, habitats, and ecological balance for future generations.'}
      </p>

      <div className="text-[11px] text-cream/40 font-mono tracking-widest uppercase">
        Digital Field Publication
      </div>
    </div>
  );
}

function BlankTemplate({ content, number }) {
  return (
    <div className="w-full h-full bg-paper p-10 sm:p-14 flex flex-col justify-center">
      {content.title && (
        <h2 className="font-display text-3xl font-bold text-forest mb-4">{content.title}</h2>
      )}
      {content.body && (
        <p className="font-editorial text-forest/80 leading-relaxed text-base whitespace-pre-line drop-cap">
          {content.body}
        </p>
      )}
    </div>
  );
}

function getStatusColor(status) {
  const map = {
    'Least Concern': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'Near Threatened': 'bg-lime-100 text-lime-800 border-lime-300',
    'Vulnerable': 'bg-amber-100 text-amber-800 border-amber-300',
    'Endangered': 'bg-orange-100 text-orange-800 border-orange-300',
    'Critically Endangered': 'bg-rose-100 text-rose-800 border-rose-300',
    'Data Deficient': 'bg-stone-100 text-stone-700 border-stone-300',
  };
  return map[status] || 'bg-sage/20 text-forest border-sage/30';
}
