import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  Users, Search, TrendingUp, CheckCircle2, XCircle, Clock,
  Files, Eye, ArrowRight, Shield, Building2, UserCheck, UserX,
  BarChart2, Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const roleColor = {
  'Super Admin': { bg: 'from-rose-500 to-pink-500',    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
  'Admin':       { bg: 'from-indigo-500 to-blue-500',  badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' },
  'Manager':     { bg: 'from-violet-500 to-purple-500',badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' },
  'Employee':    { bg: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  'Viewer':      { bg: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
};

const StatMini = ({ label, value, Icon, color }) => (
  <div className="text-center">
    <p className={`text-lg font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
  </div>
);

const TeamActivity = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // all | active | inactive | pending

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/manager/team');
      setMembers(res.data);
    } catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? m.status === 'active' :
      filter === 'inactive' ? m.status === 'inactive' :
      filter === 'pending'  ? m.pending > 0 : true;
    return matchSearch && matchFilter;
  });

  // Aggregated team stats
  const totalMembers  = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const totalPending  = members.reduce((s, m) => s + m.pending, 0);
  const totalApproved = members.reduce((s, m) => s + m.approved, 0);
  const topContributor= [...members].sort((a, b) => b.total - a.total)[0];

  if (loading) return <LoadingSpinner text="Loading team…" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-[11px] font-semibold">
            <Users className="w-3 h-3" /> Team Activity
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Team Monitoring</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Track your team's submissions, status, and productivity.</p>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: totalMembers,  Icon: Users,         color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Active',        value: activeMembers, Icon: UserCheck,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Pending Work',  value: totalPending,  Icon: Clock,         color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total Approved',value: totalApproved, Icon: CheckCircle2,  color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:shadow-md dark:hover:shadow-black/20 transition-shadow">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.Icon className={`w-[18px] h-[18px] ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 font-medium mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Contributor Banner */}
      {topContributor && topContributor.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800/40 rounded-2xl">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roleColor[topContributor.role]?.bg || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
            {topContributor.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-0.5">⭐ Top Contributor</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{topContributor.name}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{topContributor.total} records · {topContributor.approved} approved</p>
          </div>
          <button onClick={() => navigate(`/users/${topContributor.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-violet-200 dark:border-violet-800/40 rounded-lg text-xs font-medium text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
            View Profile <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* Filter & Search */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex gap-1">
            {[
              { value: 'all',      label: 'All' },
              { value: 'active',   label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending',  label: 'Has Pending' },
            ].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.value ? 'bg-primary/10 dark:bg-primary/15 text-primary' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input type="text" placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
          </div>
        </div>

        {/* Member Cards Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {filtered.map((member, i) => {
              const role   = member.role || 'Employee';
              const colors = roleColor[role] || roleColor['Employee'];
              const approvalRate = member.total > 0 ? Math.round((member.approved / member.total) * 100) : 0;

              return (
                <motion.div key={member.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/50 rounded-2xl overflow-hidden hover:shadow-md dark:hover:shadow-black/20 transition-all group">
                  {/* Card Header */}
                  <div className={`h-16 bg-gradient-to-r ${colors.bg} relative`}>
                    <div className="absolute bottom-0 right-4 translate-y-1/2">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white text-lg font-bold shadow-lg border-2 border-white dark:border-zinc-800`}>
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pt-8 pb-4">
                    {/* Name + status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{member.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          <Shield className="w-2.5 h-2.5" />{role}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          member.status === 'active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {member.status}
                        </span>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-2 py-3 border-y border-gray-100 dark:border-zinc-700/50 mb-3">
                      <StatMini label="Total"    value={member.total}    Icon={Files}        color="text-gray-900 dark:text-white" />
                      <StatMini label="Pending"  value={member.pending}  Icon={Clock}        color="text-amber-600 dark:text-amber-400" />
                      <StatMini label="Approved" value={member.approved} Icon={CheckCircle2} color="text-emerald-600 dark:text-emerald-400" />
                      <StatMini label="Rejected" value={member.rejected} Icon={XCircle}      color="text-red-600 dark:text-red-400" />
                    </div>

                    {/* Approval Rate Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500">Approval rate</span>
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-zinc-300">{approvalRate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${approvalRate}%` }} transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                          className={`h-full rounded-full ${approvalRate > 70 ? 'bg-emerald-500' : approvalRate > 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/users/${member.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-primary/40 hover:bg-primary/5 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 hover:text-primary transition-all">
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </button>
                      <button onClick={() => navigate(`/manager/approvals?uploaded_by=${member.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 hover:bg-primary/10 rounded-lg text-xs font-medium text-primary transition-all">
                        <Files className="w-3.5 h-3.5" /> Records
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamActivity;
