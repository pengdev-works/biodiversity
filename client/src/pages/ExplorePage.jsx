import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Leaf, ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';

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
    fetch('/api/public/categories')
      .then(res => res.json())
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

    fetch(`/api/public/species?${params.toString()}`)
      .then(res => res.json())
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
    const map = {
      'Least Concern': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Near Threatened': 'bg-lime-100 text-lime-800 border-lime-200',
      'Vulnerable': 'bg-amber-100 text-amber-800 border-amber-200',
      'Endangered': 'bg-orange-100 text-orange-800 border-orange-200',
      'Critically Endangered': 'bg-rose-100 text-rose-800 border-rose-200',
      'Data Deficient': 'bg-stone-100 text-stone-700 border-stone-200',
    };
    return map[status] || 'bg-sage/20 text-forest border-sage/30';
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Editorial Header with Hero Nature Backdrop */}
      <section className="relative bg-forest-dark text-cream pt-24 pb-20 px-4 overflow-hidden border-b border-cream/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/images/hero-forest.jpg"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-dark/90 via-forest/75 to-forest-dark" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 50% 30%, rgba(20,40,30,0.3) 0%, rgba(10,22,16,0.9) 100%)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-cream/20 text-sage text-xs uppercase tracking-widest font-semibold mb-4 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-sage" /> Living Catalog
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight mb-4 drop-shadow-md">
            Explore Species
          </h1>
          <p className="font-editorial italic text-cream/80 text-lg sm:text-xl max-w-2xl leading-relaxed">
            Browse through field-documented flora, fauna, and fungi gathered from diverse habitats and conservation zones.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-2xl flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-forest/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search common name, scientific name, habitat..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-cream text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-earth shadow-xl text-sm sm:text-base border border-cream/20"
              />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setPage(1); }}
                className="px-5 py-2 bg-black/40 backdrop-blur-md hover:bg-black/60 text-cream rounded-full text-sm font-medium border border-cream/20 transition"
              >
                Clear
              </button>
            )}
          </form>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <button
              onClick={() => { setSelectedCategory(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                selectedCategory === ''
                  ? 'bg-earth text-cream border-earth shadow-lg'
                  : 'bg-black/40 backdrop-blur-md text-cream/75 border-cream/20 hover:border-cream/40 hover:text-cream'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.name); setPage(1); }}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                  selectedCategory === cat.name
                    ? 'bg-earth text-cream border-earth shadow-lg'
                    : 'bg-black/40 backdrop-blur-md text-cream/75 border-cream/20 hover:border-cream/40 hover:text-cream'
                }`}
              >
                {cat.name} {cat.published_species_count ? `(${cat.published_species_count})` : ''}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
        {loading ? (
          <div className="py-24 text-center">
            <Leaf className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
            <p className="text-forest/60 text-sm font-medium">Loading catalog records...</p>
          </div>
        ) : species.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-sage/30 rounded-2xl bg-cream/40">
            <Leaf className="w-16 h-16 text-sage/40 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-forest/70 mb-2">No Species Records Found</h3>
            <p className="text-forest/50 text-sm max-w-md mx-auto">
              {searchTerm || selectedCategory
                ? 'Try adjusting your search query or removing the category filter.'
                : 'No biodiversity species have been published yet by the administrator.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {species.map(sp => (
                <Link
                  key={sp.id}
                  to={`/explore/${sp.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-forest/10 hover:shadow-2xl transition-all duration-300 flex flex-col"
                >
                  {/* Photo container */}
                  <div className="aspect-[4/3] bg-sage/20 relative overflow-hidden">
                    {sp.cover_photo_url ? (
                      <img
                        src={sp.cover_photo_url}
                        alt={sp.common_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-cream">
                        <Leaf className="w-14 h-14 text-sage/30" />
                      </div>
                    )}
                    {sp.category_name && (
                      <span className="absolute top-4 left-4 bg-forest/80 backdrop-blur-md text-cream text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
                        {sp.category_name}
                      </span>
                    )}
                  </div>

                  {/* Body info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-forest group-hover:text-sage transition-colors leading-tight">
                        {sp.common_name}
                      </h3>
                      {sp.scientific_name && (
                        <p className="font-editorial italic text-forest/60 text-sm mt-1">
                          {sp.scientific_name}
                        </p>
                      )}
                      {sp.description && (
                        <p className="text-forest/70 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed">
                          {sp.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-6 mt-4 border-t border-forest/10 flex items-center justify-between gap-2 text-xs">
                      {sp.location ? (
                        <span className="flex items-center gap-1 text-forest/60 truncate font-medium">
                          <MapPin className="w-3.5 h-3.5 text-earth shrink-0" />
                          <span className="truncate">{sp.location}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      {sp.conservation_status && (
                        <span className={`px-2.5 py-1 rounded-full border font-semibold text-[11px] shrink-0 ${getStatusBadge(sp.conservation_status)}`}>
                          {sp.conservation_status}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-4 py-2 bg-cream text-forest rounded-full text-sm font-medium hover:bg-cream-dark disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm font-medium text-forest/70 font-editorial">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-cream text-forest rounded-full text-sm font-medium hover:bg-cream-dark disabled:opacity-40 transition"
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

