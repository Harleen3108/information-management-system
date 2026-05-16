import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Activity, Search, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Pagination from '../components/ui/Pagination';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const ACTION_COLORS = {
  login: 'bg-blue-500', logout: 'bg-gray-400', user_created: 'bg-emerald-500', user_updated: 'bg-amber-500',
  user_deleted: 'bg-red-500', user_status_changed: 'bg-violet-500', password_changed: 'bg-indigo-500',
  record_created: 'bg-blue-500', record_updated: 'bg-amber-500', record_deleted: 'bg-red-500', record_submitted: 'bg-cyan-500',
  record_approved: 'bg-emerald-500', record_rejected: 'bg-red-500', record_returned: 'bg-orange-500',
  department_created: 'bg-emerald-500', department_updated: 'bg-amber-500', department_deleted: 'bg-red-500',
  settings_updated: 'bg-violet-500',
};

const ActivityLogs = () => {
  const toast = useToast();
  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actions, setActions] = useState([]);
  const debouncedSearch = useDebounce(search, 400);

  const fetchLogs = async (p = page) => {
    try {
      const params = { page: p, per_page: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/activity-logs', { params });
      setData(res.data);
    } catch { toast.error('Failed to load activity logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { api.get('/activity-logs/actions').then(r => setActions(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchLogs(page); }, [page, debouncedSearch, actionFilter]);

  if (loading) return <LoadingSpinner text="Loading activity logs..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Logs</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Track system actions and user activities.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input type="text" placeholder="Search logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all" />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 outline-none min-w-[150px]">
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {data.data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Activity className="w-8 h-8 text-gray-200 dark:text-zinc-700 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{search ? 'No results found.' : 'No logs to display.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {data.data.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${ACTION_COLORS[log.action] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user?.name || 'System'}</span>
                    <span className="text-sm text-gray-500 dark:text-zinc-400">{log.action?.replace(/_/g, ' ')}</span>
                    {log.model_type && <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded font-medium">{log.model_type} #{log.model_id}</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {log.ip_address && <span className="ml-2">· IP: {log.ip_address}</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} perPage={data.per_page} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default ActivityLogs;
