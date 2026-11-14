import { useState, useEffect } from 'react';
import { Image as ImageIcon, Trash2, Star, Upload, Leaf, Filter } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api.js';

export default function PhotoLibrary() {
  const [photos, setPhotos] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [photosRes, specRes] = await Promise.all([
        api.get(selectedSpeciesId ? `/api/photos/species/${selectedSpeciesId}` : '/api/photos'),
        api.get('/api/species?status=all')
      ]);
      setPhotos(photosRes.photos || []);
      setSpeciesList(specRes.species || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSpeciesId]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!selectedSpeciesId) {
      alert('Please select a species from the dropdown before uploading photos');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    try {
      await api.upload(`/api/photos/species/${selectedSpeciesId}`, formData);
      loadData();
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = async (photoId) => {
    try {
      await api.put(`/api/photos/${photoId}/cover`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to set cover');
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Delete this photograph?')) return;
    try {
      await api.delete(`/api/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      alert(err.message || 'Failed to delete photo');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Photo Library</h1>
          <p className="font-editorial italic text-forest/60 text-sm mt-0.5">
            Manage high-resolution field photography and publication cover assets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSpeciesId}
            onChange={e => setSelectedSpeciesId(e.target.value)}
            className="border border-forest/20 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
          >
            <option value="">Filter: All Species</option>
            {speciesList.map(s => (
              <option key={s.id} value={s.id}>{s.common_name}</option>
            ))}
          </select>

          <label className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Photos'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Leaf className="w-10 h-10 text-sage animate-spin mx-auto mb-2" />
          <p className="text-forest/60 text-xs">Loading photography assets...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="py-24 bg-white rounded-3xl border border-forest/10 text-center p-8 shadow-sm">
          <ImageIcon className="w-16 h-16 text-sage/30 mx-auto mb-3" />
          <h3 className="font-display text-2xl font-bold text-forest mb-1">No Photographs Uploaded</h3>
          <p className="text-forest/50 text-xs max-w-sm mx-auto mb-4">
            Select a species and click &quot;Upload Photos&quot; to begin populating your visual library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl overflow-hidden border border-forest/10 shadow-xs group flex flex-col justify-between"
            >
              <div className="aspect-square bg-forest-dark relative overflow-hidden">
                <img src={getImageUrl(p.url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {p.is_cover ? (
                  <span className="absolute top-2 left-2 bg-earth text-cream text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    COVER
                  </span>
                ) : null}
              </div>

              <div className="p-3 flex items-center justify-between text-xs bg-cream/30">
                <span className="text-forest/60 truncate font-mono text-[10px]">
                  {p.species_common_name || `ID #${p.species_id}`}
                </span>
                <div className="flex items-center gap-1">
                  {!p.is_cover && (
                    <button
                      onClick={() => handleSetCover(p.id)}
                      className="p-1 rounded text-forest/40 hover:text-amber-500 transition"
                      title="Set as species cover"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1 rounded text-rose-500 hover:text-rose-700 transition"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

