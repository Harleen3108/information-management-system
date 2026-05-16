import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Files, Plus, Search, Eye, Trash2, Send, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormInput from '../components/ui/FormInput';
import TextArea from '../components/ui/TextArea';
import SelectInput from '../components/ui/SelectInput';
import FileUpload from '../components/ui/FileUpload';
import StatusBadge from '../components/ui/StatusBadge';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const Records = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [records, setRecords] = useState({ data: [], current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', department_id: '', status: 'draft' });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const canCreate = can('records.create');
  const canDelete = can('records.delete');
  const canSubmit = can('records.submit');
  const canDownload = can('records.download');

  const fetchRecords = async (p = page) => {
    try {
      const params = { page: p, per_page: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department_id = deptFilter;
      const res = await api.get('/records', { params });
      setRecords(res.data);
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    try {
      const [d, c] = await Promise.all([api.get('/departments'), api.get('/categories')]);
      setDepartments(d.data); setCategories(c.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchRecords(page); }, [page, debouncedSearch, statusFilter, deptFilter]);

  const openCreate = () => { setForm({ title: '', description: '', category_id: '', department_id: '', status: 'draft' }); setFiles([]); setErrors({}); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      files.forEach(f => fd.append('files[]', f));
      await api.post('/records', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Record created'); setShowModal(false); fetchRecords();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error('Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await api.delete(`/records/${deleting.id}`); toast.success('Record deleted'); fetchRecords(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleSubmitForApproval = async (record) => {
    try { await api.post(`/records/${record.id}/submit`); toast.success('Submitted for approval'); fetchRecords(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/attachments/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', doc.file_name);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading records..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Records</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Manage documents and records.</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> New Record
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input type="text" placeholder="Search records..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 outline-none min-w-[130px]">
          <option value="">All Status</option>
          <option value="draft">Draft</option><option value="pending">Pending</option><option value="approved">Approved</option>
          <option value="rejected">Rejected</option><option value="revision">Revision</option><option value="archived">Archived</option>
        </select>
        <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 outline-none min-w-[150px]">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100 dark:border-zinc-800">
                {['Title', 'Category', 'Department', 'Status', 'Created By', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {records.data.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-16 text-center">
                  <Files className="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No records found</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{canCreate ? 'Create your first record.' : 'No records available.'}</p>
                </td></tr>
              ) : records.data.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3">
                    <button onClick={() => navigate(`/records/${r.id}`)} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary text-left">{r.title}</button>
                    {r.documents?.length > 0 && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{r.documents.length} file(s)</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-zinc-400">{r.category?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-zinc-400">{r.department?.name || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-zinc-400">{r.uploader?.name || '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 dark:text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-0.5">
                      <button onClick={() => navigate(`/records/${r.id}`)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      {canDownload && r.documents?.length > 0 && (
                        <button onClick={() => handleDownload(r.documents[0])} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600" title="Download"><Download className="w-3.5 h-3.5" /></button>
                      )}
                      {canSubmit && (r.status === 'draft' || r.status === 'revision') && (
                        <button onClick={() => handleSubmitForApproval(r)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600" title="Submit"><Send className="w-3.5 h-3.5" /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => { setDeleting(r); setShowDelete(true); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={records.current_page} lastPage={records.last_page} total={records.total} perPage={records.per_page} onPageChange={setPage} />
      </div>

      {canCreate && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Record" size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Title" id="rt" value={form.title} onChange={e => setForm({...form, title: e.target.value})} error={errors.title?.[0]} required />
            <TextArea label="Description" id="rd" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Category" id="rc" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} placeholder="Select category" options={categories.map(c => ({ value: c.id, label: c.name }))} error={errors.category_id?.[0]} />
              <SelectInput label="Department" id="rdp" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} placeholder="Select department" options={departments.map(d => ({ value: d.id, label: d.name }))} error={errors.department_id?.[0]} />
            </div>
            <FileUpload label="Attachments" onChange={setFiles} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50">{saving ? 'Creating...' : 'Create Record'}</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Record" message={`Delete "${deleting?.title}"? This will also delete all attached files.`} confirmText="Delete" />
    </div>
  );
};

export default Records;
