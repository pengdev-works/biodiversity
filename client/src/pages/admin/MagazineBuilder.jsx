import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  Leaf,
  Layers,
  Settings,
  X,
  ExternalLink,
  Sparkles,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { api, getImageUrl } from '../../utils/api.js';

const PAGE_TEMPLATES = [
  { type: 'cover', name: 'Front Cover Spread' },
  { type: 'toc', name: 'Table of Contents' },
  { type: 'intro', name: 'Editorial Introduction' },
  { type: 'species-feature', name: 'Species Hero Feature' },
  { type: 'species-detail', name: 'Species Field Notes & Details' },
  { type: 'gallery', name: 'Photographic Gallery Grid' },
  { type: 'back-cover', name: 'Back Cover Closing' },
  { type: 'blank', name: 'Custom Editorial Blank' },
];

export default function MagazineBuilder() {
  const [publications, setPublications] = useState([]);
  const [activePubId, setActivePubId] = useState(null);
  const [publication, setPublication] = useState(null);
  const [pages, setPages] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Modal states
  const [isCreatingPub, setIsCreatingPub] = useState(false);
  const [isAddingPage, setIsAddingPage] = useState(false);

  // New Publication Form
  const [pubForm, setPubForm] = useState({
    title: 'BIODIVERSITY',
    subtitle: 'An Interactive Journey Through Living Nature',
    edition: 'Vol. 1 — Inaugural Edition',
    volume: 'Special Publication',
    intro_title: 'Celebrating Earth’s Living Heritage',
    intro_body: 'Welcome to this digital edition showcasing the rich biodiversity and unique ecosystems documented across natural habitats.',
    cover_photo_url: ''
  });

  // New Page Form
  const [pageForm, setPageForm] = useState({
    template_type: 'species-feature',
    species_id: '',
    title: '',
    body: ''
  });

  const loadPublications = async () => {
    setLoading(true);
    try {
      const [pubsRes, specRes] = await Promise.all([
        api.get('/api/magazine/all'),
        api.get('/api/species?status=all')
      ]);
      const pubs = pubsRes.publications || [];
      setPublications(pubs);
      setSpeciesList(specRes.species || []);

      if (pubs.length > 0 && !activePubId) {
        setActivePubId(pubs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivePublication = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/api/magazine/${id}`);
      setPublication(res.publication);
      setPages(res.pages || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPublications();
  }, []);

  useEffect(() => {
    if (activePubId) {
      loadActivePublication(activePubId);
    }
  }, [activePubId]);

  const handleCreatePublication = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/magazine', pubForm);
      setIsCreatingPub(false);
      await loadPublications();
      if (res.publication?.id) {
        setActivePubId(res.publication.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to create publication');
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await api.put(`/api/magazine/${id}/publish`);
      await loadPublications();
      if (activePubId === id) {
        loadActivePublication(id);
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle publication');
    }
  };

  const handleDeletePublication = async (id) => {
    if (!window.confirm('Delete this publication edition and all its assembled pages?')) return;
    try {
      await api.delete(`/api/magazine/${id}`);
      setActivePubId(null);
      loadPublications();
    } catch (err) {
      alert(err.message || 'Failed to delete publication');
    }
  };

  const handleAddPage = async (e) => {
    e.preventDefault();
    if (!activePubId) return;

    let content = {};
    if (pageForm.species_id) {
      const sp = speciesList.find(s => s.id.toString() === pageForm.species_id.toString());
      if (sp) {
        content.species = sp;
      }
    }
    if (pageForm.title) content.title = pageForm.title;
    if (pageForm.body) content.body = pageForm.body;

    try {
      await api.post(`/api/magazine/${activePubId}/pages`, {
        template_type: pageForm.template_type,
        content_json: content
      });
      setIsAddingPage(false);
      setPageForm({ template_type: 'species-feature', species_id: '', title: '', body: '' });
      loadActivePublication(activePubId);
    } catch (err) {
      alert(err.message || 'Failed to add page');
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await api.delete(`/api/magazine/pages/${pageId}`);
      loadActivePublication(activePubId);
    } catch (err) {
      alert(err.message || 'Failed to delete page');
    }
  };

  const handleMovePage = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updated = [...pages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((p, idx) => ({
      id: p.id,
      sort_order: idx + 1,
      page_number: idx + 1
    }));

    setPages(updated);

    try {
      await api.put(`/api/magazine/${activePubId}/pages/reorder`, { pages: reordered });
    } catch (err) {
      console.error(err);
      loadActivePublication(activePubId);
    }
  };

  const handleAutoGenerate = async () => {
    if (!activePubId) return;
    if (!window.confirm('⚡ Auto-generate this issue?\n\nThis will assemble a complete flipbook spread (Editorial Cover, Table of Contents, Introduction, Species Hero Spreads, Taxonomic Dossiers, Photo Gallery, and Back Cover) directly from all published catalog species.')) return;
    setAutoGenerating(true);
    try {
      const res = await api.post(`/api/magazine/${activePubId}/auto-generate`);
      alert(res.message || 'Issue generated successfully!');
      loadActivePublication(activePubId);
    } catch (err) {
      alert(err.message || 'Failed to auto-generate issue');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activePubId) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.append('cover', file);
    try {
      const res = await api.upload(`/api/magazine/${activePubId}/cover`, formData);
      alert(res.message || 'Cover updated successfully');
      loadActivePublication(activePubId);
    } catch (err) {
      alert(err.message || 'Failed to upload cover image');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Magazine Builder</h1>
          <p className="font-editorial italic text-forest/60 text-sm mt-0.5">
            Assemble multi-page flipbook editions, curate editorial spreads, and control release states
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href="/magazine"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-cream hover:bg-cream-dark text-forest px-4 py-2 rounded-full text-xs font-semibold transition border border-forest/15 min-h-[38px]"
          >
            <Eye className="w-3.5 h-3.5" /> Read Live Flipbook
          </a>

          <button
            onClick={() => setIsCreatingPub(true)}
            className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2 rounded-full text-xs font-semibold transition shadow-sm min-h-[38px]"
          >
            <Plus className="w-4 h-4" /> New Edition
          </button>
        </div>
      </div>

      {/* Publications Selector Tabs */}
      {publications.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-forest/10">
          {publications.map(pub => (
            <button
              key={pub.id}
              onClick={() => setActivePubId(pub.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold shrink-0 transition flex items-center gap-2 border ${
                activePubId === pub.id
                  ? 'bg-forest text-cream border-forest shadow-sm'
                  : 'bg-white text-forest/70 border-forest/10 hover:bg-cream/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{pub.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                pub.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/20 text-cream/70'
              }`}>
                {pub.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Builder Work Area */}
      {loading ? (
        <div className="py-20 text-center">
          <Leaf className="w-10 h-10 text-sage animate-spin mx-auto mb-2" />
          <p className="text-forest/60 text-xs">Loading publications studio...</p>
        </div>
      ) : !publication ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-sm">
          <BookOpen className="w-16 h-16 text-sage/40 mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold text-forest mb-2">No Magazine Editions Yet</h2>
          <p className="text-forest/60 text-xs sm:text-sm max-w-sm mx-auto mb-6">
            Create your first digital biodiversity flipbook volume to arrange pages and publish for public readers.
          </p>
          <button
            onClick={() => setIsCreatingPub(true)}
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-6 py-2.5 rounded-full text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Create First Edition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Edition Settings & Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-forest/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-forest/50 font-bold">
                  Edition #{publication.id}
                </span>
                <button
                  onClick={() => handleTogglePublish(publication.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    publication.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {publication.status === 'published' ? 'Active / Published' : 'Draft Mode'}
                </button>
              </div>

              <div>
                <h3 className="font-display text-2xl font-bold text-forest">{publication.title}</h3>
                {publication.subtitle && (
                  <p className="font-editorial italic text-forest/60 text-xs mt-1">
                    {publication.subtitle}
                  </p>
                )}
                {publication.edition && (
                  <p className="text-earth text-xs font-semibold mt-2">
                    {publication.edition}
                  </p>
                )}
              </div>

              {/* Cover Photo Preview & Upload */}
              <div className="pt-3 border-t border-forest/10 space-y-2">
                <span className="text-[11px] font-semibold text-forest/70 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sage" /> Issue Cover Artwork
                </span>
                {publication.cover_photo_url ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-forest/15 bg-forest-dark group">
                    <img
                      src={getImageUrl(publication.cover_photo_url)}
                      alt={publication.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <label className="cursor-pointer bg-cream text-forest text-xs font-semibold px-3 py-1.5 rounded-full shadow hover:bg-white transition flex items-center gap-1.5">
                        <Upload className="w-3 h-3" />
                        <span>{coverUploading ? 'Uploading...' : 'Replace Cover'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          disabled={coverUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="border border-dashed border-forest/20 hover:border-earth bg-cream/40 hover:bg-cream p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center">
                    <Upload className="w-5 h-5 text-earth mb-1" />
                    <span className="text-xs font-semibold text-forest">
                      {coverUploading ? 'Uploading...' : 'Upload Cover Photo'}
                    </span>
                    <span className="text-[10px] text-forest/50">High-res vertical or landscape artwork</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={coverUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-4 border-t border-forest/10 flex items-center justify-between text-xs">
                <span className="text-forest/60">Total Pages: <strong>{pages.length}</strong></span>
                <button
                  onClick={() => handleDeletePublication(publication.id)}
                  className="text-rose-500 hover:text-rose-700 transition"
                >
                  Delete Edition
                </button>
              </div>
            </div>

            {/* Page Type Quick Guide */}
            <div className="bg-cream rounded-3xl p-6 border border-forest/10 space-y-3">
              <h4 className="font-display text-sm font-bold text-forest flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-earth" /> Available Page Templates
              </h4>
              <ul className="text-xs space-y-1.5 text-forest/70 font-editorial">
                <li>• <strong>Cover:</strong> High-impact publication title & imagery</li>
                <li>• <strong>Table of Contents:</strong> Issue roadmap & page index</li>
                <li>• <strong>Intro:</strong> Editorial narrative with drop-cap</li>
                <li>• <strong>Species Hero:</strong> Full-bleed photograph & scientific name</li>
                <li>• <strong>Species Details:</strong> Habitat, location & description notes</li>
                <li>• <strong>Gallery Grid:</strong> Multi-photo specimen mosaic</li>
                <li>• <strong>Back Cover:</strong> Closing credits & conservation motto</li>
              </ul>
            </div>
          </div>

          {/* Right Column (2 cols): Page Arrangement Sequencer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-forest/10 shadow-sm">
              <h3 className="font-display font-bold text-base text-forest flex items-center gap-2">
                <Layers className="w-4 h-4 text-sage" /> Page Sequence ({pages.length} Pages)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoGenerate}
                  disabled={autoGenerating}
                  className="inline-flex items-center gap-1.5 bg-earth hover:bg-earth-dark text-cream px-3.5 py-2 rounded-full text-xs font-semibold transition shadow-xs disabled:opacity-60"
                  title="Automatically assemble a full issue from all published species"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{autoGenerating ? 'Assembling Issue...' : '⚡ Auto-Generate Issue'}</span>
                </button>
                <button
                  onClick={() => setIsAddingPage(true)}
                  className="inline-flex items-center gap-1.5 bg-forest hover:bg-forest-light text-cream px-4 py-2 rounded-full text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Page
                </button>
              </div>
            </div>

            {/* List of Pages in Order */}
            <div className="space-y-3">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 border border-forest/10 shadow-xs flex items-center justify-between gap-4 hover:border-forest/20 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-forest/5 text-forest font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-forest text-sm uppercase tracking-wide">
                          {p.template_type.replace('-', ' ')}
                        </span>
                        <span className="text-[10px] text-forest/40 font-mono">
                          (Page ID #{p.id})
                        </span>
                      </div>
                      <p className="text-xs text-forest/50 font-editorial truncate mt-0.5">
                        {p.content_json ? JSON.stringify(JSON.parse(p.content_json)).slice(0, 80) : 'Blank layout'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMovePage(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded text-forest/40 hover:text-forest disabled:opacity-20 transition"
                      title="Move earlier"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMovePage(idx, 1)}
                      disabled={idx === pages.length - 1}
                      className="p-1.5 rounded text-forest/40 hover:text-forest disabled:opacity-20 transition"
                      title="Move later"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePage(p.id)}
                      className="p-1.5 rounded text-rose-500 hover:text-rose-700 transition ml-2"
                      title="Remove page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Publication */}
      {isCreatingPub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-forest/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl font-bold text-forest">New Flipbook Edition</h3>
              <button onClick={() => setIsCreatingPub(false)} className="text-forest/40 hover:text-forest">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePublication} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                  Publication Title *
                </label>
                <input
                  type="text"
                  required
                  value={pubForm.title}
                  onChange={e => setPubForm({ ...pubForm, title: e.target.value })}
                  className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={pubForm.subtitle}
                  onChange={e => setPubForm({ ...pubForm, subtitle: e.target.value })}
                  className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={pubForm.edition}
                    onChange={e => setPubForm({ ...pubForm, edition: e.target.value })}
                    className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                    Volume
                  </label>
                  <input
                    type="text"
                    value={pubForm.volume}
                    onChange={e => setPubForm({ ...pubForm, volume: e.target.value })}
                    className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                  Cover Photo URL (optional)
                </label>
                <input
                  type="text"
                  value={pubForm.cover_photo_url}
                  onChange={e => setPubForm({ ...pubForm, cover_photo_url: e.target.value })}
                  placeholder="/uploads/cover.jpg"
                  className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingPub(false)}
                  className="px-4 py-2 text-xs font-semibold text-forest/60 hover:text-forest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-forest hover:bg-forest-light text-cream px-5 py-2 rounded-full text-xs font-semibold transition"
                >
                  Create Edition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Append Page */}
      {isAddingPage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-forest/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl font-bold text-forest">Add Magazine Page</h3>
              <button onClick={() => setIsAddingPage(false)} className="text-forest/40 hover:text-forest">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                  Template Style *
                </label>
                <select
                  value={pageForm.template_type}
                  onChange={e => setPageForm({ ...pageForm, template_type: e.target.value })}
                  className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest font-medium"
                >
                  {PAGE_TEMPLATES.map(t => (
                    <option key={t.type} value={t.type}>{t.name}</option>
                  ))}
                </select>
              </div>

              {['species-feature', 'species-detail'].includes(pageForm.template_type) && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                    Select Species Data Source
                  </label>
                  <select
                    value={pageForm.species_id}
                    onChange={e => setPageForm({ ...pageForm, species_id: e.target.value })}
                    className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest font-medium"
                  >
                    <option value="">Choose species...</option>
                    {speciesList.map(s => (
                      <option key={s.id} value={s.id}>{s.common_name} ({s.scientific_name})</option>
                    ))}
                  </select>
                </div>
              )}

              {['intro', 'blank'].includes(pageForm.template_type) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                      Headline Title
                    </label>
                    <input
                      type="text"
                      value={pageForm.title}
                      onChange={e => setPageForm({ ...pageForm, title: e.target.value })}
                      placeholder="e.g. In The Canopy"
                      className="w-full border border-forest/20 rounded-xl px-4 py-2 text-sm bg-white text-forest"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-forest/70 mb-1">
                      Editorial Body Copy
                    </label>
                    <textarea
                      rows={4}
                      value={pageForm.body}
                      onChange={e => setPageForm({ ...pageForm, body: e.target.value })}
                      placeholder="Text to display on page..."
                      className="w-full border border-forest/20 rounded-xl p-3 text-sm bg-white text-forest font-editorial"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingPage(false)}
                  className="px-4 py-2 text-xs font-semibold text-forest/60 hover:text-forest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-forest hover:bg-forest-light text-cream px-5 py-2 rounded-full text-xs font-semibold transition"
                >
                  Append Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

