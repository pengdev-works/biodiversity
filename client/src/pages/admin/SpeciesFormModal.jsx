import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Star, Image as ImageIcon, Box, AlertCircle, Check } from 'lucide-react';
import { api, getImageUrl } from '../../utils/api.js';
import { showError, confirmAction } from '../../utils/alert.js';

const IUCN_STATUSES = [
  'Least Concern',
  'Near Threatened',
  'Vulnerable',
  'Endangered',
  'Critically Endangered',
  'Data Deficient',
  'Not Evaluated'
];

export default function SpeciesFormModal({ species, categories, onClose, onSuccess }) {
  const isEditing = !!species?.id;

  const [form, setForm] = useState({
    common_name: '',
    scientific_name: '',
    category_id: '',
    description: '',
    habitat: '',
    conservation_status: 'Least Concern',
    location: '',
    is_published: 0,
    is_featured: 0
  });

  const [photos, setPhotos] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (species) {
      setForm({
        common_name: species.common_name || '',
        scientific_name: species.scientific_name || '',
        category_id: species.category_id || '',
        description: species.description || '',
        habitat: species.habitat || '',
        conservation_status: species.conservation_status || 'Least Concern',
        location: species.location || '',
        is_published: species.is_published ? 1 : 0,
        is_featured: species.is_featured ? 1 : 0
      });

      // Load existing photos if editing
      if (species.id) {
        api.get(`/api/photos/species/${species.id}`)
          .then(res => setPhotos(res.photos || []))
          .catch(() => setPhotos([]));
      }
    }
  }, [species]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.common_name.trim()) {
      setError('Common name is required');
      return;
    }
    if (!form.scientific_name.trim()) {
      setError('Scientific name is required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let targetId = species?.id;
      if (isEditing) {
        await api.put(`/api/species/${species.id}`, form);
      } else {
        const createRes = await api.post('/api/species', form);
        targetId = createRes.species?.id;
      }

      // If pending photos were selected during creation, upload them now
      if (pendingFiles.length > 0 && targetId) {
        const formData = new FormData();
        for (let i = 0; i < pendingFiles.length; i++) {
          formData.append('photos', pendingFiles[i]);
        }
        await api.upload(`/api/photos/species/${targetId}`, formData);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save species details');
    } finally {
      setLoading(false);
    }
  };

  const handlePendingFileSelection = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(prev => [...prev, ...files]);
  };

  const removePendingFile = (idx) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !species?.id) return;

    setPhotoUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    try {
      const res = await api.upload(`/api/photos/species/${species.id}`, formData);
      setPhotos(res.photos || []);
    } catch (err) {
      showError('Upload Failed', err.message || 'Failed to upload photos');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSetCover = async (photoId) => {
    try {
      await api.put(`/api/photos/${photoId}/cover`);
      setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photoId ? 1 : 0 })));
    } catch (err) {
      showError('Cover Error', err.message || 'Failed to set cover photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const confirmed = await confirmAction({
      title: 'Delete Photo?',
      text: 'This photo will be permanently removed.',
      confirmText: 'Yes, Delete',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/photos/${photoId}`);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      showError('Delete Failed', err.message || 'Failed to delete photo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-paper rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-forest/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-forest text-cream flex items-center justify-between border-b border-forest-light shrink-0">
          <div>
            <h2 className="font-display text-2xl font-bold">
              {isEditing ? `Edit: ${species.common_name}` : 'Document New Species'}
            </h2>
            <p className="text-xs text-cream/70 font-editorial italic mt-0.5">
              Fill in the field survey information and taxonomy details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-forest-light text-cream/70 hover:text-cream transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="species-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                  Common Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.common_name}
                  onChange={e => setForm({ ...form, common_name: e.target.value })}
                  placeholder="e.g. Philippine Eagle"
                  className="w-full border border-forest/20 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                  Scientific Name
                </label>
                <input
                  type="text"
                  value={form.scientific_name}
                  onChange={e => setForm({ ...form, scientific_name: e.target.value })}
                  placeholder="e.g. Pithecophaga jefferyi"
                  className="w-full border border-forest/20 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest italic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border border-forest/20 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest font-medium"
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                  IUCN Conservation Status
                </label>
                <select
                  value={form.conservation_status}
                  onChange={e => setForm({ ...form, conservation_status: e.target.value })}
                  className="w-full border border-forest/20 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest font-medium"
                >
                  {IUCN_STATUSES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                  Documented Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Mount Apo, Mindanao"
                  className="w-full border border-forest/20 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                  Habitat
                </label>
                <input
                  type="text"
                  value={form.habitat}
                  onChange={e => setForm({ ...form, habitat: e.target.value })}
                  placeholder="e.g. Primary lowland rainforest"
                  className="w-full border border-forest/20 rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1.5">
                Description & Scientific Notes
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed species observation, physical features, ecological behavior..."
                className="w-full border border-forest/20 rounded-xl p-4 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest leading-relaxed font-editorial"
              />
            </div>

            {/* Publication and Featured Checkboxes */}
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!form.is_published}
                  onChange={e => setForm({ ...form, is_published: e.target.checked ? 1 : 0 })}
                  className="rounded text-sage focus:ring-sage w-4 h-4"
                />
                <span className="text-sm font-semibold text-forest">Publish immediately to public site</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!form.is_featured}
                  onChange={e => setForm({ ...form, is_featured: e.target.checked ? 1 : 0 })}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span className="text-sm font-semibold text-forest">Feature on Homepage</span>
              </label>
            </div>
          </form>

          {/* Photo Management Section */}
          <div className="pt-6 border-t border-forest/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-forest text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sage" /> Species Photographs
                </h3>
                <p className="text-xs text-forest/50">
                  {isEditing
                    ? 'Upload field photos and select which one serves as primary cover'
                    : 'Attach field photos now; they will be uploaded when you create this record'}
                </p>
              </div>

              {isEditing ? (
                <label className="inline-flex items-center gap-2 bg-sage hover:bg-sage-dark text-cream px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{photoUploading ? 'Uploading...' : 'Upload Photos'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={photoUploading}
                    className="hidden"
                  />
                </label>
              ) : (
                <label className="inline-flex items-center gap-2 bg-sage hover:bg-sage-dark text-cream px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Photos ({pendingFiles.length})</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePendingFileSelection}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {isEditing ? (
              photos.length === 0 ? (
                <div className="p-6 border border-dashed border-forest/20 rounded-2xl text-center bg-white text-xs text-forest/50">
                  No photographs uploaded yet for this species. Use the upload button above.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map(p => (
                    <div
                      key={p.id}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 bg-forest-dark group ${
                        p.is_cover ? 'border-earth shadow-sm' : 'border-transparent'
                      }`}
                    >
                      <img src={getImageUrl(p.url)} alt="" className="w-full h-full object-cover" />
                      {p.is_cover && (
                        <span className="absolute top-2 left-2 bg-earth text-cream text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          COVER
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        {!p.is_cover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(p.id)}
                            className="p-1.5 rounded bg-white/20 hover:bg-white/40 text-cream text-xs"
                            title="Set as Cover"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(p.id)}
                          className="p-1.5 rounded bg-rose-600/80 hover:bg-rose-600 text-cream"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              pendingFiles.length === 0 ? (
                <div className="p-6 border border-dashed border-forest/20 rounded-2xl text-center bg-white text-xs text-forest/50">
                  Optional: Attach specimen field photos now or upload later in the Photo Library.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {pendingFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-forest/20 bg-forest-dark group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-cream text-[9px] truncate px-1 py-0.5 rounded">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/80 hover:bg-rose-600 text-cream"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-cream/50 border-t border-forest/10 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-forest/70 hover:text-forest transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="species-form"
            disabled={loading}
            className="bg-forest hover:bg-forest-light text-cream px-6 py-2.5 rounded-full text-xs font-semibold transition shadow-sm disabled:opacity-60"
          >
            {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Record'}
          </button>
        </div>
      </div>
    </div>
  );
}

