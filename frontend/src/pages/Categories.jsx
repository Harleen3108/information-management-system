import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Tag, Plus, Edit3, Trash2, Files, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormInput from '../components/ui/FormInput';
import TextArea from '../components/ui/TextArea';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const COLORS = ['from-indigo-500 to-blue-500', 'from-violet-500 to-purple-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-500', 'from-cyan-500 to-sky-500'];

const Categories = () => {
  const toast = useToast();
  const { can } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const canCreate = can('categories.create');
  const canDelete = can('categories.delete');

  const fetchCategories = async () => {
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/categories', { params });
      setCategories(res.data);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, [debouncedSearch]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setErrors({}); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setErrors({}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) { await api.put(`/categories/${editing.id}`, form); toast.success('Category updated'); }
      else { await api.post('/categories', form); toast.success('Category created'); }
      setShowModal(false); fetchCategories();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error('Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/categories/${deleting.id}`); toast.success('Category deleted'); fetchCategories(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  if (loading) return <LoadingSpinner text="Loading categories..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Organize records by category.</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all" />
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-16 text-center">
          <Tag className="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {categories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
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
                      {canCreate && <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400"><Edit3 className="w-3.5 h-3.5" /></button>}
                      {canDelete && <button onClick={() => { setDeleting(cat); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </div>
                  {cat.description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 line-clamp-2">{cat.description}</p>}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <Files className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" />
                    <span className="text-xs font-semibold text-gray-600 dark:text-zinc-300">{cat.records_count ?? 0}</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">records</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Category Name" id="cn" value={form.name} onChange={e => setForm({...form, name: e.target.value})} error={errors.name?.[0]} required placeholder="e.g. Marketing" />
          <TextArea label="Description (optional)" id="cd" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Category" message={`Delete "${deleting?.name}"?`} confirmText="Delete" />
    </div>
  );
};

export default Categories;
