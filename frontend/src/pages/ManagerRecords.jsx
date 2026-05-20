import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  Files, Search, Tag, User, Eye, CheckCircle2,
  XCircle, RotateCcw, Clock, X, Filter, Download,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import TextArea from '../components/ui/TextArea';
import { useDebounce } from '../hooks/useDebounce';

const STATUS_TABS = [
  { label: 'All',          value: '' },
  { label: 'Pending',      value: 'pending' },
  { label: 'In Review',    value: 'in_review' },
  { label: 'Approved',     value: 'approved' },
  { label: 'Rejected',     value: 'rejected' },
  { label: 'Needs Revision', value: 'returned' },
];

const actionConfig = {
  review:  { label: 'Move to In Review',  color: 'bg-amber-600',   Icon: Clock },
  approve: { label: 'Approve',            color: 'bg-emerald-600', Icon: CheckCircle2 },
  reject:  { label: 'Reject',             color: 'bg-red-600',     Icon: XCircle },
  return:  { label: 'Return for Revision',color: 'bg-blue-600',    Icon: RotateCcw },
};

const ManagerRecords = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();

  const [records,    setRecords]    = useState([]);
  const [meta,       setMeta]       = useState({});
  const [categories, setCategories] = useState([]);
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);

  // Filters
  const [statusTab,    setStatusTab]    = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('created_at');
  const [sortDir,      setSortDir]      = useState('desc');

  const debouncedSearch = useDebounce(search, 400);

  // Action modal
  const [actionModal,  setActionModal]  = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [actionType,   setActionType]   = useState('');
  const [comments,     setComments]     = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  const fetchMeta = useCallback(async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get('/categories'),
        api.get('/manager/team'),
      ]);
      setCategories(cRes.data || []);
      setMembers(tRes.data || []);
    } catch {}
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 15, sort_by: sortBy, sort_dir: sortDir };
      if (statusTab)       params.status      = statusTab;
      if (catFilter)       params.category_id = catFilter;
      if (memberFilter)    params.uploaded_by = memberFilter;
      if (debouncedSearch) params.search      = debouncedSearch;
      const res = await api.get('/manager/records', { params });
      setRecords(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch { toast.error('Failed to load records'); }
    finally { setLoading(false); }
  }, [page, statusTab, catFilter, memberFilter, debouncedSearch, sortBy, sortDir]);

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { setPage(1); }, [statusTab, catFilter, memberFilter, debouncedSearch]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Pre-fill member filter from query param (linked from Team Activity)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ub = params.get('uploaded_by');
    if (ub) setMemberFilter(ub);
  }, []);

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

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronDown className="w-3 h-3 text-gray-300 dark:text-zinc-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const clearFilters = () => {
    setStatusTab('');
    setCatFilter('');
    setMemberFilter('');
    setSearch('');
  };

  const hasFilters = statusTab || catFilter || memberFilter || search;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-[11px] font-semibold">
              <Files className="w-3 h-3" /> Records
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">All Team Records</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Browse, filter, and manage every record submitted by your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Panel ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">

        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 overflow-x-auto pb-0 border-b border-gray-100 dark:border-zinc-800">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                statusTab === tab.value
                  ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3.5 bg-gray-50/50 dark:bg-zinc-800/30">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search records, keywords…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category */}
          <div className="relative">
            <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Member */}
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <select
              value={memberFilter}
              onChange={e => setMemberFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">All Members</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/40">
                {[
                  { label: 'Record',       col: 'title' },
                  { label: 'Submitted By', col: null },
                  { label: 'Category',     col: null },
                  { label: 'Files',        col: null },
                  { label: 'Date',         col: 'created_at' },
                  { label: 'Status',       col: 'status' },
                  { label: 'Actions',      col: null },
                ].map(h => (
                  <th
                    key={h.label}
                    onClick={h.col ? () => toggleSort(h.col) : undefined}
                    className={`px-5 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap select-none ${h.col ? 'cursor-pointer hover:text-gray-700 dark:hover:text-zinc-300' : ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {h.label}
                      {h.col && <SortIcon col={h.col} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Files className="w-10 h-10 text-gray-200 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No records found</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                      {hasFilters ? 'Try adjusting your filters' : 'No records yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {records.map((rec, i) => (
                    <motion.tr
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Record title */}
                      <td className="px-5 py-3.5 max-w-[220px]">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {rec.title}
                        </p>
                        {rec.description && (
                          <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate mt-0.5">{rec.description}</p>
                        )}
                      </td>

                      {/* Uploader */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500/80 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {rec.uploader?.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[100px]">
                            {rec.uploader?.name}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                          <Tag className="w-2.5 h-2.5" />
                          {rec.category?.name || '—'}
                        </span>
                      </td>

                      {/* Files */}
                      <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Files className="w-3.5 h-3.5" />
                          {rec.documents?.length || 0}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap">
                        {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={rec.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => navigate(`/records/${rec.id}`)}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Move to Review */}
                          {rec.status === 'pending' && (
                            <button
                              onClick={() => openAction(rec, 'review')}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                              title="Move to In Review"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Approve */}
                          {['pending', 'in_review'].includes(rec.status) && (
                            <button
                              onClick={() => openAction(rec, 'approve')}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reject */}
                          {['pending', 'in_review'].includes(rec.status) && (
                            <button
                              onClick={() => openAction(rec, 'reject')}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Return */}
                          {['pending', 'in_review'].includes(rec.status) && (
                            <button
                              onClick={() => openAction(rec, 'return')}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                              title="Return for Revision"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Showing {meta.from}–{meta.to} of <span className="font-semibold text-gray-700 dark:text-zinc-300">{meta.total}</span> records
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              {meta.last_page > 7 && (
                <>
                  <span className="text-gray-400 self-center">…</span>
                  <button
                    onClick={() => setPage(meta.last_page)}
                    className="w-7 h-7 text-xs rounded-lg font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {meta.last_page}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Action Modal ── */}
      <Modal
        isOpen={actionModal}
        onClose={() => setActionModal(false)}
        title={actionConfig[actionType]?.label || 'Action'}
        size="sm"
      >
        {activeRecord && (
          <div className="space-y-4">
            {/* Record preview */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                <Files className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeRecord.title}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{activeRecord.uploader?.name} · {activeRecord.category?.name}</p>
              </div>
              <StatusBadge status={activeRecord.status} />
            </div>

            {(actionType === 'reject' || actionType === 'return') && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {actionType === 'reject' ? 'Rejection reason' : 'Revision feedback'} will be sent directly to the employee. Comments are required.
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
              id="mgr-rec-comment"
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
              <button
                onClick={() => setActionModal(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                className={`flex-1 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm disabled:opacity-50 transition-opacity ${actionConfig[actionType]?.color}`}
              >
                {submitting ? 'Processing…' : actionConfig[actionType]?.label}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerRecords;
