import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import {
  LayoutDashboard, ClipboardList, Users, Files, BarChart2,
  Bell, User, LogOut, Menu, X, Sun, Moon,
  ChevronDown, Shield, PanelLeftClose, PanelLeft,
  ChevronRight, Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MANAGER_NAV = [
  { name: 'Dashboard',     icon: LayoutDashboard, path: '/manager/dashboard' },
  { name: 'Approvals',     icon: ClipboardList,   path: '/manager/approvals' },
  { name: 'Team Activity', icon: Users,           path: '/manager/team' },
  { name: 'Records',       icon: Files,           path: '/manager/records' },
  { name: 'Reports',       icon: BarChart2,       path: '/manager/reports' },
];

const ManagerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifications, setNotifications] = useState([]);

  const userMenuRef = useRef(null);
  const notifRef    = useRef(null);

  /* ── fetch unread count ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  /* ── fetch recent notifications for dropdown ── */
  useEffect(() => {
    if (!notifOpen) return;
    api.get('/notifications?per_page=5').then(r => {
      setNotifications(r.data?.data || []);
    }).catch(() => {});
  }, [notifOpen]);

  /* ── close mobile sidebar on route change ── */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* ── outside click handlers ── */
  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch {}
  };

  /* ── active path check ── */
  const isActive = (path) =>
    location.pathname === path || (path !== '/manager' && location.pathname.startsWith(path));

  /* ── current page name ── */
  const currentPage = MANAGER_NAV.find(n => isActive(n.path))?.name ?? 'Manager Panel';

  /* ── Sidebar inner ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 dark:border-zinc-800/80 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-400 rounded-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
          <Shield className="text-white w-4 h-4" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-none">
              IMS
            </span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mt-1">Manager Panel</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && (
          <p className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Navigation</p>
        )}
        {MANAGER_NAV.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group
                ${active
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary'
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon
                className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-primary' : ''}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {!collapsed && <span>{item.name}</span>}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 dark:border-zinc-800 space-y-1 shrink-0">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Account</p>
        )}
        <Link
          to="/profile"
          title={collapsed ? 'Profile' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <User className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Profile</span>}
        </Link>
        <Link
          to="/dashboard"
          title={collapsed ? 'Main App' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LayoutDashboard className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Main App</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: isDark ? '#09090b' : '#f8fafc' }}>

      {/* ──── Desktop Sidebar ──── */}
      <aside className={`hidden lg:flex flex-col ${collapsed ? 'w-[68px]' : 'w-60'} bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen`}>
        <SidebarContent />
      </aside>

      {/* ──── Mobile Overlay ──── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-50 lg:hidden"
            >
              {/* Close btn */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ──── Main Column ──── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ──── Topbar ──── */}
        <header className={`h-14 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 gap-4 border-b ${
          isDark
            ? 'bg-zinc-900/90 border-zinc-800'
            : 'bg-white/80 border-gray-200'
        } backdrop-blur-xl`}>

          {/* Left: mobile hamburger + collapse + breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCollapsed(c => !c)}
              className="hidden lg:flex p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 dark:text-zinc-500 transition-colors"
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 dark:text-zinc-500 font-medium">Manager</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600" />
              <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span>
            </div>
          </div>

          {/* Right: Theme + Notifications + Profile */}
          <div className="flex items-center gap-1">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
                      isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 dark:divide-zinc-800">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center">
                          <Bell className="w-6 h-6 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 dark:text-zinc-500">No notifications</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${!n.read_at ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                            <p className="text-[13px] text-gray-800 dark:text-zinc-200 font-medium leading-snug">{n.data?.message || n.data?.title || 'Notification'}</p>
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                              {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className={`px-4 py-2.5 border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                      <button
                        onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View all notifications →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

            {/* Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 p-1 pr-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-none">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">Manager</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 dark:text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-1 w-56 rounded-xl shadow-xl border py-1 z-50 ${
                      isDark ? 'bg-zinc-900 border-zinc-700 shadow-black/30' : 'bg-white border-gray-200 shadow-black/8'
                    }`}
                  >
                    <div className={`px-3 py-2.5 border-b ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Bell className="w-4 h-4" /> Notifications
                        {unreadCount > 0 && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Main Dashboard
                      </Link>
                    </div>
                    <div className={`border-t py-1 ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ──── Page Content ──── */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
