import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, FolderOpen, Leaf, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api.js';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#758B70'
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/categories');
      setCategories(res.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError('');

    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, form);
      } else {
        await api.post('/api/categories', form);
      }
      setEditingId(null);
      setIsAdding(false);
      setForm({ name: '', description: '', color: '#758B70' });
      loadCategories();
    } catch (err) {
      setError(err.message || 'Failed to save category');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setIsAdding(true);
    setForm({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#758B70'
    });
  };

  const handleDelete = async (id, name, speciesCount = 0) => {
    const count = parseInt(speciesCount || 0, 10);
    if (count > 0) {
      alert(`Cannot delete category "${name}".\n\nThere are ${count} species currently assigned to this category. Please reassign those species or remove them before deleting this category.`);
      return;
    }
    if (!window.confirm(`Delete category "${name}"? Only categories without linked species can be deleted.`)) return;
    try {
      await api.delete(`/api/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((c, idx) => ({ id: c.id, sort_order: idx + 1 }));
    setCategories(updated);

    try {
      await api.put('/api/categories/reorder', reordered);
    } catch (err) {
      console.error('Failed to persist order:', err);
      loadCategories();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Taxonomic Categories</h1>
          <p className="font-editorial italic text-forest/60 text-sm mt-0.5">
            Organize biodiversity species into high-level categories (e.g. Flora, Avians, Herpetofauna)
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: '', description: '', color: '#758B70' });
              setIsAdding(true);
            }}
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inline Form */}
      {isAdding && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-forest/15 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-forest">
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h3>
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="text-forest/40 hover:text-forest"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Flora & Botanical"
                  className="w-full border border-forest/20 rounded-xl px-4 py-2 bg-paper/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-forest/20 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full border border-forest/20 rounded-xl px-3 py-2 bg-paper/50 text-xs font-mono text-forest"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of taxa included in this category"
                className="w-full border border-forest/20 rounded-xl px-4 py-2 bg-paper/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage text-forest"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="px-4 py-2 text-xs font-semibold text-forest/60 hover:text-forest transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-forest hover:bg-forest-light text-cream px-5 py-2 rounded-full text-xs font-semibold transition"
              >
                {editingId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category List */}
      <div className="bg-white rounded-3xl shadow-sm border border-forest/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-forest/50">
            <Leaf className="w-8 h-8 text-sage animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-forest/50">
            <FolderOpen className="w-12 h-12 text-sage/40 mx-auto mb-3" />
            <p className="font-medium text-sm">No categories defined</p>
            <p className="text-xs text-forest/40 mt-1">
              Click &quot;Add Category&quot; above to organize your biodiversity database.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-forest/5">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-cream/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || '#758B70' }}
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-forest text-sm flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.species_count !== undefined && (
                        <span className="text-[10px] font-mono bg-forest/10 text-forest px-2 py-0.5 rounded-full">
                          {cat.species_count} species
                        </span>
                      )}
                    </h3>
                    {cat.description && (
                      <p className="font-editorial italic text-xs text-forest/60 truncate mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded text-forest/40 hover:text-forest disabled:opacity-20 transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 rounded text-forest/40 hover:text-forest disabled:opacity-20 transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 rounded text-forest/60 hover:text-forest transition ml-1"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name, cat.species_count)}
                    className="p-1.5 rounded text-rose-500 hover:text-rose-700 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

