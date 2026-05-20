import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  ClipboardCheck, Search, Filter, CheckCircle2, XCircle, RotateCcw,
  Clock, Eye, Files, ChevronDown, User, Tag, Calendar, X,
  MessageSquare, AlertCircle, FileText, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import TextArea from '../components/ui/TextArea';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const STATUS_TABS = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'pending' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Approved',  value: 'approved' },
  { label: 'Rejected',  value: 'rejected' },
];

const ManagerApprovals = () => {
  const navigate  = useNavigate();
  const toast     = useToast();

  const [records, setRecords]       = useState([]);
  const [meta, setMeta]             = useState({});
  const [categories, setCategories] = useState([]);
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  // Filters
  const [statusTab, setStatusTab]   = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [search, setSearch]         = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // Action modal
  const [actionModal, setActionModal] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [actionType, setActionType] = useState('');   // review | approve | reject | return
  const [comments, setComments]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMeta = useCallback(async () => {
    const [cRes, tRes] = await Promise.all([api.get('/categories'), api.get('/manager/team')]);
    setCategories(cRes.data);
    setMembers(tRes.data);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 12 };
      if (statusTab)      params.status      = statusTab;
      if (catFilter)      params.category_id = catFilter;
      if (memberFilter)   params.uploaded_by = memberFilter;
      if (debouncedSearch) params.search     = debouncedSearch;
      const res = await api.get('/manager/records', { params });
      setRecords(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [page, statusTab, catFilter, memberFilter, debouncedSearch]);

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { setPage(1); }, [statusTab, catFilter, memberFilter, debouncedSearch]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const openAction = (record, type) => {
    setActiveRecord(record);
    setActionType(type);
    setComments('');
    setActionModal(true);
  };

  const handleAction = async () => {
    if ((actionType === 'reject' || actionType === 'return') && !comments.trim()) {
      toast.error('Comments are required for this action.'); return;
    }
    setSubmitting(true);
    try {
      await api.post(`/records/${activeRecord.id}/${actionType}`, { comments });
      toast.success(
        actionType === 'review'  ? 'Moved to In Review' :
        actionType === 'approve' ? 'Record approved ✓' :
        actionType === 'reject'  ? 'Record rejected'   : 'Returned for revision'
      );
      setActionModal(false);
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setSubmitting(false); }
  };

  const actionConfig = {
    review:  { label: 'Move to In Review', color: 'bg-amber-600',   textColor: 'text-amber-700 dark:text-amber-400',  Icon: Clock },
    approve: { label: 'Approve',           color: 'bg-emerald-600', textColor: 'text-emerald-700 dark:text-emerald-400', Icon: CheckCircle2 },
    reject:  { label: 'Reject',            color: 'bg-red-600',     textColor: 'text-red-700 dark:text-red-400',      Icon: XCircle },
    return:  { label: 'Return for Revision',color:'bg-blue-600',    textColor: 'text-blue-700 dark:text-blue-400',    Icon: RotateCcw },
  };

  const pendingCount = records.filter(r => r.status === 'pending' || r.status === 'in_review').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-[11px] font-semibold">
              <ClipboardCheck className="w-3 h-3" /> Approval Queue
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Review & Approve Submissions</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Validate your team's submissions and manage the approval workflow.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatusTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusTab === tab.value
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary'
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input type="text" placeholder="Search records…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
          </div>

          {/* Category */}
          <div className="relative">
            <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary appearance-none">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Member */}
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)}
              className="pl-8 pr-7 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary appearance-none">
              <option value="">All Members</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-100 dark:border-zinc-800 text-left">
                {['Record', 'Submitted By', 'Category', 'Files', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={7} className="py-20 text-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <ClipboardCheck className="w-8 h-8 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No records found</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Try adjusting your filters</p>
                </td></tr>
              ) : (
                <AnimatePresence>
                  {records.map((rec, i) => (
                    <motion.tr key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 max-w-[220px]">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{rec.title}</p>
                        {rec.description && <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{rec.description}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/80 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {rec.uploader?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[100px]">{rec.uploader?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                          <Tag className="w-2.5 h-2.5" />{rec.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-zinc-400">{rec.documents?.length || 0}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                        {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={rec.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {/* View */}
                          <button onClick={() => navigate(`/records/${rec.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-[11px] font-semibold transition-colors" title="View Record">
                            <Eye className="w-3 h-3" /> View
                          </button>
                          {/* Move to Review */}
                          {rec.status === 'pending' && (
                            <button onClick={() => openAction(rec, 'review')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-[11px] font-semibold transition-colors" title="Move to In Review">
                              <Clock className="w-3 h-3" /> Review
                            </button>
                          )}
                          {/* Approve */}
                          {['pending', 'in_review'].includes(rec.status) && (
                            <button onClick={() => openAction(rec, 'approve')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg text-[11px] font-semibold transition-colors" title="Approve">
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                          )}
                          {/* Reject */}
                          {['pending', 'in_review'].includes(rec.status) && (
                            <button onClick={() => openAction(rec, 'reject')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-[11px] font-semibold transition-colors" title="Reject">
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          )}
                          {/* Return */}
                          {['pending', 'in_review'].includes(rec.status) && (
                            <button onClick={() => openAction(rec, 'return')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-[11px] font-semibold transition-colors" title="Return for Revision">
                              <RotateCcw className="w-3 h-3" /> Revision
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Showing {meta.from}–{meta.to} of {meta.total}
            </p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                Previous
              </button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Modal isOpen={actionModal} onClose={() => setActionModal(false)}
        title={actionConfig[actionType]?.label || 'Action'} size="sm">
        {activeRecord && (
          <div className="space-y-4">
            {/* Record Preview */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeRecord.title}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{activeRecord.uploader?.name} · {activeRecord.category?.name}</p>
              </div>
              <StatusBadge status={activeRecord.status} />
            </div>

            {/* Action explanation messages */}
            {(actionType === 'reject' || actionType === 'return') && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {actionType === 'reject' ? 'Rejection' : 'Revision feedback'} will be sent directly to the employee. Comments are required.
                </p>
              </div>
            )}
            {actionType === 'approve' && (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/10 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  This will approve the record and forward it to the Admin for final system storage.
                </p>
              </div>
            )}

            <TextArea
              label={`Comments ${(actionType === 'reject' || actionType === 'return') ? '(required)' : '(optional)'}`}
              id="mgr-comment"
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder={
                actionType === 'approve' ? 'Optional approval note…' :
                actionType === 'review'  ? 'Optional note…' :
                actionType === 'reject'  ? 'Explain why this is rejected…' :
                'Describe what needs to be corrected…'
              }
            />

            <div className="flex gap-3">
              <button onClick={() => setActionModal(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleAction} disabled={submitting}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm disabled:opacity-50 ${actionConfig[actionType]?.color}`}>
                {submitting ? 'Processing…' : actionConfig[actionType]?.label}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerApprovals;
