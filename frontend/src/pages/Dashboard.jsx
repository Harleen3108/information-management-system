import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Files, 
  Building2, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Mon', records: 40 },
  { name: 'Tue', records: 30 },
  { name: 'Wed', records: 65 },
  { name: 'Thu', records: 45 },
  { name: 'Fri', records: 90 },
  { name: 'Sat', records: 25 },
  { name: 'Sun', records: 15 },
];

const Dashboard = () => {
    const { user } = useAuth();

    const stats = [
        { 
          label: 'Total Records', 
          value: '2,845', 
          icon: Files, 
          color: 'bg-indigo-500', 
          trend: '+12.5%', 
          isUp: true 
        },
        { 
          label: 'Departments', 
          value: '14', 
          icon: Building2, 
          color: 'bg-emerald-500', 
          trend: '+2', 
          isUp: true 
        },
        { 
          label: 'Active Users', 
          value: '156', 
          icon: Users, 
          color: 'bg-amber-500', 
          trend: '+5.2%', 
          isUp: true 
        },
        { 
          label: 'Pending Approvals', 
          value: '38', 
          icon: Clock, 
          color: 'bg-rose-500', 
          trend: '-4.1%', 
          isUp: false 
        },
    ];

    const recentActivity = [
      { id: 1, user: 'John Doe', action: 'Created record', target: 'Project Alpha Docs', time: '2 hours ago', status: 'success' },
      { id: 2, user: 'Sarah Smith', action: 'Approved department', target: 'Engineering', time: '4 hours ago', status: 'success' },
      { id: 3, user: 'Mike Johnson', action: 'Deleted record', target: 'Old Archive 2023', time: '6 hours ago', status: 'error' },
      { id: 4, user: 'Emily Davis', action: 'Updated user role', target: 'Admin -> Moderator', time: 'Yesterday', status: 'warning' },
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
                <p className="text-slate-500 mt-1">Here's what's happening in your system today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start">
                            <div className={`${stat.color} p-3 rounded-2xl shadow-lg shadow-current/20`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
                              stat.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                            }`}>
                              {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span>{stat.trend}</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</h3>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Charts Section */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 text-left">Record Submissions</h2>
                    <p className="text-slate-400 text-sm text-left">Weekly activity overview</p>
                  </div>
                  <TrendingUp className="text-primary w-5 h-5" />
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="records" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRecords)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6 text-left">Recent Activity</h2>
                <div className="space-y-6">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex space-x-4">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        activity.status === 'success' ? 'bg-emerald-500' : 
                        activity.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">{activity.user}</p>
                        <p className="text-xs text-slate-500">
                          {activity.action} <span className="text-primary font-medium">{activity.target}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
        </div>
    );
};

export default Dashboard;
