import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import {
  LayoutDashboard, Files, Building2, Users, Settings, LogOut, Menu, X,
  Search, Bell, Activity, User, Tag, Sun, Moon, PanelLeftClose, PanelLeft,
  ChevronDown, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  const { user, logout, hasAnyRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try { const res = await api.get('/notifications/unread-count'); setUnreadCount(res.data.count); } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isSuperAdmin = hasAnyRole(['Super Admin']);
  const isFullAccess = hasAnyRole(['Super Admin', 'Admin', 'Manager']);
  const isEmployee = hasAnyRole(['Employee']);

  const nav = [
    { section: 'Main' },
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', visible: true },
    { name: 'Records', icon: Files, path: '/records', visible: true },
    { section: 'Management' },
    { name: 'Users', icon: Users, path: '/users', visible: isFullAccess },
    { name: 'Departments', icon: Building2, path: '/departments', visible: isFullAccess },
    { name: 'Categories', icon: Tag, path: '/categories', visible: isFullAccess },
    { section: 'System' },
    { name: 'Activity Logs', icon: Activity, path: '/activity-logs', visible: isFullAccess },
    { name: 'Notifications', icon: Bell, path: '/notifications', visible: isFullAccess || isEmployee },
    { name: 'System Config', icon: Settings, path: '/settings', visible: isSuperAdmin },
  ];

  // Pre-compute which section headings have visible items beneath them
  const visibleSections = new Set();
  let currentSection = null;
  for (const item of nav) {
    if (item.section) { currentSection = item.section; continue; }
    if (item.visible && currentSection) visibleSections.add(currentSection);
  }

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch {}
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 dark:border-zinc-800 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-400 rounded-lg flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
          <Shield className="text-white w-4 h-4" />
        </div>
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-base tracking-tight text-gray-900 dark:text-white">
            IMS
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {nav.map((item, i) => {
          if (item.section) {
            // Only render section heading if it has at least one visible child
            if (!visibleSections.has(item.section)) return null;
            if (collapsed) return <div key={i} className="my-3 border-t border-gray-100 dark:border-zinc-800" />;
            return <p key={i} className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{item.section}</p>;
          }
          if (!item.visible) return null;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.name} to={item.path}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary'
                  : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.name : undefined}>
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-primary' : ''}`} strokeWidth={isActive ? 2.2 : 1.8} />
              {!collapsed && <span>{item.name}</span>}
              {isActive && <motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />}
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-1`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 dark:border-zinc-800 space-y-1">
        <Link to="/profile"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Profile' : undefined}>
          <User className="w-[18px] h-[18px]" strokeWidth={1.8} />
          {!collapsed && <span>Profile</span>}
        </Link>
        <button onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium w-full text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sign Out' : undefined}>
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background dark:bg-[#09090b] flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col ${collapsed ? 'w-[68px]' : 'w-60'} bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen`}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 z-50 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-14 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 gap-4">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400">
              <Menu className="w-5 h-5" />
            </button>
            {/* Collapse toggle */}
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 dark:text-zinc-500">
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-zinc-800 border border-transparent rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-800 focus:border-gray-300 dark:focus:border-zinc-600 focus:ring-1 focus:ring-primary/20 outline-none w-56 transition-all" />
              <kbd className="hidden xl:inline-flex absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-200/60 dark:bg-zinc-700/60 rounded">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors" aria-label="Toggle theme">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            {(isFullAccess || isEmployee) && (
              <button onClick={() => navigate('/notifications')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 dark:text-zinc-400 relative" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>
            )}

            <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 mx-1" />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1 pr-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-zinc-300 max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 dark:text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl shadow-black/8 dark:shadow-black/30 py-1 z-50">
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800">
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800">
                        <Settings className="w-4 h-4" /> System Config
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 dark:border-zinc-800 py-1">
                      <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
