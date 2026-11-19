import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Leaf, ChevronLeft, ChevronRight, ArrowRight, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { api, getImageUrl } from '../utils/api';

const DEFAULT_CATEGORIES = [
  { name: '', label: 'All Species', icon: '🐾' },
  { name: 'Mammals', label: 'Mammals', icon: '🦇' },
  { name: 'Birds', label: 'Birds', icon: '🦅' },
  { name: 'Reptiles', label: 'Reptiles', icon: '🦎' },
  { name: 'Amphibians', label: 'Amphibians', icon: '🐸' },
  { name: 'Insects', label: 'Insects', icon: '🦗' },
  { name: 'Plants', label: 'Plants', icon: '🌿' },
];

export default function ExplorePage() {
  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    api.get('/api/public/categories')
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Fetch species whenever search, category, or page changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '12',
    });
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchTerm) params.set('search', searchTerm);

    api.get(`/api/public/species?${params.toString()}`)
      .then(data => {
        setSpecies(data.species || []);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch(() => {
        setSpecies([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, searchTerm, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Critically Endangered':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Critically Endangered',
        };
      case 'Endangered':
        return {
          pill: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          label: 'Endangered',
        };
      case 'Vulnerable':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Vulnerable',
        };
      case 'Near Threatened':
        return {
          pill: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          dot: 'bg-yellow-500',
          label: 'Near Threatened',
        };
      case 'Least Concern':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Least Concern',
        };
      default:
        return {
          pill: 'bg-stone-50 text-stone-700 border-stone-200',
          dot: 'bg-emerald-500',
          label: status || 'Documented',
        };
    }
  };

  // Combine default categories with any dynamic categories from DB
  const filterList = [
    { name: '', label: 'All Species', icon: '🐾' },
    ...categories.map(c => {
      const match = DEFAULT_CATEGORIES.find(d => d.name.toLowerCase() === c.name.toLowerCase());
      return {
        name: c.name,
        label: c.name,
        icon: match ? match.icon : '🌱',
      };
    })
  ];

  return (
    <div className="min-h-screen bg-[#f7f9f6] pb-24">
      {/* Hero Banner with Mountain/Forest Background */}
      <section className="relative bg-[#163a2b] text-white pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Background Landscape */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/images/hero-forest.jpg"
            alt="Natural Habitat"
            className="w-full h-full object-cover filter brightness-[0.55] contrast-[1.15] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#122e22]/95 via-[#163a2b]/80 to-[#122e22]/90" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#163a2b]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs uppercase tracking-widest font-semibold mb-3 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" /> Living Nature Archive
              </div>
              <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                Explore <span className="text-emerald-400 italic">Biodiversity</span>
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-lg mt-2 max-w-xl font-medium">
                Discover the amazing species that call our diverse ecosystems home.
              </p>
            </div>

            {/* Handwritten cursive style accent */}
            <div className="hidden lg:block text-right">
              <span className="font-editorial italic text-3xl sm:text-4xl text-amber-200/90 drop-shadow-md">
                Rich Natural Heritage
              </span>
              <p className="text-xs text-emerald-200/70 tracking-widest uppercase mt-1">Field Observation Dossiers</p>
            </div>
          </div>

          {/* Search Bar matching mockup */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="relative">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search for a species (common name, scientific name, habitat)..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-full bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-3 focus:ring-emerald-400 shadow-xl text-sm sm:text-base border border-stone-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Category Filter Pills Matching Mockup */}
      <section className="bg-white border-b border-stone-200 shadow-xs sticky top-18 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
            {filterList.map(item => {
              const isActive = selectedCategory.toLowerCase() === item.name.toLowerCase();
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setSelectedCategory(item.name);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border shrink-0 shadow-xs cursor-pointer ${
                    isActive
                      ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-md scale-102'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Species Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {loading ? (
          <div className="py-28 text-center">
            <Leaf className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-stone-600 font-medium text-sm">Loading species records...</p>
          </div>
        ) : species.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-emerald-300/60 rounded-3xl bg-white p-8 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-stone-800 mb-2">No Species Records Found</h3>
            <p className="text-stone-500 text-sm mb-6 leading-relaxed">
              {searchTerm || selectedCategory
                ? 'Try adjusting your search keywords or switching category filters.'
                : 'No published species have been added yet. Use the admin studio to document new flora and fauna!'}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                className="px-5 py-2.5 bg-[#1b4332] text-white rounded-full text-xs font-semibold hover:bg-[#2d6a4f] transition"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid matching user mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {species.map((sp) => {
                const badge = getStatusBadge(sp.conservation_status);
                return (
                  <div
                    key={sp.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                  >
                    <div>
                      {/* Photo Thumbnail */}
                      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden flex items-center justify-center">
                        <div className="w-full h-full flex items-center justify-center bg-stone-100 absolute inset-0">
                          <Leaf className="w-10 h-10 text-stone-300" />
                        </div>
                        {sp.cover_photo_url ? (
                          <img
                            src={getImageUrl(sp.cover_photo_url)}
                            alt={sp.common_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out relative z-1"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : null}

                        {sp.category_name && (
                          <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full z-2">
                            {sp.category_name}
                          </span>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5">
                        <h3 className="font-display text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          {sp.common_name}
                        </h3>
                        <p className="font-editorial italic text-stone-500 text-xs mt-0.5 truncate">
                          {sp.scientific_name || 'Species record'}
                        </p>

                        {/* Status badge with indicator dot */}
                        <div className="mt-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.pill}`}>
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Button matching mockup: View Details -> */}
                    <div className="p-4 sm:p-5 pt-0">
                      <Link
                        to={`/explore/${sp.id}`}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm group-hover:shadow-md"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-14">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-4 py-2 bg-white text-stone-700 border border-stone-200 rounded-full text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 transition shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs font-semibold text-stone-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-white text-stone-700 border border-stone-200 rounded-full text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 transition shadow-xs"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

