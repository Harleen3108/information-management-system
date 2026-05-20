import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Tag, Plus, Edit3, Trash2, Files, Search, FileText, Image, Film, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormInput from '../components/ui/FormInput';
import TextArea from '../components/ui/TextArea';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const COLORS = [
  'from-indigo-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-cyan-500 to-sky-500',
];

// Preset file type groups — clicking a chip toggles that entire group
const FILE_TYPE_PRESETS = [
  { label: 'Documents',    icon: FileText, color: 'indigo',  exts: ['pdf', 'doc', 'docx', 'txt', 'rtf'] },
  { label: 'Spreadsheets', icon: FileText, color: 'emerald', exts: ['xls', 'xlsx', 'csv'] },
  { label: 'Images',       icon: Image,    color: 'pink',    exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
  { label: 'Videos',       icon: Film,     color: 'violet',  exts: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
  { label: 'Audio',        icon: Music,    color: 'amber',   exts: ['mp3', 'wav', 'ogg', 'aac', 'm4a'] },
];

const CHIP_INACTIVE = {
  indigo:  'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50',
  pink:    'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700/50',
  violet:  'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/50',
  amber:   'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
};

const CHIP_ACTIVE = {
  indigo:  'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500',
  emerald: 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500',
  pink:    'bg-pink-600 dark:bg-pink-500 text-white border-pink-600 dark:border-pink-500',
  violet:  'bg-violet-600 dark:bg-violet-500 text-white border-violet-600 dark:border-violet-500',
  amber:   'bg-amber-600 dark:bg-amber-500 text-white border-amber-600 dark:border-amber-500',
};

// Parse comma-separated extension string into a clean lowercase Set
const parseExts = (str) =>
  new Set((str || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean));

// Build final extension string from selected presets + custom field
const buildExtString = (activePresets, customStr) => {
  const set = new Set();
  FILE_TYPE_PRESETS.forEach((p) => {
    if (activePresets.has(p.label)) p.exts.forEach((e) => set.add(e));
  });
  parseExts(customStr).forEach((e) => set.add(e));
  return [...set].join(',');
};

// Derive which preset groups are fully covered by an existing extension string
const deriveActivePresets = (extStr) => {
  const active = new Set();
  const extSet = parseExts(extStr);
  FILE_TYPE_PRESETS.forEach((p) => {
    if (p.exts.every((e) => extSet.has(e))) active.add(p.label);
  });
  return active;
};

// Return custom extensions (those not belonging to any selected preset)
const deriveCustomExts = (extStr, activePresets) => {
  const presetExts = new Set(
    FILE_TYPE_PRESETS.filter((p) => activePresets.has(p.label)).flatMap((p) => p.exts)
  );
  return [...parseExts(extStr)].filter((e) => !presetExts.has(e)).join(', ');
};

// ─────────────────────────────────────────────────────────────────────────────

const Categories = () => {
  const toast = useToast();
  const { can } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [activePresets, setActivePresets] = useState(new Set());
  const [customExts, setCustomExts] = useState('');
  // Derived final extension string (sent to backend)
  const [allowedExtensions, setAllowedExtensions] = useState('');

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const canCreate = can('categories.create');
  const canDelete = can('categories.delete');

  // ── Re-compute allowedExtensions whenever presets or custom changes ──────
  useEffect(() => {
    setAllowedExtensions(buildExtString(activePresets, customExts));
  }, [activePresets, customExts]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/categories', { params });
      setCategories(res.data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [debouncedSearch]);

  // ── Open modals ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setFormName(''); setFormDesc('');
    setActivePresets(new Set()); setCustomExts('');
    setErrors({}); setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setFormName(c.name);
    setFormDesc(c.description || '');
    const presets = deriveActivePresets(c.allowed_extensions || '');
    setActivePresets(presets);
    setCustomExts(deriveCustomExts(c.allowed_extensions || '', presets));
    setErrors({}); setShowModal(true);
  };

  // ── Preset toggle ─────────────────────────────────────────────────────────
  const togglePreset = (preset) => {
    setActivePresets((prev) => {
      const next = new Set(prev);
      if (next.has(preset.label)) next.delete(preset.label);
      else next.add(preset.label);
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    const payload = {
      name: formName,
      description: formDesc,
      allowed_extensions: allowedExtensions || null,
    };
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleting.id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner text="Loading categories..." />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Organize records by category and restrict allowed file types.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all"
        />
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-16 text-center">
          <Tag className="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {categories.map((cat, i) => {
              const exts = cat.allowed_extensions
                ? cat.allowed_extensions.split(',').map((e) => e.trim()).filter(Boolean)
                : [];
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-md dark:hover:shadow-black/20 transition-shadow group">
                  <div className={`h-1 bg-gradient-to-r ${COLORS[i % COLORS.length]}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center shadow-sm`}>
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canCreate && (
                          <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => { setDeleting(cat); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {cat.description && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 line-clamp-2">{cat.description}</p>
                    )}

                    {/* Allowed file type badges */}
                    {exts.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {exts.slice(0, 7).map((ext) => (
                          <span key={ext} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 uppercase tracking-wide">
                            .{ext}
                          </span>
                        ))}
                        {exts.length > 7 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500">
                            +{exts.length - 7} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-300 dark:text-zinc-600 mt-2 italic">Accepts any file type</p>
                    )}

                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                      <Files className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">{cat.records_count ?? 0}</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">records</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            label="Category Name"
            id="cat-name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={errors.name?.[0]}
            required
            placeholder="e.g. Legal Documents"
          />
          <TextArea
            label="Description (optional)"
            id="cat-desc"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            rows={2}
          />

          {/* ── File Type Restriction ───────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Allowed File Types
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-zinc-500">
                — leave everything blank to accept all file types
              </span>
            </label>

            {/* Preset group chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {FILE_TYPE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const active = activePresets.has(preset.label);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => togglePreset(preset)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all select-none ${
                      active ? CHIP_ACTIVE[preset.color] : CHIP_INACTIVE[preset.color]
                    }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {preset.label}
                    <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-50'}`}>
                      ({preset.exts.join(', ')})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom extensions */}
            <div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                Add custom extensions (comma-separated, e.g.{' '}
                <code className="text-primary font-mono">zip, xml, json</code>):
              </p>
              <input
                type="text"
                value={customExts}
                onChange={(e) => setCustomExts(e.target.value)}
                placeholder="zip, 7z, xml, json ..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            {/* Preview of final extensions */}
            {allowedExtensions ? (
              <div className="mt-2">
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-1 font-medium">
                  Will accept:
                </p>
                <div className="flex flex-wrap gap-1">
                  {allowedExtensions.split(',').filter(Boolean).map((ext) => (
                    <span
                      key={ext.trim()}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                      .{ext.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2 italic">
                No restrictions — all file types will be accepted.
              </p>
            )}

            {errors.allowed_extensions?.[0] && (
              <p className="text-xs text-red-500 mt-1">{errors.allowed_extensions[0]}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default Categories;
