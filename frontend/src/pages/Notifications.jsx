import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCheck, Clock, ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Pagination from '../components/ui/Pagination';
import { useDebounce } from '../hooks/useDebounce';

const TYPE_COLORS = {
  approval_request: 'bg-amber-50 dark:bg-amber-900/15 text-amber-500',
  record_approved: 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-500',
  record_rejected: 'bg-red-50 dark:bg-red-900/15 text-red-500',
  record_revision: 'bg-blue-50 dark:bg-blue-900/15 text-blue-500',
  welcome: 'bg-indigo-50 dark:bg-indigo-900/15 text-indigo-500',
  password_reset: 'bg-violet-50 dark:bg-violet-900/15 text-violet-500',
};

const Notifications = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchNotifications = async (p = page) => {
    try {
      const params = { page: p, per_page: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await api.get('/notifications', { params });
      setData(res.data);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(page); }, [page, debouncedSearch]);

  const markAsRead = async (n) => {
    if (n.read_at) return;
    try { await api.post(`/notifications/${n.id}/read`); fetchNotifications(); } catch {}
  };

  const markAllRead = async () => {
    try { await api.post('/notifications/read-all'); toast.success('All marked as read'); fetchNotifications(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Stay updated with system events.</p>
        </div>
        <button onClick={markAllRead} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
          <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <input type="text" placeholder="Search notifications..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none w-full transition-all" />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        {data.data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-8 h-8 text-gray-200 dark:text-zinc-700 mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{search ? 'No results found.' : "You're all caught up!"}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {data.data.map((n, i) => {
              const colors = TYPE_COLORS[n.type] || TYPE_COLORS.welcome;
              const [bg, , textColor] = colors.split(' ');
              return (
                <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  onClick={() => { markAsRead(n); if (n.link) navigate(n.link); }}
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors ${!n.read_at ? 'bg-primary/[0.02] dark:bg-primary/[0.03]' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg ${colors.split(' ').slice(0, 2).join(' ')} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Bell className={`w-4 h-4 ${colors.split(' ')[2]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                      {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {n.link && <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 shrink-0 mt-1" />}
                </motion.div>
              );
            })}
          </div>
        )}
        <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} perPage={data.per_page} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default Notifications;
