import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Upload,
  Check,
  X,
  Mail,
  Github,
  Linkedin,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Camera
} from 'lucide-react';
import { api } from '../../utils/api.js';

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    role: '',
    bio: '',
    email: '',
    github_url: '',
    linkedin_url: '',
    sort_order: 0,
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/team');
      setMembers(res.members || []);
    } catch (err) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setForm({
      name: '',
      role: '',
      bio: '',
      email: '',
      github_url: '',
      linkedin_url: '',
      sort_order: members.length + 1,
      is_active: true
    });
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      email: member.email || '',
      github_url: member.github_url || '',
      linkedin_url: member.linkedin_url || '',
      sort_order: member.sort_order ?? 0,
      is_active: member.is_active
    });
    setSelectedFile(null);
    setPreviewUrl(member.photo_url || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Member name is required');
      return;
    }
    if (!form.role.trim()) {
      setError('Member role is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('role', form.role);
      formData.append('bio', form.bio || '');
      formData.append('email', form.email || '');
      formData.append('github_url', form.github_url || '');
      formData.append('linkedin_url', form.linkedin_url || '');
      formData.append('sort_order', form.sort_order);
      formData.append('is_active', form.is_active ? 'true' : 'false');

      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      if (editingMember) {
        await api.upload(`/api/team/${editingMember.id}`, formData, 'PUT');
      } else {
        await api.upload('/api/team', formData, 'POST');
      }

      setIsModalOpen(false);
      loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the project team profiles?`)) return;
    try {
      await api.delete(`/api/team/${id}`);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete member');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/api/team/${id}/toggle`);
      setMembers(prev => prev.map(m => m.id === id ? res.member : m));
    } catch (err) {
      alert(err.message || 'Failed to toggle visibility');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const updated = [...members];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((m, idx) => ({
      id: m.id,
      sort_order: idx + 1
    }));

    setMembers(updated);

    try {
      await api.put('/api/team/reorder', { items: reordered });
    } catch (err) {
      console.error(err);
      loadMembers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Project Team & Credits</h1>
          <p className="font-editorial italic text-forest/60 text-sm mt-0.5">
            Manage student / researcher profiles credited on the public homepage for developing this system
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Main Grid of Team Members */}
      {loading ? (
        <div className="py-20 text-center">
          <Users className="w-10 h-10 text-sage animate-pulse mx-auto mb-2" />
          <p className="text-forest/60 text-xs font-editorial">Loading team directory...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-forest/5 flex items-center justify-center mx-auto mb-4 text-sage">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-display text-2xl font-bold text-forest mb-2">No Team Profiles Yet</h3>
          <p className="text-forest/60 text-xs sm:text-sm mb-6 leading-relaxed">
            Add the students and group members who developed this system. Their portraits, roles, and project contributions will be proudly showcased on the homepage!
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-cream px-6 py-2.5 rounded-full text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, idx) => (
            <div
              key={member.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs transition-all duration-300 flex flex-col justify-between ${
                member.is_active ? 'border-forest/15 hover:border-earth/40 hover:shadow-md' : 'border-dashed border-stone-300 opacity-60 bg-stone-50/50'
              }`}
            >
              <div>
                {/* Top Controls: Reorder + Active status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded-md text-forest/40 hover:text-forest hover:bg-forest/5 disabled:opacity-20 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === members.length - 1}
                      className="p-1 rounded-md text-forest/40 hover:text-forest hover:bg-forest/5 disabled:opacity-20 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-forest/40 ml-1">#{idx + 1}</span>
                  </div>

                  <button
                    onClick={() => handleToggle(member.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                      member.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                  >
                    {member.is_active ? (
                      <>
                        <Eye className="w-3 h-3" /> Live on Homepage
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" /> Hidden
                      </>
                    )}
                  </button>
                </div>

                {/* Profile Portrait & Info */}
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-forest-dark border-2 border-forest/10 shrink-0 shadow-inner">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cream/70 font-display font-bold text-xl bg-forest">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-lg text-forest leading-snug truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-earth uppercase tracking-wider mt-0.5">
                      {member.role}
                    </p>
                    {member.email && (
                      <p className="text-[11px] text-forest/50 truncate mt-1 flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-sage shrink-0" />
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio / Project contribution */}
                {member.bio && (
                  <p className="text-xs text-forest/70 font-editorial italic mt-4 line-clamp-3 leading-relaxed border-t border-forest/5 pt-3">
                    "{member.bio}"
                  </p>
                )}
              </div>

              {/* Bottom Footer: Social icons & action buttons */}
              <div className="pt-4 mt-4 border-t border-forest/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-forest/50 hover:text-forest hover:bg-forest/5 transition"
                      title="GitHub"
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-forest/50 hover:text-forest hover:bg-forest/5 transition"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 rounded-xl text-forest/60 hover:text-forest hover:bg-cream transition"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-paper rounded-3xl max-w-xl w-full my-8 shadow-2xl border border-forest/20 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-forest text-cream flex items-center justify-between border-b border-forest-light shrink-0">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sage" />
                  {editingMember ? 'Edit Team Member Profile' : 'Add Team Member Profile'}
                </h2>
                <p className="text-xs text-cream/70 font-editorial italic mt-0.5">
                  This profile will be credited on the public homepage
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-forest-light text-cream/70 hover:text-cream transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form id="team-form" onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Photo Upload Box */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-cream/40 border border-forest/10">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-forest-dark border-2 border-forest/20 shrink-0 shadow-inner group">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cream/40 p-2 text-center">
                      <Camera className="w-6 h-6 mb-1 text-sage" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="font-display font-bold text-sm text-forest">Profile Photograph</p>
                  <p className="text-xs text-forest/60 font-editorial mb-3">
                    Upload a high-resolution headshot or casual portrait
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
                    className="inline-flex items-center gap-1.5 bg-sage hover:bg-sage-dark text-cream px-4 py-1.5 rounded-full text-xs font-semibold transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{selectedFile ? 'Change Photo' : 'Select Photo'}</span>
                  </button>
                  {selectedFile && (
                    <span className="block text-[10px] text-forest/50 mt-1 truncate">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Maria Santos"
                    className="w-full border border-forest/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Role / Specialization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    placeholder="e.g. Lead Researcher & Full-Stack Developer"
                    className="w-full border border-forest/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                  />
                </div>
              </div>

              {/* Bio & Project Contribution */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Project Contribution & Bio
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Describe their role in building the system, cataloging species, research, or designing the 3D flipbook..."
                  className="w-full border border-forest/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                />
              </div>

              {/* Contact Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="student@univ.edu"
                    className="w-full border border-forest/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">GitHub Profile</label>
                  <input
                    type="url"
                    value={form.github_url}
                    onChange={e => setForm({ ...form, github_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full border border-forest/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">LinkedIn Profile</label>
                  <input
                    type="url"
                    value={form.linkedin_url}
                    onChange={e => setForm({ ...form, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full border border-forest/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sage bg-white text-forest"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded text-forest focus:ring-sage w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-forest">Show on Homepage Credits</span>
                </label>
              </div>
            </form>

            {/* Footer */}
            <div className="p-4 bg-cream/50 border-t border-forest/10 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-forest/70 hover:text-forest transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="team-form"
                disabled={saving}
                className="bg-forest hover:bg-forest-light text-cream px-6 py-2 rounded-full text-xs font-semibold transition shadow-sm disabled:opacity-60 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : editingMember ? 'Update Profile' : 'Save Member'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

