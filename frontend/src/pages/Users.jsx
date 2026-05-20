import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Users as UsersIcon, Plus, Search, Edit3, Trash2, ShieldCheck, Shield, UserCog, UserCheck, Eye, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormInput from '../components/ui/FormInput';
import SelectInput from '../components/ui/SelectInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const ROLE_ICONS = { 'Super Admin': ShieldCheck, 'Admin': Shield, 'Manager': UserCog, 'Employee': UserCheck, 'Viewer': Eye };
const TABS = ['All', 'Super Admin', 'Admin', 'Manager', 'Employee', 'Viewer'];

const Users = () => {
  const toast = useToast();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', department_id: '', role: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const canCreate = can('users.create');
  const canEdit = can('users.edit');
  const canDelete = can('users.delete');

  const fetchAll = async () => {
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      const [uRes, dRes, rRes] = await Promise.all([api.get('/users', { params }), api.get('/departments'), api.get('/roles')]);
      setUsers(uRes.data); setDepartments(dRes.data); setRoles(rRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [debouncedSearch]);

  const getUserRole = (u) => u.roles?.[0]?.name || 'No Role';

  const filteredUsers = useMemo(() => {
    let result = users;
    if (activeTab !== 'All') result = result.filter(u => getUserRole(u) === activeTab);
    return result;
  }, [users, activeTab]);

  const roleCounts = useMemo(() => {
    const counts = { All: users.length };
    TABS.slice(1).forEach(r => { counts[r] = users.filter(u => getUserRole(u) === r).length; });
    return counts;
  }, [users]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', department_id: '', role: '', status: 'active' }); setErrors({}); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', department_id: u.department_id || '', role: getUserRole(u), status: u.status }); setErrors({}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      const payload = { ...form };
      if (editing) { delete payload.password; await api.put(`/users/${editing.id}`, payload); toast.success('User updated'); }
      else { await api.post('/users', payload); toast.success('User created'); }
      setShowModal(false); fetchAll();
    } catch (err) { if (err.response?.status === 422) setErrors(err.response.data.errors || {}); else toast.error('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/users/${deleting.id}`); toast.success('User deleted'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleToggleStatus = async (u) => {
    try { await api.put(`/users/${u.id}`, { ...u, role: getUserRole(u), status: u.status === 'active' ? 'inactive' : 'active' }); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Manage user accounts and roles.</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-4 pt-3 gap-3 flex-wrap">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === t ? 'bg-primary/10 dark:bg-primary/15 text-primary' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}>
                {t} <span className="ml-1 text-[10px] opacity-60">{roleCounts[t] || 0}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none w-full focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-3">
          <table className="w-full">
            <thead>
              <tr className="text-left border-y border-gray-100 dark:border-zinc-800">
                {['User', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="px-5 py-16 text-center">
                  <UsersIcon className="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No users found</p>
                </td></tr>
              ) : filteredUsers.map((u, i) => {
                const role = getUserRole(u);
                const Icon = ROLE_ICONS[role] || UsersIcon;
                return (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-zinc-300">
                        <Icon className="w-3.5 h-3.5" /> {role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 dark:text-zinc-400">{u.department?.name || '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-gray-200'
                        }`}>
                        <span className={`w-1 h-1 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {u.status}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-0.5">
                         <button onClick={() => navigate(`/users/${u.id}`)} className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-gray-400 hover:text-indigo-600" title="View Profile"><Eye className="w-3.5 h-3.5" /></button>
                        {canEdit && <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                        {canDelete && <button onClick={() => { setDeleting(u); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'Create User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Full Name" id="un" value={form.name} onChange={e => setForm({...form, name: e.target.value})} error={errors.name?.[0]} required />
          <FormInput label="Email" id="ue" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} error={errors.email?.[0]} required />
          {!editing && <FormInput label="Password" id="up" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} error={errors.password?.[0]} required />}
          <div className="grid grid-cols-2 gap-4">
            <SelectInput label="Role" id="ur" value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="Select role" options={roles.map(r => ({ value: r.name, label: r.name }))} error={errors.role?.[0]} />
            <SelectInput label="Department" id="ud" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} placeholder="Select department" options={departments.map(d => ({ value: d.id, label: d.name }))} />
          </div>
          <SelectInput label="Status" id="us" value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete User" message={`Delete "${deleting?.name}"? This action cannot be undone.`} confirmText="Delete" />
    </div>
  );
};

export default Users;
