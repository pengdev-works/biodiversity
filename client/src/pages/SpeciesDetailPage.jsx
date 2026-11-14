import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Shield, TreePine, Leaf, Box, Image as ImageIcon, Sparkles } from 'lucide-react';
import ThreeDViewer from '../components/ThreeDViewer.jsx';

export default function SpeciesDetailPage() {
  const { id } = useParams();
  const [species, setSpecies] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/species/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Species not found or unpublished');
        return res.json();
      })
      .then(data => {
        setSpecies(data.species);
        if (data.species.photos && data.species.photos.length > 0) {
          const cover = data.species.photos.find(p => p.is_cover) || data.species.photos[0];
          setSelectedPhoto(cover.url);
        } else if (data.species.cover_photo_url) {
          setSelectedPhoto(data.species.cover_photo_url);
        }
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
          <p className="text-forest/60 text-sm font-medium">Opening field dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !species) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Leaf className="w-16 h-16 text-sage/40 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold text-forest mb-2">Record Not Found</h2>
          <p className="text-forest/60 mb-6 text-sm">
            This biodiversity species either does not exist or has not been published yet.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 bg-forest text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-forest-light transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const approvedModel = species.models && species.models.length > 0 ? species.models[0] : null;

  const getStatusBadge = (status) => {
    const map = {
      'Least Concern': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Near Threatened': 'bg-lime-100 text-lime-800 border-lime-300',
      'Vulnerable': 'bg-amber-100 text-amber-800 border-amber-300',
      'Endangered': 'bg-orange-100 text-orange-800 border-orange-300',
      'Critically Endangered': 'bg-rose-100 text-rose-800 border-rose-300',
      'Data Deficient': 'bg-stone-100 text-stone-700 border-stone-300',
    };
    return map[status] || 'bg-sage/20 text-forest border-sage/30';
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Top Banner Navigation */}
      <div className="bg-forest text-cream/80 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm text-cream hover:text-sage transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Species Catalog
          </Link>
          {species.category_name && (
            <span className="text-xs uppercase tracking-widest text-sage font-semibold">
              {species.category_name}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* Header Title Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-forest">
              {species.common_name}
            </h1>
            {species.conservation_status && (
              <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(species.conservation_status)}`}>
                IUCN: {species.conservation_status}
              </span>
            )}
          </div>
          {species.scientific_name && (
            <p className="font-editorial italic text-forest/70 text-2xl">
              {species.scientific_name}
            </p>
          )}
        </div>

        {/* Media & Key Facts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Visuals Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Image Display */}
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-forest-dark relative shadow-xl border border-forest/10">
              {selectedPhoto ? (
                <img
                  src={selectedPhoto}
                  alt={species.common_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-cream/40">
                  <Leaf className="w-16 h-16 text-sage/40 mb-2" />
                  <p className="text-sm">No photo available</p>
                </div>
              )}
            </div>

            {/* Photo Thumbnails */}
            {species.photos && species.photos.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {species.photos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPhoto(p.url)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      selectedPhoto === p.url ? 'border-earth shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Interactive 3D Model Section */}
            {approvedModel && (
              <div className="bg-forest-dark rounded-2xl p-6 text-cream shadow-xl border border-forest/20 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-sage" />
                    <h3 className="font-display text-xl font-bold">Interactive 3D Specimen</h3>
                  </div>
                  <span className="text-xs text-cream/60 uppercase tracking-widest font-mono">
                    {approvedModel.format?.toUpperCase()} FORMAT
                  </span>
                </div>
                <p className="text-cream/70 text-xs sm:text-sm mb-4">
                  Rotate, inspect, and explore this specimen from all angles using touch or mouse controls.
                </p>
                <div className="rounded-xl overflow-hidden border border-cream/10">
                  <ThreeDViewer modelUrl={approvedModel.url} className="w-full h-[400px]" />
                </div>
              </div>
            )}
          </div>

          {/* Species Dossier / Field Notes Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Facts Card */}
            <div className="bg-cream rounded-2xl p-6 shadow-sm border border-forest/10 space-y-4">
              <h3 className="font-display text-xl font-bold text-forest flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-earth" /> Field Notes
              </h3>

              {species.location && (
                <div className="flex items-start gap-3 pt-2">
                  <MapPin className="w-5 h-5 text-earth shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-forest/50 tracking-wider">Documented Location</h4>
                    <p className="text-sm font-medium text-forest">{species.location}</p>
                  </div>
                </div>
              )}

              {species.habitat && (
                <div className="flex items-start gap-3 pt-2 border-t border-forest/10">
                  <TreePine className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-forest/50 tracking-wider">Natural Habitat</h4>
                    <p className="text-sm font-medium text-forest">{species.habitat}</p>
                  </div>
                </div>
              )}

              {species.conservation_status && (
                <div className="flex items-start gap-3 pt-2 border-t border-forest/10">
                  <Shield className="w-5 h-5 text-forest/70 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs uppercase font-semibold text-forest/50 tracking-wider">Conservation Status</h4>
                    <p className="text-sm font-medium text-forest">{species.conservation_status}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-forest/10">
              <h3 className="font-display text-2xl font-bold text-forest mb-4">
                Scientific Overview
              </h3>
              {species.description ? (
                <p className="font-editorial text-forest/80 leading-relaxed text-base drop-cap whitespace-pre-line">
                  {species.description}
                </p>
              ) : (
                <p className="text-forest/40 italic text-sm">
                  No descriptive overview provided yet for this species.
                </p>
              )}
            </div>

            {/* Read in Digital Magazine CTA */}
            <div className="bg-forest text-cream rounded-2xl p-6 shadow-md flex items-center justify-between">
              <div>
                <h4 className="font-display text-lg font-bold">Featured in Magazine</h4>
                <p className="text-xs text-cream/70 mt-1">Read the complete editorial feature in our digital flipbook.</p>
              </div>
              <Link
                to="/magazine"
                className="bg-earth hover:bg-earth-dark text-cream text-xs font-semibold px-4 py-2.5 rounded-full transition shadow-sm whitespace-nowrap ml-4"
              >
                Open Flipbook
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

