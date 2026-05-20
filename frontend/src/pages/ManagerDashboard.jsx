import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import {
  Users, Files, Clock, CheckCircle2, XCircle, FileEdit,
  ArrowRight, TrendingUp, ChevronDown, RefreshCw,
  AlertTriangle, ClipboardCheck, UserCheck, BarChart2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate   = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const gridColor = isDark ? '#27272a' : '#f3f4f6';
  const tickColor = isDark ? '#71717a' : '#9ca3af';

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.get('/manager/dashboard');
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    const t = setInterval(() => fetch(true), 30000);
    return () => clearInterval(t);
  }, [fetch]);

  if (loading) return <LoadingSpinner text="Loading manager dashboard…" />;

  const s = data?.stats || {};
  const chartData = (data?.chart_data || []).map(d => ({ name: d.label, records: d.count }));
  const hasChart  = chartData.some(d => d.records > 0);

  const pieData = (data?.category_breakdown || []).map(c => ({ name: c.name, value: c.count }));

  const statCards = [
    { label: 'Team Members',     value: s.team_members || 0,      Icon: Users,          color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', path: '/manager/team' },
    { label: 'Total Submissions',value: s.total_submissions || 0, Icon: Files,          color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', path: '/manager/records' },
    { label: 'Pending Review',   value: s.pending_approvals || 0, Icon: Clock,          color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  path: '/manager/approvals' },
    { label: 'Approved',         value: s.approved_records || 0,  Icon: CheckCircle2,   color: 'text-emerald-600 dark:text-emerald-400',bg:'bg-emerald-50 dark:bg-emerald-900/20',path: '/manager/records' },
    { label: 'Rejected',         value: s.rejected_records || 0,  Icon: XCircle,        color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',      path: '/manager/approvals' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-[11px] font-semibold">
              <ClipboardCheck className="w-3 h-3" /> Manager Panel
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Your team's activity and approval queue at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetch(true)} disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => navigate('/manager/approvals')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm shadow-primary/20 transition-colors">
            <ClipboardCheck className="w-4 h-4" /> Review Queue
            {s.pending_approvals > 0 && (
              <span className="ml-1 bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {s.pending_approvals}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Urgent Banner */}
      {s.pending_approvals > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            You have <strong>{s.pending_approvals}</strong> submission{s.pending_approvals > 1 ? 's' : ''} waiting for your review.
          </p>
          <button onClick={() => navigate('/manager/approvals')}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
            Review now <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.button key={card.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => navigate(card.path)}
            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-black/20 transition-all text-left group">
            <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.Icon className={`w-[18px] h-[18px] ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 font-medium mt-0.5">{card.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Submission Trend</h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Last 14 days — department records</p>
            </div>
            <BarChart2 className="w-4 h-4 text-gray-300 dark:text-zinc-600" />
          </div>
          <div className="h-[220px]">
            {hasChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="mgr-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8} interval={1} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} allowDecimals={false} width={28} />
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderRadius: '12px', border: isDark ? '1px solid #27272a' : '1px solid #e5e7eb', fontSize: '13px', color: isDark ? '#fafafa' : '#111827' }}
                    formatter={(v) => [v, 'Submissions']} />
                  <Area type="monotone" dataKey="records" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#mgr-grad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <TrendingUp className="w-8 h-8 text-gray-200 dark:text-zinc-700 mb-2" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">No submission data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">By Category</h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">Records per category</p>
          {pieData.length > 0 ? (
            <>
              <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: isDark ? '1px solid #27272a' : '1px solid #e5e7eb', backgroundColor: isDark ? '#18181b' : '#fff', color: isDark ? '#fafafa' : '#111827' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600 dark:text-zinc-300 truncate max-w-[110px]">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[160px] flex flex-col items-center justify-center">
              <Files className="w-8 h-8 text-gray-200 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-zinc-500">No data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Pending Queue + Recent Activity + Team Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Queue */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Pending Review
              {s.pending_approvals > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">{s.pending_approvals}</span>
              )}
            </h2>
            <button onClick={() => navigate('/manager/approvals')}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {!(data?.pending_review?.length) ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 dark:text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">All caught up!</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">No pending submissions.</p>
              </div>
            ) : (
              data.pending_review.slice(0, 5).map((rec, i) => (
                <motion.div key={rec.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/records/${rec.id}`)}>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <Files className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{rec.title}</p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                      {rec.uploader?.name} · {rec.category?.name} · {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <StatusBadge status={rec.status} />
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" />
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Activity + Team */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Team Activity</h2>
            <div className="space-y-3">
              {!(data?.recent_activity?.length) ? (
                <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">No activity yet.</p>
              ) : (
                data.recent_activity.slice(0, 6).map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] text-gray-700 dark:text-zinc-300 leading-snug">
                        <span className="font-semibold">{a.user?.name || 'System'}</span>{' '}
                        <span className="text-gray-400 dark:text-zinc-500">{a.action?.replace(/_/g, ' ')}</span>
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

          {/* Team Snapshot */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Team Snapshot</h2>
              <button onClick={() => navigate('/manager/team')} className="text-xs text-primary hover:underline flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {!(data?.member_stats?.length) ? (
                <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">No team members.</p>
              ) : (
                data.member_stats.slice(0, 4).map(m => (
                  <button key={m.id} onClick={() => navigate(`/users/${m.id}`)}
                    className="w-full flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg p-2 transition-colors text-left">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500">{m.total} records · {m.pending} pending</p>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
