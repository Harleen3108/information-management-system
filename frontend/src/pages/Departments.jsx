import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Building2, Plus, Search, Users, Files, Edit3, Trash2, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormInput from '../components/ui/FormInput';
import TextArea from '../components/ui/TextArea';
import SelectInput from '../components/ui/SelectInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const Departments = () => {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', manager_id: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const [dRes, uRes] = await Promise.all([api.get('/departments', { params }), api.get('/users')]);
      setDepartments(dRes.data); setAllUsers(uRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', manager_id: '' }); setErrors({}); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, description: d.description || '', manager_id: d.manager_id || '' }); setErrors({}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/departments/${editing.id}`, form);
      else await api.post('/departments', form);
      toast.success(editing ? 'Department updated' : 'Department created');
      setShowModal(false); fetchData();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error('Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/departments/${deleting.id}`); toast.success('Department deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  if (loading) return <LoadingSpinner text="Loading departments..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Manage organizational departments.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 transition-colors">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <input type="text" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept, i) => (
          <motion.div key={dept.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-black/20 transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/15">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(dept)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={() => { setDeleting(dept); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-4">{dept.name}</h3>
            {dept.description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">{dept.description}</p>}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" /><span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{dept.users_count || 0}</span></div>
              <div className="flex items-center gap-1.5"><Files className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" /><span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{dept.records_count || 0}</span></div>
            </div>
            {dept.manager && (
              <div className="flex items-center gap-1.5 mt-3 bg-gray-50 dark:bg-zinc-800 rounded-lg px-2.5 py-1.5">
                <UserCog className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                <span className="text-[11px] font-medium text-gray-600 dark:text-zinc-300">{dept.manager.name}</span>
              </div>
            )}
          </motion.div>
        ))}
        {departments.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Building2 className="w-8 h-8 text-gray-200 dark:text-zinc-700 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No departments found</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'Create Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Department Name" id="dn" value={form.name} onChange={e => setForm({...form, name: e.target.value})} error={errors.name?.[0]} required />
          <TextArea label="Description" id="dd" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
          <SelectInput label="Manager" id="dm" value={form.manager_id} onChange={e => setForm({...form, manager_id: e.target.value})} placeholder="Select manager (optional)" options={allUsers.map(u => ({ value: u.id, label: u.name }))} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Department" message={`Delete "${deleting?.name}"?`} confirmText="Delete" />
    </div>
  );
};

export default Departments;
