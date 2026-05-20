import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Departments from './pages/Departments';
import Categories from './pages/Categories';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerApprovals from './pages/ManagerApprovals';
import TeamActivity from './pages/TeamActivity';
import ManagerRecords from './pages/ManagerRecords';
import ManagerReports from './pages/ManagerReports';
import ManagerLayout from './components/ManagerLayout';
import Approvals from './pages/Approvals';

const ProtectedRoute = ({ children }) => {
    const { user, loading, hasAnyRole } = useAuth();
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
    if (!user) return <Navigate to="/login" />;

    // If only a Manager, route them to manager dashboard and layout
    if (hasAnyRole(['Manager']) && !hasAnyRole(['Admin', 'Super Admin'])) {
        if (window.location.pathname === '/') {
            return <Navigate to="/manager/dashboard" replace />;
        }
        return <ManagerLayout>{children}</ManagerLayout>;
    }

    return <Layout>{children}</Layout>;
};

const ManagerRoute = ({ children }) => {
    const { user, loading, hasAnyRole } = useAuth();
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (!hasAnyRole(['Manager', 'Super Admin', 'Admin'])) {
        return <Navigate to="/forbidden" />;
    }
    return <ManagerLayout>{children}</ManagerLayout>;
};

function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <Router>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/forbidden" element={<Forbidden />} />

                            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                            <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                            <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
                            <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                            <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
                            <Route path="/records/:id" element={<ProtectedRoute><RecordDetail /></ProtectedRoute>} />
                            <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                            <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                            {/* Manager Panel */}
                            <Route path="/manager/dashboard" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
                            <Route path="/manager/approvals" element={<ManagerRoute><ManagerApprovals /></ManagerRoute>} />
                            <Route path="/manager/team"      element={<ManagerRoute><TeamActivity /></ManagerRoute>} />
                            <Route path="/manager/records"   element={<ManagerRoute><ManagerRecords /></ManagerRoute>} />
                            <Route path="/manager/reports"   element={<ManagerRoute><ManagerReports /></ManagerRoute>} />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Router>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

export default App;

