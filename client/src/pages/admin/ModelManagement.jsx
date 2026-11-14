import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Eye,
  Check,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  X,
  Layers
} from 'lucide-react';
import { api } from '../../utils/api.js';
import ThreeDViewer from '../../components/ThreeDViewer.jsx';

export default function ModelManagement() {
  const [models, setModels] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const glbInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modelsRes, specRes] = await Promise.all([
        api.get('/api/models'),
        api.get('/api/species?status=all')
      ]);
      setModels(modelsRes.models || []);
      setSpeciesList(specRes.species || []);
      if (!selectedSpeciesId && specRes.species?.length > 0) {
        setSelectedSpeciesId(specRes.species[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle direct pre-made GLB upload
  const handleGlbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedSpeciesId) {
      alert('Please select a target species before uploading a GLB file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('model', file);

    try {
      const res = await api.upload(`/api/models/species/${selectedSpeciesId}`, formData);
      setUploadSuccess('3D model (.glb) uploaded and attached successfully!');
      setTimeout(() => setUploadSuccess(''), 5000);
      await loadData();
      if (res?.model?.url) {
        setPreviewUrl(res.model.url);
      }
    } catch (err) {
      alert(err.message || 'GLB upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/models/${id}/approve`);
      setModels(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' } : m));
    } catch (err) {
      alert(err.message || 'Failed to approve model');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this 3D model asset?')) return;
    try {
      await api.delete(`/api/models/${id}`);
      setModels(prev => prev.filter(m => m.id !== id));
      if (previewUrl && models.find(m => m.id === id)?.url === previewUrl) {
        setPreviewUrl(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete model');
    }
  };

  const selectedSpecies = speciesList.find(s => String(s.id) === String(selectedSpeciesId));
  const speciesHasModel = models.some(m => String(m.species_id) === String(selectedSpeciesId));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2">
      {/* Top Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-forest/10">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest tracking-tight">
            3D Specimen Models
          </h1>
          <p className="font-editorial italic text-forest/70 text-sm mt-0.5">
            Upload images to sculpt interactive 3D models or manage existing 3D GLB assets
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Target Species Selector */}
          <select
            value={selectedSpeciesId}
            onChange={e => setSelectedSpeciesId(e.target.value)}
            className="w-full sm:w-auto border border-forest/20 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest shadow-sm min-h-[42px]"
          >
            <option value="">Select target species...</option>
            {speciesList.map(s => (
              <option key={s.id} value={s.id}>
                {s.common_name} {models.some(m => m.species_id === s.id) ? '✓ (3D)' : ''}
              </option>
            ))}
          </select>

          {/* Primary Upload GLB/GLTF Button */}
          <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-md hover:scale-[1.02] min-h-[42px]">
            <Upload className="w-4 h-4 text-earth-light shrink-0" />
            <span>{uploading ? 'Uploading 3D Model...' : 'Upload GLB/GLTF Model'}</span>
            <input
              ref={glbInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={handleGlbUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-3 text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* 3D Preview Inspector */}
      {previewUrl && (
        <div className="bg-forest-dark rounded-3xl p-6 text-cream shadow-xl border border-forest/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold flex items-center gap-2">
                <Box className="w-5 h-5 text-sage" /> Interactive 3D Model Inspector
              </h3>
              <p className="text-xs text-cream/60 mt-0.5">
                Drag to rotate 360°, scroll to zoom in/out, and inspect the physical 3D contours.
              </p>
            </div>
            <button
              onClick={() => setPreviewUrl(null)}
              className="text-xs text-cream/70 hover:text-cream px-3 py-1.5 rounded-full bg-cream/10 hover:bg-cream/20 transition font-medium"
            >
              Close Inspector
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-cream/10 bg-black/40">
            <ThreeDViewer modelUrl={previewUrl} className="w-full h-[480px]" />
          </div>
        </div>
      )}

      {/* Selected Species Quick Action Banner */}
      {selectedSpecies && !speciesHasModel && (
        <div className="bg-gradient-to-r from-forest/5 via-earth/10 to-sage/10 rounded-3xl p-6 border border-earth/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-earth/20 text-earth flex items-center justify-center shrink-0 mt-0.5">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-forest">
                Attach 3D Specimen Model for &ldquo;{selectedSpecies.common_name}&rdquo;
              </h4>
              <p className="text-xs text-forest/70 max-w-xl mt-1 leading-relaxed">
                Upload a 3D model file (<code>.glb</code> or <code>.gltf</code>) of this species. It will be interactive with 360° orbit rotation in the public catalog and digital magazine!
              </p>
            </div>
          </div>
          <label className="bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition shadow-md flex items-center gap-2 self-start md:self-center cursor-pointer">
            <Upload className="w-4 h-4 text-earth-light" />
            <span>{uploading ? 'Uploading...' : 'Upload GLB/GLTF'}</span>
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleGlbUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Models Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-forest/10 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-forest/50">
            <Leaf className="w-8 h-8 text-sage animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading 3D model assets...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="p-16 text-center text-forest/50">
            <Box className="w-14 h-14 text-sage/40 mx-auto mb-3" />
            <p className="font-display text-lg font-bold text-forest mb-1">No 3D Models Uploaded Yet</p>
            <p className="text-xs text-forest/60 max-w-md mx-auto mb-6 leading-relaxed">
              Select a species above and upload a <code>.glb</code> or <code>.gltf</code> model file to enable 3D specimen inspection.
            </p>
            {selectedSpeciesId && (
              <label className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-md cursor-pointer">
                <Upload className="w-4 h-4 text-earth-light" />
                <span>Upload GLB/GLTF File</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleGlbUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream/40 border-b border-forest/10 text-xs uppercase text-forest/70 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Model Asset</th>
                  <th className="py-3.5 px-4">Associated Species</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/5">
                {models.map(m => (
                  <tr key={m.id} className="hover:bg-cream/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-forest-dark text-sage flex items-center justify-center shrink-0">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-forest text-sm truncate max-w-[220px]">
                            {m.filename || '3D Specimen Model'}
                          </p>
                          <p className="text-[10px] text-forest/40 font-mono">
                            {m.url}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="text-xs font-semibold text-forest">
                        {m.species_common_name || `Species #${m.species_id}`}
                      </p>
                      {m.species_scientific_name && (
                        <p className="text-[11px] font-editorial italic text-forest/60">
                          {m.species_scientific_name}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-forest/10 text-forest font-bold">
                        {m.format}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-forest/60 font-mono">
                      {m.file_size ? `${(m.file_size / 1024).toFixed(1)} KB` : '—'}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        m.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{m.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setPreviewUrl(m.url)}
                        className="p-1.5 rounded-lg text-forest/70 hover:text-forest hover:bg-cream/60 transition inline-flex items-center gap-1 text-xs font-medium"
                        title="Preview in 3D Viewer"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Inspect</span>
                      </button>

                      {m.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(m.id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition"
                          title="Approve for public view"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        title="Delete Model"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
