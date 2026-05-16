import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import {
  Files, Building2, Users, TrendingUp, Clock, CheckCircle2, XCircle, FileEdit, ChevronDown,
  Plus, ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'year', label: 'This Year' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchDashboard = useCallback(async (showChartSpinner = false) => {
    if (showChartSpinner) setChartLoading(true);
    try {
      const res = await api.get('/dashboard', { params: { period } });
      setData(res.data);
      setChartData((res.data.chart_data || []).map(item => ({ name: item.label, records: item.count })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); setChartLoading(false); }
  }, [period]);

  // Fetch on mount + period change
  useEffect(() => { fetchDashboard(true); }, [fetchDashboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchDashboard(false), 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Re-fetch when page gains focus (user returns from another tab)
  useEffect(() => {
    const onFocus = () => fetchDashboard(false);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDashboard]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

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
            <p className="text-xs text-gray-500 dark:text-zinc-500 font-medium mt-0.5">{stat.label}</p>
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
                <p className="text-sm text-gray-400 dark:text-zinc-500">No activity data available.</p>
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
