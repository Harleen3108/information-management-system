import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Shield, Sun, Moon, Menu, X, ArrowRight, Play,
  Database, Users, Building2, FileCheck, Activity,
  BarChart3, Lock, Search, CheckCircle2, Star,
  Zap, Globe, Award, ThumbsUp, ChevronRight,
  FolderOpen, Bell, Settings2, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── tiny reusable pieces ────────────────────────────── */

const NavLink = ({ href, children }) => (
  <a href={href}
    className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-indigo-400 transition-colors">
    {children}
  </a>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
    bg-primary/10 text-primary dark:bg-indigo-500/15 dark:text-indigo-300 border border-primary/20 dark:border-indigo-500/25">
    {children}
  </span>
);

const SectionLabel = ({ children, light }) => (
  <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-3 ${light ? 'text-indigo-200' : 'text-primary'}`}>
    {children}
  </p>
);

const FloatCard = ({ className, children }) => (
  <div className={`absolute bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 p-3 ${className}`}>
    {children}
  </div>
);

/* ─── section: Navbar ─────────────────────────────────── */
const Navbar = ({ isDark, toggleTheme }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-sm'
        : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-400 rounded-xl flex items-center justify-center shadow shadow-primary/30">
              <Shield className="text-white w-4 h-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
              IMS<span className="text-primary">Portal</span>
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#why">About</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#services">Services</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover
                text-white text-sm font-semibold shadow-sm shadow-primary/25 transition-colors">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Mobile menu toggle */}
            <button onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
            <div className="px-4 py-4 flex flex-col gap-4">
              {['Home', 'About', 'Features', 'Services', 'Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}
                  className="text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-primary transition-colors">
                  {l}
                </a>
              ))}
              <Link to="/login" onClick={() => setOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold">
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

/* ─── section: Hero ───────────────────────────────────── */
const Hero = () => (
  <section id="home" className="pt-24 pb-16 lg:pt-32 lg:pb-24 relative overflow-hidden">
    {/* bg blobs */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 dark:bg-primary/[0.07] blur-3xl -z-0 translate-x-1/3 -translate-y-1/3" />
    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-indigo-100/60 dark:bg-indigo-900/15 blur-3xl -z-0" />

    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">

        {/* Left: copy */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
          <Badge><Zap className="w-3 h-3" /> Welcome to IMS Portal</Badge>

          <h1 className="mt-5 text-4xl lg:text-5xl xl:text-[3.4rem] font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
            Information Management{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-white px-2 rounded-md bg-primary">System</span>
            </span>
          </h1>
          <h1 className="text-4xl lg:text-5xl xl:text-[3.4rem] font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white mt-1">
            Built for Teams.
          </h1>

          <p className="mt-5 text-base text-gray-500 dark:text-zinc-400 leading-relaxed max-w-lg">
            Centralise every record, streamline approvals, manage departments, and
            gain real-time insights — all from one secure, role-based platform.
          </p>

          <div className="mt-8 flex items-center gap-4 flex-wrap">
            <Link to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover
                text-white font-semibold text-sm shadow-md shadow-primary/25 transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#why"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-700
                text-gray-700 dark:text-zinc-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                <Play className="w-3 h-3 text-primary fill-primary" />
              </div>
              Learn More
            </a>
          </div>

          {/* trust row */}
          <div className="mt-8 flex items-center gap-6">
            {[['500+', 'Users'], ['10K+', 'Records'], ['99.9%', 'Uptime']].map(([v, l]) => (
              <div key={l}>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{v}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: dashboard mockup + floating cards */}
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }} className="relative">

          {/* purple bg blob */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-indigo-300/20 dark:from-primary/10 dark:to-indigo-900/20 rounded-3xl blur-2xl scale-110" />

          {/* mock dashboard panel */}
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-zinc-700
            bg-white dark:bg-zinc-900 shadow-2xl shadow-gray-200/60 dark:shadow-black/40">
            {/* browser bar */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="flex-1 mx-3 h-5 bg-gray-200 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* dashboard body */}
            <div className="p-5 space-y-4">
              {/* top stat row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Records', value: '10,248', color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Pending', value: '34', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Approved', value: '9,821', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* dotted line chart */}
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Records This Week</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-indigo-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Records
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Approved
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Pending
                    </span>
                  </div>
                </div>
                {(() => {
                  const records  = [30, 58, 42, 75, 63, 88, 54];
                  const approved = [20, 45, 35, 60, 50, 72, 44];
                  const pending  = [10, 13,  7, 15, 13, 16, 10];
                  const days = ['M','T','W','T','F','S','S'];
                  const W = 280, H = 70, padX = 10, padY = 8;
                  const toX = i => padX + i * ((W - padX * 2) / 6);
                  const toY = v => H - padY - (v / 100) * (H - padY * 2);
                  const pts  = arr => arr.map((v, i) => [toX(i), toY(v)]);
                  const pl   = arr => pts(arr).map(([x,y]) => `${x},${y}`).join(' ');
                  const area = arr => {
                    const p = pts(arr);
                    return `${pl(arr)} ${toX(6)},${H - padY + 4} ${toX(0)},${H - padY + 4}`;
                  };
                  return (
                    <svg viewBox={`0 0 ${W} ${H + 10}`} className="w-full" style={{ height: 76 }}>
                      <defs>
                        <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gr2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="gr3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* area fills */}
                      <polygon points={area(records)}  fill="url(#gr1)" />
                      <polygon points={area(approved)} fill="url(#gr2)" />
                      <polygon points={area(pending)}  fill="url(#gr3)" />
                      {/* dotted lines */}
                      <polyline points={pl(records)}  fill="none" stroke="#6366f1" strokeWidth="2"
                        strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points={pl(approved)} fill="none" stroke="#10b981" strokeWidth="2"
                        strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points={pl(pending)}  fill="none" stroke="#f59e0b" strokeWidth="2"
                        strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
                      {/* dots */}
                      {pts(records).map(([x,y], i)  => <circle key={`r${i}`}  cx={x} cy={y} r="3"   fill="#6366f1" stroke="white" strokeWidth="1.5" />)}
                      {pts(approved).map(([x,y], i) => <circle key={`a${i}`}  cx={x} cy={y} r="3"   fill="#10b981" stroke="white" strokeWidth="1.5" />)}
                      {pts(pending).map(([x,y], i)  => <circle key={`p${i}`}  cx={x} cy={y} r="2.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />)}
                      {/* day labels */}
                      {days.map((d, i) => (
                        <text key={i} x={toX(i)} y={H + 4} textAnchor="middle"
                          fontSize="7.5" fill="#9ca3af" dominantBaseline="hanging">{d}</text>
                      ))}
                    </svg>
                  );
                })()}
              </div>

              {/* fake record rows */}
              {[
                { title: 'Financial Report Q2', dept: 'Finance', status: 'Approved' },
                { title: 'HR Policy Update', dept: 'Human Resources', status: 'Pending' },
                { title: 'IT Infrastructure Plan', dept: 'IT', status: 'Approved' },
              ].map(r => (
                <div key={r.title} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{r.title}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500">{r.dept}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                    ${r.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* floating card: total records */}
          <FloatCard className="top-4 -left-10 min-w-[130px]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">Total Records</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">10,248</p>
              </div>
            </div>
          </FloatCard>

          {/* floating card: active users */}
          <FloatCard className="-bottom-4 -left-8 min-w-[150px]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400">Active Users</p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">+127 <span className="text-xs font-normal text-emerald-500">online now</span></p>
            <div className="flex -space-x-1.5 mt-2">
              {['bg-primary', 'bg-emerald-500', 'bg-amber-400', 'bg-rose-400', 'bg-indigo-300'].map((c, i) => (
                <div key={i} className={`w-5 h-5 rounded-full ${c} border-2 border-white dark:border-zinc-800`} />
              ))}
            </div>
          </FloatCard>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ─── section: Why ────────────────────────────────────── */
const Why = () => {
  const cards = [
    {
      icon: Search,
      title: 'Smart Record Search',
      desc: 'Find any document in seconds with full-text search, filters by category, department, date, and status.',
      highlight: true,
    },
    {
      icon: Lock,
      title: 'Role-Based Access',
      desc: 'Admins, managers, and staff each see exactly what they need — nothing more, nothing less.',
    },
    {
      icon: CheckCircle2,
      title: 'Compliance Ready',
      desc: 'Every action is logged with timestamps and user identity, giving you a complete, tamper-proof audit trail.',
    },
  ];

  return (
    <section id="why" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-center">
          {/* Left label */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <SectionLabel>Why Choose IMS?</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              Why Your Organisation<br />Needs IMS?
            </h2>
            <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs">
              Stop managing information across spreadsheets, emails, and shared folders.
              IMS gives your team a single source of truth.
            </p>
          </motion.div>

          {/* Right: 3 cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <motion.div key={c.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-2xl p-6 ${c.highlight
                  ? 'bg-gradient-to-br from-[#4f46e5] to-[#6366f1] text-white shadow-lg shadow-primary/25'
                  : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4
                  ${c.highlight ? 'bg-white/15' : 'bg-primary/10'}`}>
                  <c.icon className={`w-5 h-5 ${c.highlight ? 'text-white' : 'text-primary'}`} />
                </div>
                <h3 className={`text-sm font-bold mb-2 ${c.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {c.title}
                </h3>
                <p className={`text-xs leading-relaxed ${c.highlight ? 'text-indigo-100' : 'text-gray-500 dark:text-zinc-400'}`}>
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── section: About ──────────────────────────────────── */
const About = () => (
  <section id="features" className="py-20 bg-gray-50/70 dark:bg-zinc-900/40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-14 items-center">

        {/* Left: abstract visual */}
        <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="relative flex items-center justify-center">

          <div className="absolute w-72 h-72 rounded-full bg-primary/15 dark:bg-primary/10 blur-3xl" />

          <div className="relative w-full max-w-sm">
            {/* central card */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-700 shadow-xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">IMS Dashboard</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">All systems operational</p>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Records indexed', pct: 92, color: 'bg-primary' },
                  { label: 'Approvals resolved', pct: 78, color: 'bg-emerald-500' },
                  { label: 'Storage used', pct: 55, color: 'bg-amber-400' },
                ].map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">{b.label}</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{b.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { label: 'Departments', value: '12', icon: Building2 },
                  { label: 'Users', value: '248', icon: Users },
                  { label: 'Categories', value: '31', icon: FolderOpen },
                  { label: 'Notifications', value: '5 new', icon: Bell },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-xl p-2.5">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <s.icon className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{s.value}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* floating badge */}
            <div className="absolute -top-4 -right-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700 px-3 py-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-zinc-200">Best Solution</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700 px-3 py-2 flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-gray-700 dark:text-zinc-200">99.9% Uptime</span>
            </div>
          </div>
        </motion.div>

        {/* Right: copy */}
        <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <SectionLabel>About IMS</SectionLabel>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            We Are The{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-white px-2 rounded-md bg-primary">Best</span>
            </span>{' '}
            Information<br />Management in Town
          </h2>
          <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
            IMS Portal is a purpose-built platform that replaces chaotic file systems and
            manual approval chains with a structured, auditable, role-aware digital workspace.
            Whether you manage 100 records or 100,000 — IMS scales with you.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            {[
              { icon: Star, title: 'Best-in-Class UX', desc: 'Clean, intuitive interface designed for daily use — no training required.' },
              { icon: Globe, title: 'Multi-Department', desc: 'Full support for cross-department workflows, permissions, and reporting.' },
            ].map(f => (
              <div key={f.title} className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{f.title}</h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <Link to="/login"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover
              text-white font-semibold text-sm shadow-md shadow-primary/25 transition-colors">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ─── section: Services ───────────────────────────────── */
const services = [
  { icon: Database, title: 'Records Management', desc: 'Store, search, and categorise every document with version history and metadata tagging.' },
  { icon: Users, title: 'User Management', desc: 'Create accounts, assign roles, and control exactly what each person can see and do.' },
  { icon: Building2, title: 'Department Control', desc: 'Organise your organisation into departments with dedicated record pools and managers.' },
  { icon: FileCheck, title: 'Approval Workflows', desc: 'Route records through manager review with automated notifications and status tracking.' },
  { icon: Activity, title: 'Activity Logs', desc: 'Full audit trail of every create, update, delete, and approval action — with timestamps.' },
  { icon: BarChart3, title: 'Analytics & Reports', desc: 'Visual dashboards and exportable reports to keep leadership informed at a glance.' },
];

const Services = () => (
  <section id="services" className="py-24 relative overflow-hidden">
    {/* wave background */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#4338ca] via-[#6366f1] to-[#818cf8]" />
    <div className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />
    {/* wave top */}
    <div className="absolute top-0 inset-x-0">
      <svg viewBox="0 0 1440 60" className="w-full fill-gray-50 dark:fill-[#09090b]">
        <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" />
      </svg>
    </div>
    {/* wave bottom */}
    <div className="absolute bottom-0 inset-x-0">
      <svg viewBox="0 0 1440 60" className="w-full fill-gray-50 dark:fill-[#09090b]">
        <path d="M0,0 C360,60 1080,60 1440,0 L1440,60 L0,60 Z" />
      </svg>
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}
        className="text-center mb-12">
        <SectionLabel light>Our Services</SectionLabel>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          What{' '}
          <span className="px-2 rounded-md bg-white/15 ring-1 ring-white/20 text-white">Features</span>
          {' '}We Offer
        </h2>
        <p className="mt-4 text-sm text-indigo-200/80 max-w-xl mx-auto leading-relaxed">
          Everything your organisation needs to go from scattered files to a structured,
          auditable, and permission-controlled information ecosystem.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s, i) => (
          <motion.div key={s.title}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
            className={`rounded-2xl p-6 border transition-all group cursor-default
              ${i === 0
                ? 'bg-[#3730a3]/70 border-white/10 shadow-lg'
                : 'bg-white/8 border-white/10 hover:bg-white/15'}`}>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{s.title}</h3>
            <p className="text-xs text-indigo-100/70 leading-relaxed">{s.desc}</p>
            <div className="mt-4 flex items-center gap-1 text-indigo-200 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Learn more <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── section: CTA / Contact ──────────────────────────── */
const CTA = () => (
  <section id="contact" className="py-20 bg-gray-50/70 dark:bg-transparent">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <div className="inline-flex w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/15 items-center justify-center mb-5">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Ready to Take Control of<br />Your Information?
        </h2>
        <p className="mt-4 text-sm text-gray-500 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Sign in to your workspace now and experience a smarter way to manage
          records, teams, and workflows — all in one place.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          <Link to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary hover:bg-primary-hover
              text-white font-semibold text-sm shadow-lg shadow-primary/25 transition-colors">
            Sign In Now <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#home"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700
              text-gray-700 dark:text-zinc-300 font-semibold text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            Back to Top
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ─── Footer ──────────────────────────────────────────── */
const Footer = () => (
  <footer className="border-t border-gray-200 dark:border-zinc-800 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gradient-to-br from-primary to-indigo-400 rounded-lg flex items-center justify-center">
          <Shield className="text-white w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">IMS Portal</span>
      </div>
      <p className="text-xs text-gray-400 dark:text-zinc-600">
        Information Management System · v2.0 · {new Date().getFullYear()}
      </p>
      <div className="flex items-center gap-4">
        {['Privacy', 'Terms', 'Support'].map(l => (
          <a key={l} href="#" className="text-xs text-gray-400 dark:text-zinc-500 hover:text-primary transition-colors">{l}</a>
        ))}
      </div>
    </div>
  </footer>
);

/* ─── Root component ──────────────────────────────────── */
const Landing = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] transition-colors">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      <Hero />
      <Why />
      <About />
      <Services />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
