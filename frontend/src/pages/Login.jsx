import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Eye, EyeOff, Sun, Moon, ArrowRight, Loader2, Lock, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Navbar (same as Landing) ──────────────────────────── */
const Navbar = ({ isDark, toggleTheme }) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-indigo-400 rounded-xl flex items-center justify-center shadow shadow-primary/30">
              <Shield className="text-white w-4 h-4" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
              IMS<span className="text-primary">Portal</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {[['#home', 'Home'], ['#why', 'About'], ['#features', 'Features'], ['#services', 'Services'], ['#contact', 'Contact']].map(([href, label]) => (
              <Link key={label} to={`/${href}`}
                className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-primary dark:hover:text-indigo-400 transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="hidden md:inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm shadow-primary/25 cursor-default select-none">
              Sign In
            </span>
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
              {[['Home', '/'], ['About', '/#why'], ['Features', '/#features'], ['Services', '/#services']].map(([label, href]) => (
                <Link key={label} to={href} onClick={() => setOpen(false)}
                  className="text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-primary transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

/* ── Login page ────────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] transition-colors">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      {/* centered card area */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="w-full max-w-sm">

          {/* card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-8">

            {/* heading inside card */}
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Sign in to your account</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Enter your credentials to continue</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-900/30 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Email</label>
                <input id="email" type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="you@company.com" required autoFocus />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Password</label>
                <div className="relative">
                  <input id="password" type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10"
                    placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                    tabIndex={-1}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm shadow-sm shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-zinc-600 mt-5">
            Information Management System · v2.0
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
