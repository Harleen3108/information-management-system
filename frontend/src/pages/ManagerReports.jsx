import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart2, Download, Printer, RefreshCw, Calendar,
  TrendingUp, Users, CheckCircle2, AlertTriangle, FileText,
  PieChart as PieIcon, Award, ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell,
  PieChart, Pie,
} from 'recharts';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ManagerReports = () => {
  const toast = useToast();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('Last 14 Days');

  const gridColor = isDark ? '#27272a' : '#f3f4f6';
  const tickColor = isDark ? '#71717a' : '#9ca3af';

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/manager/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner text="Generating reports..." />;

  const s = data?.stats || {};
  const chartData = (data?.chart_data || []).map(d => ({ name: d.label, submissions: d.count }));
  const categoryData = (data?.category_breakdown || []).map(c => ({ name: c.name, value: c.count }));
  const memberData = (data?.member_stats || []).map(m => ({ name: m.name, approved: m.approved, total: m.total }));

  const total = s.total_submissions || 0;
  const approved = s.approved_records || 0;
  const rejected = s.rejected_records || 0;
  const pending = s.pending_approvals || 0;
  const draft = s.draft_records || 0;

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="space-y-6 print:space-y-4 print:p-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-[11px] font-semibold">
              <BarChart2 className="w-3 h-3" /> Reports & Analytics
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Department Performance</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Analyze submission trends, category distributions, and team performance metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Report
          </button>
        </div>
      </div>

      {/* ── Print-only Header ── */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Department Performance Report</h1>
        <p className="text-xs text-gray-500 mt-1">
          Generated on: {new Date().toLocaleString()} | Scoped to: Manager Department
        </p>
      </div>

      {/* ── KPI Summary Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: total, Icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Approval Rate', value: `${approvalRate}%`, Icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Pending Review', value: pending, Icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Rejection Rate', value: total > 0 ? `${Math.round((rejected / total) * 100)}%` : '0%', Icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm print:border print:shadow-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Submission Trend Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 print:border shadow-sm print:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Submission History</h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Timeline distribution of uploads</p>
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Last 14 Days
            </span>
          </div>

          <div className="h-[260px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 11 }} dx={-8} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f1f23' : '#ffffff',
                      border: isDark ? '1px solid #27272a' : '1px solid #e5e7eb',
                      borderRadius: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="submissions" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-gray-400">
                <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">No chart data to display</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Category breakdown pie chart ── */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 print:border shadow-sm print:shadow-none">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Categories</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-6">Distribution by category classification</p>

          <div className="h-[180px] relative flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-gray-400">
                <PieIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">No records categorized yet</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 max-h-[100px] overflow-y-auto">
            {categoryData.map((c, idx) => (
              <div key={c.name} className="flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate max-w-[120px]">{c.name}</span>
                </div>
                <span className="font-bold text-gray-800 dark:text-zinc-200">{c.value} ({total > 0 ? Math.round((c.value / total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Team Performance Bar Chart & Detail List ── */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 print:border shadow-sm print:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Team Activity & Submissions</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Individual contribution distribution</p>
          </div>
          <Award className="w-4 h-4 text-violet-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[220px]">
            {memberData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Total Submissions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center flex-col text-gray-400">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">No team members data found</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Key Contributors</h4>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {[...(data?.member_stats || [])]
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((m, idx) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">#{idx + 1}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{m.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">Approved: {m.approved} / {m.total}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">{m.total}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerReports;
