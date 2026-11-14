import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Check,
  X,
  Sparkles,
  Camera,
  AlertCircle,
  GraduationCap,
  Code2,
  BookOpen,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../utils/api.js';

export default function ContributorsManagement() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form fields
  const [form, setForm] = useState({
    full_name: '',
    course: 'BSIT',
    role: '',
    contribution_description: '',
    sort_order: 0
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadContributors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/contributors');
      setContributors(res.contributors || []);
    } catch (err) {
      showNotification(err.message || 'Failed to load contributors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContributors();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      full_name: '',
      course: 'BSIT',
      role: '',
      contribution_description: '',
      sort_order: contributors.length + 1
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      full_name: item.full_name || '',
      course: item.course || 'BSIT',
      role: item.role || '',
      contribution_description: item.contribution_description || '',
      sort_order: item.sort_order ?? 0
    });
    setSelectedFile(null);
    setPreviewUrl(item.profile_image || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Invalid file format. Please select an image (JPG, PNG, WEBP, etc.).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError('File size exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setFormError('');

    // Normalize image to standard high-quality JPEG blob
    // This guarantees compatibility across all browsers, formats (.jfif, .avif, .heic, .webp, .png), and multer
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800; // Optimal for circular portrait cards
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const normalized = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
              setSelectedFile(normalized);
              setPreviewUrl(URL.createObjectURL(blob));
            } else {
              setSelectedFile(file);
              setPreviewUrl(URL.createObjectURL(file));
            }
          }, 'image/jpeg', 0.92);
        } catch (_) {
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      };
      img.onerror = () => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setFormError('Student full name is required.');
      return;
    }
    if (!form.role.trim()) {
      setFormError('Assigned role / position is required.');
      return;
    }
    if (!form.course) {
      setFormError('Course selection (BSIT or BTLED) is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (selectedFile) {
        // Multipart upload when a new photo is selected
        const formData = new FormData();
        formData.append('full_name', form.full_name.trim());
        formData.append('course', form.course);
        formData.append('role', form.role.trim());
        formData.append('contribution_description', form.contribution_description.trim());
        formData.append('sort_order', form.sort_order);
        formData.append('photo', selectedFile);

        if (editingId) {
          await api.upload(`/api/contributors/${editingId}`, formData, 'PUT');
          showNotification('Contributor information successfully updated.');
        } else {
          await api.upload('/api/contributors', formData, 'POST');
          showNotification('Contributor successfully added.');
        }
      } else {
        // Pure JSON update/add when no new file is selected
        const payload = {
          full_name: form.full_name.trim(),
          course: form.course,
          role: form.role.trim(),
          contribution_description: form.contribution_description.trim(),
          sort_order: form.sort_order
        };

        if (editingId) {
          await api.put(`/api/contributors/${editingId}`, payload);
          showNotification('Contributor information successfully updated.');
        } else {
          await api.post('/api/contributors', payload);
          showNotification('Contributor successfully added.');
        }
      }

      setIsModalOpen(false);
      loadContributors();
    } catch (err) {
      setFormError(err.message || 'Failed to save contributor record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${item.full_name}" from the contributors list?\n\nThis will remove their profile from the public homepage.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/contributors/${item.id}`);
      showNotification('Contributor successfully deleted.');
      setContributors(prev => prev.filter(c => c.id !== item.id));
    } catch (err) {
      showNotification(err.message || 'Failed to delete contributor.', 'error');
    }
  };

  // Filtered contributors based on selected tab
  const filteredContributors = contributors.filter(c => {
    if (selectedCourseFilter === 'BSIT') return c.course === 'BSIT';
    if (selectedCourseFilter === 'BTLED') return c.course === 'BTLED';
    return true;
  });

  const bsitCount = contributors.filter(c => c.course === 'BSIT').length;
  const btledCount = contributors.filter(c => c.course === 'BTLED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-fade-in ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Manage Contributors</h1>
          <p className="font-editorial italic text-forest/60 text-sm mt-0.5">
            Recognize BSIT and BTLED students responsible for system development and biodiversity content
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Contributor
        </button>
      </div>

      {/* Course Summary & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-forest/10 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCourseFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedCourseFilter === 'ALL'
                ? 'bg-forest text-cream shadow-xs'
                : 'text-forest/70 hover:bg-forest/5'
            }`}
          >
            All Contributors ({contributors.length})
          </button>
          <button
            onClick={() => setSelectedCourseFilter('BSIT')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedCourseFilter === 'BSIT'
                ? 'bg-emerald-800 text-cream shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>BSIT Team ({bsitCount})</span>
          </button>
          <button
            onClick={() => setSelectedCourseFilter('BTLED')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedCourseFilter === 'BTLED'
                ? 'bg-earth text-cream shadow-xs'
                : 'text-earth hover:bg-earth/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>BTLED Team ({btledCount})</span>
          </button>
        </div>

        <span className="text-xs text-forest/50 font-editorial">
          Changes sync dynamically to the homepage
        </span>
      </div>

      {/* Main Table / Mobile Cards View */}
      {loading ? (
        <div className="py-20 text-center">
          <Users className="w-10 h-10 text-sage animate-pulse mx-auto mb-2" />
          <p className="text-forest/60 text-xs font-editorial">Loading contributor directory...</p>
        </div>
      ) : filteredContributors.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-forest/10 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-forest/5 flex items-center justify-center mx-auto mb-4 text-sage">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-forest mb-2">No Student Contributors Found</h3>
          <p className="text-forest/60 text-xs sm:text-sm mb-6 leading-relaxed">
            {selectedCourseFilter === 'ALL'
              ? 'No student contributors have been registered yet. Add BSIT or BTLED students to credit their work on the public homepage!'
              : `No contributors found for ${selectedCourseFilter}. Click the button below to add one.`}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-light text-cream px-6 py-3 rounded-full text-xs font-semibold transition min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Add Contributor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card Layout (Visible on screens < 640px) */}
          <div className="block sm:hidden space-y-3">
            {filteredContributors.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 border border-forest/10 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-forest border-2 border-forest/15 shadow-xs shrink-0 flex items-center justify-center">
                    {c.profile_image ? (
                      <img
                        src={c.profile_image}
                        alt={c.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-display font-bold text-base text-cream">
                        {c.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-display font-bold text-forest text-base truncate">
                        {c.full_name}
                      </h4>
                      {c.course === 'BSIT' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <Code2 className="w-3 h-3" /> BSIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          <BookOpen className="w-3 h-3" /> BTLED
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-forest/80 truncate">
                      {c.role}
                    </p>
                  </div>
                </div>

                {c.contribution_description && (
                  <p className="text-xs text-forest/70 font-editorial italic bg-cream/40 p-2.5 rounded-xl border border-forest/5">
                    "{c.contribution_description}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-forest/5">
                  <button
                    onClick={() => openEditModal(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-forest/70 hover:text-forest bg-forest/5 hover:bg-forest/10 transition min-h-[36px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition min-h-[36px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table Layout (Hidden on screens < 640px) */}
          <div className="hidden sm:block bg-white rounded-3xl border border-forest/10 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-dark text-cream/80 text-[11px] uppercase tracking-wider font-mono border-b border-forest/20">
                  <tr>
                    <th className="py-4 px-6 font-semibold">Profile Picture</th>
                    <th className="py-4 px-6 font-semibold">Full Name</th>
                    <th className="py-4 px-6 font-semibold">Course</th>
                    <th className="py-4 px-6 font-semibold">Assigned Role</th>
                    <th className="py-4 px-6 font-semibold">Contribution</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/5">
                  {filteredContributors.map((c) => (
                    <tr key={c.id} className="hover:bg-cream/30 transition-colors">
                      {/* Circular Profile Picture */}
                      <td className="py-4 px-6">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-forest border-2 border-forest/15 shadow-xs shrink-0 flex items-center justify-center">
                          {c.profile_image ? (
                            <img
                              src={c.profile_image}
                              alt={c.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-display font-bold text-base text-cream">
                              {c.full_name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Full Name */}
                      <td className="py-4 px-6">
                        <span className="font-display font-bold text-forest text-base block">
                          {c.full_name}
                        </span>
                      </td>

                      {/* Course Badge */}
                      <td className="py-4 px-6">
                        {c.course === 'BSIT' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                            <Code2 className="w-3 h-3" /> BSIT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                            <BookOpen className="w-3 h-3" /> BTLED
                          </span>
                        )}
                      </td>

                      {/* Role / Position */}
                      <td className="py-4 px-6">
                        <span className="font-medium text-forest/90 text-xs">
                          {c.role}
                        </span>
                      </td>

                      {/* Contribution Description */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-xs text-forest/70 font-editorial italic line-clamp-2">
                          {c.contribution_description ? `"${c.contribution_description}"` : '—'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-2 rounded-xl text-forest/60 hover:text-forest hover:bg-forest/5 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Edit Contributor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Delete Contributor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contributor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-paper rounded-3xl max-w-xl w-full my-auto shadow-2xl border border-forest/20 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-forest text-cream flex items-center justify-between border-b border-forest-light shrink-0">
              <div>
                <h2 className="font-display text-lg sm:text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 h-5 text-sage shrink-0" />
                  {editingId ? 'Edit Student Contributor' : 'Add Student Contributor'}
                </h2>
                <p className="text-[11px] sm:text-xs text-cream/70 font-editorial italic mt-0.5">
                  Update student details for the public "Meet the Developers" section
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-forest-light text-cream/70 hover:text-cream transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form id="contributor-form" onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Circular Profile Picture Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-3.5 sm:p-4 rounded-2xl bg-cream/40 border border-forest/10">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-forest-dark border-2 border-forest/20 shrink-0 shadow-inner group">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cream/40 p-2 text-center">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 mb-1 text-sage" />
                      <span className="text-[9px] sm:text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="font-display font-bold text-sm text-forest">Profile Picture</p>
                  <p className="text-xs text-forest/60 font-editorial mb-3">
                    Upload a circular portrait / headshot (Auto-optimized)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-1.5 bg-sage hover:bg-sage-dark text-cream px-4 py-2 rounded-full text-xs font-semibold transition min-h-[38px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedFile ? 'Change Picture' : 'Upload Picture'}</span>
                  </button>
                  {selectedFile && (
                    <span className="block text-[10px] text-forest/50 mt-1 truncate max-w-xs mx-auto sm:mx-0">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full border border-forest/20 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                />
              </div>

              {/* Course & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Course Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Course <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.course}
                    onChange={e => setForm({ ...form, course: e.target.value })}
                    className="w-full border border-forest/20 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest font-medium"
                  >
                    <option value="BSIT">BSIT (System Development Team)</option>
                    <option value="BTLED">BTLED (Educational Content Team)</option>
                  </select>
                </div>

                {/* Role / Position */}
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Role / Position <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    placeholder={
                      form.course === 'BSIT'
                        ? 'e.g. Frontend Developer, UI/UX Designer'
                        : 'e.g. Content Writer, Biodiversity Researcher'
                    }
                    className="w-full border border-forest/20 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                  />
                </div>
              </div>

              {/* Description of Contribution */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Description of Contribution
                </label>
                <textarea
                  rows={3}
                  value={form.contribution_description}
                  onChange={e => setForm({ ...form, contribution_description: e.target.value })}
                  placeholder={
                    form.course === 'BSIT'
                      ? 'Describe system features built, architecture design, UI/UX implementation...'
                      : 'Describe taxonomy research conducted, educational write-ups, learning materials...'
                  }
                  className="w-full border border-forest/20 rounded-xl p-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest leading-relaxed"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 bg-cream/50 border-t border-forest/10 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-forest/70 hover:text-forest transition min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="contributor-form"
                disabled={saving}
                className="bg-forest hover:bg-forest-light text-cream px-6 py-2.5 rounded-full text-xs font-semibold transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5 min-h-[42px]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : editingId ? 'Update Contributor' : 'Add Contributor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

