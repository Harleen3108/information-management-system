import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  Files, Building2, Users, TrendingUp, Clock, CheckCircle2, XCircle, FileEdit, ChevronDown,
  Plus, ArrowUpRight, AlertTriangle, Eye, Trash2, Send, Download, Info, Bell, Activity,
  RotateCcw, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import FormInput from '../components/ui/FormInput';
import TextArea from '../components/ui/TextArea';
import SelectInput from '../components/ui/SelectInput';
import FileUpload from '../components/ui/FileUpload';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'year', label: 'This Year' },
];

const Dashboard = () => {
  const { user, can } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Employee actions & modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);

  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', department_id: '', status: 'draft' });
  const [files, setFiles] = useState([]);
  const [catExtensions, setCatExtensions] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const canCreate = can('records.create');
  const canDelete = can('records.delete');
  const canSubmit = can('records.submit');
  const canDownload = can('records.download');

  const fetchDashboard = useCallback(async (showChartSpinner = false) => {
    if (showChartSpinner && !user?.hasRole?.('Employee')) setChartLoading(true);
    try {
      const res = await api.get('/dashboard', { params: { period } });
      setData(res.data);
      if (!res.data.is_employee) {
        setChartData((res.data.chart_data || []).map(item => ({ name: item.label, records: item.count })));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setChartLoading(false); }
  }, [period, user]);

  const fetchMeta = async () => {
    try {
      const [d, c] = await Promise.all([api.get('/departments'), api.get('/categories')]);
      setDepartments(d.data); setCategories(c.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMeta();
    fetchDashboard(true);
  }, [fetchDashboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDashboard(false), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Re-fetch when page gains focus
  useEffect(() => {
    const onFocus = () => fetchDashboard(false);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDashboard]);

  // Employee creation & submission handlers
  const openCreate = () => {
    setForm({ title: '', description: '', category_id: '', department_id: user?.department_id || '', status: 'draft' });
    setFiles([]);
    setCatExtensions([]);
    setErrors({});
    setShowCreateModal(true);
  };

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    setForm(f => ({ ...f, category_id: catId }));
    const cat = categories.find(c => String(c.id) === String(catId));
    if (cat && cat.allowed_extensions) {
      setCatExtensions(cat.allowed_extensions.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
    } else {
      setCatExtensions([]);
    }
    setFiles([]);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      files.forEach(f => fd.append('files[]', f));
      await api.post('/records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Record created');
      setShowCreateModal(false);
      fetchDashboard();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error('Something went wrong');
    } finally { setSaving(false); }
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setForm({
      title: record.title || '',
      description: record.description || '',
      category_id: record.category_id || '',
      department_id: record.department_id || '',
      status: record.status || 'draft'
    });
    const cat = categories.find(c => String(c.id) === String(record.category_id));
    if (cat && cat.allowed_extensions) {
      setCatExtensions(cat.allowed_extensions.split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
    } else {
      setCatExtensions([]);
    }
    setErrors({});
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      await api.put(`/records/${editingRecord.id}`, form);
      toast.success('Record updated');
      setShowEditModal(false);
      fetchDashboard();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error('Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/records/${deletingRecord.id}`);
      toast.success('Record deleted');
      setShowDeleteDialog(false);
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSubmitForApproval = async (record) => {
    try {
      await api.post(`/records/${record.id}/submit`);
      toast.success('Submitted for approval');
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  // Render Employee Dashboard
  if (data?.is_employee) {
    const stats = [
      { label: 'Total Submissions', value: data.stats.total_records, icon: Files, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
      { label: 'Approved Records', value: data.stats.approved_records, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      { label: 'Pending Review', value: data.stats.pending_records + data.stats.in_review_records, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      { label: 'Action Required', value: data.stats.rejected_records + data.stats.revision_records, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
      { label: 'Drafts', value: data.stats.draft_records, icon: FileEdit, color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800' },
    ];

    return (
      <div className="space-y-6">
        {/* Header Greeting */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Here's your submission activity overview.</p>
        </div>

        {/* 1. Top Section: Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
              <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center mb-2.5`}>
                <stat.icon className={`w-[16px] h-[16px] ${stat.color}`} />
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{stat.value.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* 2. Middle Section: Quick Actions + Pending Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed mb-4">Create records and upload attachments directly to the system database.</p>
            </div>
            {canCreate && (
              <button onClick={openCreate} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm shadow-sm shadow-primary/20 transition-colors">
                <Plus className="w-4 h-4" /> Create New Record
              </button>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col justify-between min-h-[160px]">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Pending Tasks</h2>
              {data.pending_tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">You are all caught up! No actions required.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {data.pending_tasks.map((task) => {
                    const lastApproval = task.approvals?.[0];
                    return (
                      <div key={task.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{task.title}</span>
                            <StatusBadge status={task.status} />
                          </div>
                          {lastApproval?.comments && (
                            <p className="text-[11px] text-red-650 dark:text-red-400 line-clamp-1 italic">
                              "{lastApproval.comments}"
                            </p>
                          )}
                        </div>
                        <button onClick={() => openEdit(task)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 rounded-lg text-[11px] font-semibold transition-colors shrink-0">
                          <FileEdit className="w-3 h-3" /> Edit & Resubmit
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Main Section: My Submissions Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">My Submissions</h2>
            <button onClick={() => navigate('/records')} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
              View All Submissions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/20">
                  {['Title', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {data.my_submissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Files className="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">No submissions yet.</p>
                    </td>
                  </tr>
                ) : (
                  data.my_submissions.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <button onClick={() => navigate(`/records/${r.id}`)} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary text-left">{r.title}</button>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500 dark:text-zinc-400">{r.category?.name || '—'}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-6 py-3.5 text-xs text-gray-400 dark:text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/records/${r.id}`)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300" title="View"><Eye className="w-3.5 h-3.5" /></button>
                          {canSubmit && (r.status === 'draft' || r.status === 'revision') && (
                            <button onClick={() => handleSubmitForApproval(r)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Submit"><Send className="w-3.5 h-3.5" /></button>
                          )}
                          {(r.status === 'draft' || r.status === 'revision' || r.status === 'rejected') && (
                            <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-zinc-700 dark:hover:text-zinc-200" title="Edit"><FileEdit className="w-3.5 h-3.5" /></button>
                          )}
                          {canDelete && (r.status === 'draft' || r.status === 'revision') && (
                            <button onClick={() => { setDeletingRecord(r); setShowDeleteDialog(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-650 dark:hover:text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Side / Bottom Section: Notifications + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Notifications
              </h2>
              <button onClick={() => navigate('/notifications')} className="text-xs font-semibold text-primary hover:underline">
                View All
              </button>
            </div>
            <div className="space-y-3.5">
              {data.notifications.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-6">You're all caught up!</p>
              ) : (
                data.notifications.map((n) => (
                  <div key={n.id} onClick={() => n.link && navigate(n.link)} className="p-3 bg-gray-50 dark:bg-zinc-800/30 hover:bg-gray-100 dark:hover:bg-zinc-850 border border-gray-100 dark:border-zinc-800 rounded-xl cursor-pointer transition-all">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-505" /> Recent Activity
            </h2>
            <div className="space-y-4">
              {data.recent_activity.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-6">No recent activity.</p>
              ) : (
                data.recent_activity.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-900 dark:text-white font-medium leading-snug">
                        <span className="font-semibold">You</span>{' '}
                        <span className="text-gray-500 dark:text-zinc-400">{a.action?.replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 5. Modals for Create and Edit */}
        {canCreate && showCreateModal && (
          <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Record" size="lg">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <FormInput label="Title" id="rt" value={form.title} onChange={e => setForm({...form, title: e.target.value})} error={errors.title?.[0]} required />
              <TextArea label="Description" id="rd" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
              <div className="grid grid-cols-2 gap-4">
                <SelectInput label="Category" id="rc" value={form.category_id} onChange={handleCategoryChange} placeholder="Select category" options={categories.map(c => ({ value: c.id, label: c.name }))} error={errors.category_id?.[0]} />
                <SelectInput label="Department" id="rdp" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} placeholder="Select department" options={departments.map(d => ({ value: d.id, label: d.name }))} error={errors.department_id?.[0]} disabled />
              </div>
              {catExtensions.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                  <Info className="w-4 h-4 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    This category only accepts: <span className="font-semibold">{catExtensions.map(e => e.toUpperCase()).join(', ')}</span> files
                  </p>
                </div>
              )}
              <FileUpload label="Attachments" onChange={setFiles} multiple allowedExtensions={catExtensions} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50">{saving ? 'Creating...' : 'Create Record'}</button>
              </div>
            </form>
          </Modal>
        )}

        {showEditModal && (
          <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Record" size="lg">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <FormInput label="Title" id="ert" value={form.title} onChange={e => setForm({...form, title: e.target.value})} error={errors.title?.[0]} required />
              <TextArea label="Description" id="erd" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
              <div className="grid grid-cols-2 gap-4">
                <SelectInput label="Category" id="erc" value={form.category_id} onChange={handleCategoryChange} placeholder="Select category" options={categories.map(c => ({ value: c.id, label: c.name }))} error={errors.category_id?.[0]} />
                <SelectInput label="Department" id="erdp" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} placeholder="Select department" options={departments.map(d => ({ value: d.id, label: d.name }))} error={errors.department_id?.[0]} disabled />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onConfirm={handleDelete} title="Delete Record" message={`Delete "${deletingRecord?.title}"? This will also delete all attached files.`} confirmText="Delete" />
      </div>
    );
  }

  // Render Admin/Super Admin Dashboard
  const stats = [
    { label: 'Total Records', value: data?.total_records || 0, icon: Files, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Departments', value: data?.total_departments || 0, icon: Building2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Active Users', value: data?.active_users || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pending', value: data?.pending_approvals || 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  const quickActions = [
    { label: 'New Record', icon: Plus, path: '/records', color: 'text-primary' },
    { label: 'View Users', icon: Users, path: '/users', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Departments', icon: Building2, path: '/departments', color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  const gridColor = isDark ? '#27272a' : '#f3f4f6';
  const tickColor = isDark ? '#71717a' : '#9ca3af';
  const hasChartData = chartData.some(d => d.records > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Here's an overview of your system.</p>
        </div>
        <div className="flex gap-2">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              <a.icon className={`w-3.5 h-3.5 ${a.color}`} /> {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-[18px] h-[18px] ${stat.color}`} />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-505 font-medium mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Approved', value: data?.approved_records || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Rejected', value: data?.rejected_records || 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Drafts', value: data?.draft_records || 0, icon: FileEdit, color: 'text-gray-500 dark:text-zinc-400', bg: 'bg-gray-100 dark:bg-zinc-800' },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
              <c.icon className={`w-[18px] h-[18px] ${c.color}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Overview</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Records Created</p>
            </div>
            <div className="relative">
              <select value={period} onChange={(e) => { setPeriod(e.target.value); setChartLoading(true); }}
                className="appearance-none pl-3 pr-8 py-1.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 outline-none cursor-pointer">
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div className="h-[260px]">
            {chartLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-gray-200 dark:border-zinc-700 border-t-primary rounded-full animate-spin" />
              </div>
            ) : hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8}
                    interval={period === 'today' ? 3 : period === '30days' ? 4 : 0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} allowDecimals={false} width={30} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderRadius: '12px', border: isDark ? '1px solid #27272a' : '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', fontSize: '13px', color: isDark ? '#fafafa' : '#111827' }}
                    formatter={(value) => [value, 'Records']} />
                  <Area type="monotone" dataKey="records" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <TrendingUp className="w-8 h-8 text-gray-200 dark:text-zinc-700 mb-2" />
                <p className="text-sm text-gray-400 dark:text-zinc-505">No activity data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {(data?.recent_activity || []).length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-8">No activity yet.</p>
            ) : (
              data.recent_activity.slice(0, 7).map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] text-gray-900 dark:text-white font-medium leading-snug">
                      <span className="font-semibold">{a.user?.name || 'System'}</span>{' '}
                      <span className="text-gray-500 dark:text-zinc-400">{a.action?.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Department Stats */}
      {data?.department_stats?.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Departments</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {data.department_stats.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{d.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 dark:text-zinc-400">{d.users_count}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 dark:text-zinc-400">{d.records_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
