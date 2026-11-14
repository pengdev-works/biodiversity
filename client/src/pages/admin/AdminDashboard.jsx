import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dna,
  FolderOpen,
  Image as ImageIcon,
  Box,
  BookOpen,
  Users,
  Plus,
  ExternalLink,
  Leaf,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api, getImageUrl } from '../../utils/api.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    species_count: 0,
    category_count: 0,
    photo_count: 0,
    model_count: 0,
    published_magazines: 0,
    contributors_count: 0
  });
  const [recentSpecies, setRecentSpecies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/magazine/stats'),
      api.get('/api/species?status=all&limit=5'),
      api.get('/api/contributors')
    ]).then(([statsRes, speciesRes, contribRes]) => {
      const newStats = statsRes.status === 'fulfilled' ? statsRes.value : {};
      if (contribRes.status === 'fulfilled') {
        newStats.contributors_count = contribRes.value?.contributors?.length || 0;
      }
      setStats(prev => ({ ...prev, ...newStats }));

      if (speciesRes.status === 'fulfilled') {
        setRecentSpecies(speciesRes.value?.species || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: 'Documented Species', count: stats.species_count, icon: Dna, link: '/secure-admin-portal/species', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    { title: 'Taxonomic Categories', count: stats.category_count, icon: FolderOpen, link: '/secure-admin-portal/categories', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    { title: 'Photographs', count: stats.photo_count, icon: ImageIcon, link: '/secure-admin-portal/photos', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    { title: '3D Specimens', count: stats.model_count, icon: Box, link: '/secure-admin-portal/models', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    { title: 'Active Publications', count: stats.published_magazines, icon: BookOpen, link: '/secure-admin-portal/magazine', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    { title: 'Student Contributors', count: stats.contributors_count, icon: Users, link: '/secure-admin-portal/contributors', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Welcome Banner with Hero Nature Backdrop */}
      <div className="relative bg-forest-dark text-cream rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden border border-cream/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/images/hero-forest.jpg"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/95 via-forest-dark/80 to-forest-dark/90" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-cream/20 text-sage text-xs uppercase tracking-widest font-semibold mb-3 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-sage" /> Administration Studio
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-cream drop-shadow">
            Biodiversity Management Studio
          </h1>
          <p className="font-editorial italic text-cream/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
            Curate field research, upload scientific photographs and 3D specimens, and compose digital flipbook editions.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Link
            to="/secure-admin-portal/species"
            className="inline-flex items-center gap-2 bg-sage hover:bg-sage-dark text-cream px-5 py-3 rounded-full text-xs font-semibold transition shadow-lg border border-cream/10"
          >
            <Plus className="w-4 h-4" /> Add Species
          </Link>
          <Link
            to="/secure-admin-portal/magazine"
            className="inline-flex items-center gap-2 bg-earth hover:bg-earth-dark text-cream px-5 py-3 rounded-full text-xs font-semibold transition shadow-lg border border-cream/10"
          >
            <BookOpen className="w-4 h-4" /> Magazine Studio
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`p-5 rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                <Icon className="w-5 h-5 opacity-70" />
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-display text-3xl font-bold">{loading ? '—' : card.count}</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Launch & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Species (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-forest/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-forest">Recent Species Records</h2>
              <p className="text-xs text-forest/50 mt-0.5">Catalog entries recently added or modified</p>
            </div>
            <Link
              to="/secure-admin-portal/species"
              className="text-xs text-earth hover:text-earth-dark font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSpecies.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-forest/10 rounded-2xl bg-cream/30">
              <Leaf className="w-12 h-12 text-sage/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-forest/60">No species records exist yet</p>
              <p className="text-xs text-forest/40 mt-1">
                Start by adding species observations and field photographs.
              </p>
              <Link
                to="/secure-admin-portal/species"
                className="mt-4 inline-flex items-center gap-1.5 bg-forest text-cream px-4 py-2 rounded-full text-xs font-medium hover:bg-forest-light transition"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Species
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-forest/5">
              {recentSpecies.map(sp => (
                <div key={sp.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-sage/20 shrink-0 overflow-hidden">
                      {sp.cover_photo_url ? (
                        <img src={getImageUrl(sp.cover_photo_url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sage/50">
                          <Leaf className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-forest text-sm truncate">{sp.common_name}</h4>
                      <p className="font-editorial italic text-xs text-forest/50 truncate">
                        {sp.scientific_name || 'No scientific name'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      sp.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {sp.is_published ? 'Published' : 'Draft'}
                    </span>
                    <Link
                      to={`/secure-admin-portal/species`}
                      className="text-xs text-earth hover:text-earth-dark font-medium p-1"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Curation Workflow Assistant (1 col) */}
        <div className="bg-cream rounded-3xl p-6 sm:p-8 border border-forest/10 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-forest mb-2">Editorial Workflow</h3>
            <p className="font-editorial italic text-xs text-forest/70 leading-relaxed mb-6">
              To build a rich interactive magazine, follow these recommended publication steps:
            </p>

            <ol className="space-y-4 text-xs">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-forest text-cream flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-forest">Define Categories</strong>
                  <p className="text-forest/60 mt-0.5">Create taxonomic categories (Flora, Birds, Insects, etc.).</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-forest text-cream flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-forest">Add Species & Photographs</strong>
                  <p className="text-forest/60 mt-0.5">Upload high-res images and set conservation details.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-forest text-cream flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-forest">Attach 3D Models</strong>
                  <p className="text-forest/60 mt-0.5">Upload GLB/GLTF assets for interactive specimen rotation.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-forest text-cream flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-forest">Assemble Flipbook</strong>
                  <p className="text-forest/60 mt-0.5">Arrange pages in Magazine Builder and hit Publish.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="pt-4 border-t border-forest/10">
            <a
              href="/magazine"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-forest text-cream text-xs font-semibold py-3 rounded-xl hover:bg-forest-light transition"
            >
              <BookOpen className="w-4 h-4" /> Preview Live Magazine
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

