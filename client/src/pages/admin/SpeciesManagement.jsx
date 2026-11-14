import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Star,
  Trash2,
  Edit,
  Leaf,
  LayoutGrid,
  List as ListIcon,
  Box,
  Image as ImageIcon,
  MapPin
} from 'lucide-react';
import { api, getImageUrl } from '../../utils/api.js';
import { Toast, showError, confirmAction } from '../../utils/alert.js';
import SpeciesFormModal from './SpeciesFormModal.jsx';

export default function SpeciesManagement() {
  const [speciesList, setSpeciesList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [specRes, catRes] = await Promise.all([
        api.get('/api/species?status=all'),
        api.get('/api/categories')
      ]);
      setSpeciesList(specRes.species || []);
      setCategories(catRes.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = async (id) => {
    try {
      const res = await api.put(`/api/species/${id}/publish`);
      if (res.species) {
        setSpeciesList(prev => prev.map(s => s.id === id ? { ...s, ...res.species } : s));
      } else {
        setSpeciesList(prev => prev.map(s => s.id === id ? { ...s, is_published: s.is_published ? 0 : 1 } : s));
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle publication state');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const res = await api.put(`/api/species/${id}/feature`);
      if (res.species) {
        setSpeciesList(prev => prev.map(s => s.id === id ? { ...s, ...res.species } : s));
      } else {
        setSpeciesList(prev => prev.map(s => s.id === id ? { ...s, is_featured: s.is_featured ? 0 : 1 } : s));
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle featured state');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirmAction({
      title: `Delete "${name}"?`,
      text: 'This will delete the specimen, its photo records, and 3D models. This action cannot be undone.',
      confirmText: 'Yes, Delete'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/species/${id}`);
      Toast.fire({ icon: 'success', title: 'Species deleted successfully' });
      setSpeciesList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      showError('Delete Failed', err.message || 'Failed to delete species');
    }
  };

  const openCreate = () => {
    setEditingSpecies(null);
    setModalOpen(true);
  };

  const openEdit = (sp) => {
    setEditingSpecies(sp);
    setModalOpen(true);
  };

  const filteredSpecies = speciesList.filter(s => {
    const matchesSearch = !searchTerm ||
      s.common_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || s.category_id?.toString() === categoryFilter.toString();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Species Management</h1>
          <p className="font-editorial italic text-forest/60 text-sm mt-0.5">
            Add, update, publish, and curate biodiversity observations
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Species
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-forest/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-forest/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-forest/15 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-paper/50"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-forest/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-paper/50 text-forest font-medium"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-cream/70 p-1 rounded-xl shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-forest shadow-xs' : 'text-forest/50 hover:text-forest'}`}
            title="Table View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-forest shadow-xs' : 'text-forest/50 hover:text-forest'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center">
          <Leaf className="w-10 h-10 text-sage animate-spin mx-auto mb-3" />
          <p className="text-forest/60 text-sm">Loading species list...</p>
        </div>
      ) : filteredSpecies.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-forest/10 p-8 shadow-sm">
          <Leaf className="w-14 h-14 text-sage/30 mx-auto mb-3" />
          <h3 className="font-display text-2xl font-bold text-forest mb-1">No Species Records Found</h3>
          <p className="text-forest/50 text-xs sm:text-sm max-w-sm mx-auto mb-6">
            {searchTerm || categoryFilter
              ? 'No species matched your search criteria.'
              : 'Your database is currently empty. Add your first biodiversity species record!'}
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-sage hover:bg-sage-dark text-cream px-5 py-2.5 rounded-full text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Add First Species
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl shadow-sm border border-forest/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream/40 border-b border-forest/10 text-xs uppercase text-forest/70 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Species</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Publication</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/5">
                {filteredSpecies.map(sp => (
                  <tr key={sp.id} className="hover:bg-cream/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-sage/20 shrink-0 overflow-hidden border border-forest/10">
                          {sp.cover_photo_url ? (
                            <img src={getImageUrl(sp.cover_photo_url)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sage/50">
                              <Leaf className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-forest text-sm flex items-center gap-2">
                            <span>{sp.common_name}</span>
                            {sp.is_featured ? (
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            ) : null}
                          </div>
                          <div className="font-editorial italic text-xs text-forest/50">
                            {sp.scientific_name || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-forest/80">
                      <span className="px-2.5 py-1 rounded-full bg-forest/5 border border-forest/10">
                        {sp.category_name || 'Uncategorized'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-forest/70">
                      {sp.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-earth shrink-0" />
                          <span className="truncate max-w-[140px]">{sp.location}</span>
                        </span>
                      ) : '—'}
                    </td>

                    <td className="py-4 px-4 text-xs">
                      {sp.conservation_status ? (
                        <span className="px-2 py-0.5 rounded-full bg-sage/20 text-forest font-medium text-[11px]">
                          {sp.conservation_status}
                        </span>
                      ) : '—'}
                    </td>

                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleTogglePublish(sp.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          sp.is_published
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {sp.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{sp.is_published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggleFeatured(sp.id)}
                        title={sp.is_featured ? 'Remove from featured' : 'Mark as featured'}
                        className={`p-2 rounded-lg transition ${
                          sp.is_featured
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-forest/30 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${sp.is_featured ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => openEdit(sp)}
                        className="p-2 rounded-lg text-forest/60 hover:text-forest hover:bg-cream/60 transition"
                        title="Edit Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(sp.id, sp.common_name)}
                        className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        title="Delete Species"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecies.map(sp => (
            <div
              key={sp.id}
              className="bg-white rounded-3xl overflow-hidden border border-forest/10 shadow-sm flex flex-col justify-between"
            >
              <div className="aspect-[4/3] bg-sage/20 relative overflow-hidden">
                {sp.cover_photo_url ? (
                  <img src={getImageUrl(sp.cover_photo_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sage/40">
                    <Leaf className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-forest/80 backdrop-blur-md text-cream text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    {sp.category_name || 'Uncategorized'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggleFeatured(sp.id)}
                    className={`p-1.5 rounded-full shadow-md transition ${
                      sp.is_featured ? 'bg-amber-400 text-white' : 'bg-black/40 text-white/80 hover:text-white'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${sp.is_featured ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-forest">{sp.common_name}</h3>
                  <p className="font-editorial italic text-xs text-forest/60 mt-0.5">
                    {sp.scientific_name || '—'}
                  </p>
                  {sp.location && (
                    <p className="text-xs text-forest/60 mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-earth shrink-0" /> {sp.location}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-forest/10 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(sp.id)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      sp.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {sp.is_published ? 'Published' : 'Draft'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(sp)}
                      className="p-1.5 text-forest/60 hover:text-forest transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sp.id, sp.common_name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Species Create / Edit Modal */}
      {modalOpen && (
        <SpeciesFormModal
          species={editingSpecies}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

