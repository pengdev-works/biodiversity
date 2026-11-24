import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ShieldAlert,
  Leaf,
  Box,
  Image as ImageIcon,
  Sparkles,
  Download,
  Volume2,
  VolumeX,
  Compass,
  Utensils,
  Lightbulb,
  ExternalLink,
  RotateCcw,
  Check,
  Share2
} from 'lucide-react';
import ThreeDViewer from '../components/ThreeDViewer.jsx';
import SpeciesPhotoParallax from '../components/SpeciesPhotoParallax.jsx';
import SpeciesThreeDViewer from '../components/SpeciesThreeDViewer.jsx';
import { api, getImageUrl } from '../utils/api';

export default function SpeciesDetailPage() {
  const { id } = useParams();
  const [species, setSpecies] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'gallery' | 'conservation' | 'related'
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'photo'
  const [relatedSpecies, setRelatedSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/public/species/${id}`)
      .then(data => {
        setSpecies(data.species);
        if (data.species.photos && data.species.photos.length > 0) {
          const cover = data.species.photos.find(p => p.is_cover) || data.species.photos[0];
          setSelectedPhoto(cover.url);
        } else if (data.species.cover_photo_url) {
          setSelectedPhoto(data.species.cover_photo_url);
        }

        // Default to photo if no 3D model exists
        if (!data.species.models || data.species.models.length === 0) {
          setViewMode('photo');
        } else {
          setViewMode('3d');
        }

        // Fetch related species in same category
        if (data.species.category_name) {
          api.get(`/api/public/species?limit=4&category=${encodeURIComponent(data.species.category_name)}`)
            .then(relData => {
              const others = (relData.species || []).filter(s => s.id !== data.species.id).slice(0, 3);
              setRelatedSpecies(others);
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  const handleSpeech = () => {
    if (!('speechSynthesis' in window) || !species) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${species.common_name}. Scientific name: ${species.scientific_name || 'unspecified'}. Conservation status: ${species.conservation_status || 'documented'}. Habitat: ${species.habitat || 'natural environment'}. ${species.description || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    if (!species) return;
    const content = `=====================================================
BIODIVERSITY FIELD OBSERVATION DOSSIER
=====================================================
Common Name:        ${species.common_name}
Scientific Name:    ${species.scientific_name || 'N/A'}
Category:           ${species.category_name || 'N/A'}
Conservation Status: ${species.conservation_status || 'N/A'}
Documented Location: ${species.location || 'N/A'}
Natural Habitat:    ${species.habitat || 'N/A'}

TAXONOMIC CLASSIFICATION:
Kingdom:            ${species.category_name === 'Plants' ? 'Plantae' : 'Animalia'}
Scientific Genus:   ${species.scientific_name ? species.scientific_name.split(' ')[0] : 'N/A'}
Scientific Species: ${species.scientific_name || 'N/A'}

SCIENTIFIC OVERVIEW & DESCRIPTION:
${species.description || 'No detailed description available.'}

=====================================================
Documented by University Natural Sciences Research Portal
System URL: ${window.location.href}
Generated at: ${new Date().toLocaleString()}
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${species.common_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_dossier.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9f6] flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-stone-600 text-sm font-semibold">Opening field observation dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !species) {
    return (
      <div className="min-h-screen bg-[#f7f9f6] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <Leaf className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">Species Record Not Found</h2>
          <p className="text-stone-500 mb-6 text-sm">
            This biodiversity specimen either does not exist or has not been published yet.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 bg-[#1b4332] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#2d6a4f] transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Species Catalog
          </Link>
        </div>
      </div>
    );
  }

  const approvedModel = species.models && species.models.length > 0 ? species.models[0] : null;

  // Derive taxonomy details
  const genus = species.scientific_name ? species.scientific_name.split(' ')[0] : '—';
  const isPlant = species.category_name?.toLowerCase().includes('plant') || species.category_name?.toLowerCase().includes('flora');
  const kingdom = isPlant ? 'Plantae' : 'Animalia';
  const phylum = isPlant ? 'Tracheophyta' : (species.category_name?.toLowerCase().includes('insect') ? 'Arthropoda' : 'Chordata');
  const cls = species.category_name || (isPlant ? 'Magnoliopsida' : 'Fauna');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Critically Endangered':
        return 'bg-rose-600 text-white';
      case 'Endangered':
        return 'bg-red-600 text-white';
      case 'Vulnerable':
        return 'bg-amber-500 text-white';
      case 'Near Threatened':
        return 'bg-yellow-500 text-stone-900';
      case 'Least Concern':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-[#1b4332] text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9f6] pb-24">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-stone-200 py-3.5 px-4 sm:px-6 shadow-xs sticky top-18 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700 hover:text-emerald-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-full transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Species
          </Link>

          <div className="flex items-center gap-2">
            {species.category_name && (
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                {species.category_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Main Master Card Matching Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: 3D Model / Photo Viewer + Tabs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Viewer Box */}
            <div className="bg-[#111c16] rounded-3xl overflow-hidden border border-stone-800 shadow-xl relative flex flex-col justify-between">
              {/* Top Controls Overlay */}
              <div className="p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" /> {viewMode === '3d' && approvedModel ? '3D Interactive' : 'Photo Plate'}
                  </span>

                  {approvedModel && (
                    <div className="inline-flex rounded-full bg-white/10 p-0.5 border border-white/10 text-xs">
                      <button
                        onClick={() => setViewMode('3d')}
                        className={`px-3 py-1 rounded-full font-semibold transition ${viewMode === '3d' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'}`}
                      >
                        3D View
                      </button>
                      <button
                        onClick={() => setViewMode('photo')}
                        className={`px-3 py-1 rounded-full font-semibold transition ${viewMode === 'photo' ? 'bg-emerald-600 text-white' : 'text-stone-300 hover:text-white'}`}
                      >
                        Photo
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-white/80">
                  {approvedModel && (
                    <button
                      onClick={() => {
                        // toggle re-center
                        const el = document.querySelector('canvas');
                        if (el) el.focus();
                      }}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition"
                      title="Reset orientation"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Viewer Canvas or Photo */}
              <div className="w-full flex items-center justify-center relative overflow-hidden bg-radial from-stone-900 to-black">
                {viewMode === '3d' && approvedModel ? (
                  <SpeciesThreeDViewer modelUrl={getImageUrl(approvedModel.url)} speciesName={species.common_name} />
                ) : selectedPhoto ? (
                  <SpeciesPhotoParallax
                    src={getImageUrl(selectedPhoto)}
                    alt={species.common_name}
                    category={species.category_name}
                    status={species.conservation_status}
                  />
                ) : (
                  <div className="text-center text-stone-500 p-8 min-h-[360px] flex flex-col items-center justify-center">
                    <Leaf className="w-16 h-16 text-emerald-800/60 mx-auto mb-2" />
                    <p className="text-xs uppercase tracking-widest font-mono">No Specimen Visual Available</p>
                  </div>
                )}
              </div>

              {/* Bottom Viewer Caption Bar matching mockup */}
              <div className="bg-black/60 backdrop-blur-md py-2.5 px-4 flex items-center justify-between text-xs text-stone-300 border-t border-white/10">
                <span className="flex items-center gap-1.5 font-medium">
                  {viewMode === '3d' && approvedModel ? '✋ Drag to rotate • Scroll to zoom' : 'High-definition field photograph'}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {approvedModel ? '.GLB 3D Ready' : 'Field Plate'}
                </span>
              </div>
            </div>

            {/* Photo Thumbnails if multiple photos */}
            {species.photos && species.photos.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {species.photos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPhoto(p.url);
                      setViewMode('photo');
                    }}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition ${
                      selectedPhoto === p.url && viewMode === 'photo'
                        ? 'border-emerald-500 shadow-md scale-105'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={getImageUrl(p.url)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Tabs Matching Mockup */}
            <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: '🌿' },
                { id: 'gallery', label: 'Gallery', icon: '🖼️' },
                { id: 'conservation', label: 'Conservation', icon: '🛡️' },
                { id: 'related', label: 'Related Species', icon: '🔗' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#1b4332] text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Body Content */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Physical Characteristics Card */}
                  <div>
                    <h4 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600" /> Physical Characteristics
                    </h4>
                    <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                      {species.description ? (
                        species.description.split('.')[0] + '.'
                      ) : (
                        `Documented specimen characterized by specialized adaptations to its natural habitat in ${species.location || 'regional ecosystems'}.`
                      )}
                    </p>
                  </div>

                  {/* Conservation Status Alert Box matching mockup */}
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">
                        Conservation Status: {species.conservation_status || 'Monitored'}
                      </h4>
                      <p className="text-xs sm:text-sm text-rose-700 mt-1 leading-relaxed">
                        {species.conservation_status === 'Critically Endangered' || species.conservation_status === 'Endangered'
                          ? 'This species faces an extremely high risk of extinction in the wild due to habitat destruction, deforestation, and human encroachment. Protected under national biodiversity wildlife legislation.'
                          : `Currently cataloged under ${species.conservation_status || 'field survey'} status. Continuous field monitoring is maintained to safeguard local population densities and undisturbed nesting grounds.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <h4 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Photographic Documentation
                  </h4>
                  {species.photos && species.photos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {species.photos.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedPhoto(p.url); setViewMode('photo'); }}
                          className="aspect-square rounded-xl overflow-hidden border border-stone-200 cursor-pointer hover:shadow-md hover:scale-102 transition"
                        >
                          <img src={getImageUrl(p.url)} alt={p.caption || ''} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-xs italic">No additional photographs available for this record.</p>
                  )}
                </div>
              )}

              {activeTab === 'conservation' && (
                <div className="space-y-4">
                  <h4 className="font-display text-base font-bold text-stone-900">Habitat Preservation & Ethics</h4>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Preserving this species requires rigorous protection of its native biosphere in {species.location || 'regional forest lands'}. Community-led education, sustainable land management, and scientific monitoring form the cornerstones of its ongoing survival.
                  </p>
                </div>
              )}

              {activeTab === 'related' && (
                <div className="space-y-4">
                  <h4 className="font-display text-base font-bold text-stone-900">Related Species in {species.category_name}</h4>
                  {relatedSpecies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {relatedSpecies.map(r => (
                        <Link
                          key={r.id}
                          to={`/explore/${r.id}`}
                          className="p-3 bg-stone-50 hover:bg-emerald-50 rounded-2xl border border-stone-200 transition flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-xl bg-stone-200 overflow-hidden shrink-0">
                            {r.cover_photo_url && (
                              <img src={getImageUrl(r.cover_photo_url)} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">{r.common_name}</p>
                            <p className="text-[10px] text-stone-500 italic truncate">{r.scientific_name}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-xs italic">No other published species in this category yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Taxonomy Grid + Info Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${getStatusBadge(species.conservation_status)}`}>
                  {species.conservation_status || 'Documented'}
                </span>

                <span className="text-xs text-stone-400 font-mono">
                  Catalog #{species.id}
                </span>
              </div>

              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-black text-stone-900 leading-tight">
                  {species.common_name}
                </h1>
                {species.scientific_name && (
                  <p className="font-editorial italic text-stone-500 text-lg sm:text-xl mt-1">
                    {species.scientific_name}
                  </p>
                )}
              </div>

              {/* Scientific Taxonomy Details Grid Matching Mockup */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-3 font-mono">
                  Scientific Classification
                </h4>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span>🐾</span>
                    <span className="text-stone-500">Kingdom:</span>
                    <strong className="text-stone-800 font-semibold">{kingdom}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🌱</span>
                    <span className="text-stone-500">Genus:</span>
                    <strong className="text-stone-800 font-semibold italic">{genus}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🪶</span>
                    <span className="text-stone-500">Phylum:</span>
                    <strong className="text-stone-800 font-semibold">{phylum}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🔬</span>
                    <span className="text-stone-500">Species:</span>
                    <strong className="text-stone-800 font-semibold italic truncate">
                      {species.scientific_name || 'N/A'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🦅</span>
                    <span className="text-stone-500">Class:</span>
                    <strong className="text-stone-800 font-semibold">{cls}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🏷️</span>
                    <span className="text-stone-500">Category:</span>
                    <strong className="text-stone-800 font-semibold">{species.category_name || 'General'}</strong>
                  </div>
                </div>
              </div>

              {/* Overview Description */}
              {species.description && (
                <div className="pt-2">
                  <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
                    {species.description}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar Info Cards Matching Mockup */}
            {/* Card 1: Habitat & Distribution */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-bold text-sm sm:text-base text-stone-900">
                  Habitat & Distribution
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                  {species.habitat || 'Native tropical biosphere with specialized canopy and riverine forest adaptations.'}
                </p>
                {species.location && (
                  <p className="text-xs font-semibold text-emerald-800 mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Recorded in: {species.location}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Card 2: Diet & Ecological Role */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-bold text-sm sm:text-base text-stone-900">
                  Diet & Ecological Niche
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                  {isPlant
                    ? 'Autotrophic organism serving as a vital primary producer and foundation for local wildlife pollinators and soil stabilization.'
                    : 'Acts as a critical species within the regional food web, regulating insect and prey populations while signaling environmental balance.'}
                </p>
              </div>
            </div>

            {/* Card 3: Interesting Facts */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-display font-bold text-sm sm:text-base text-stone-900">
                  Key Significance
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
                  Documented during the natural sciences field assessment as an authentic bio-indicator of regional forest health and environmental resilience.
                </p>
              </div>
            </div>

            {/* Bottom Action Buttons Matching Mockup */}
            <div className="pt-2">
              {/* Download Species Info Button */}
              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1b4332] hover:bg-[#2d6a4f] text-white py-3.5 px-5 rounded-2xl font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Dossier Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Species Info</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

