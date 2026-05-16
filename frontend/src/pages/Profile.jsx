import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { Lock, Mail, Building2, Shield, Key } from 'lucide-react';
import FormInput from '../components/ui/FormInput';

const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      await api.post('/change-password', form);
      toast.success('Password changed successfully');
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">Manage your account.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white text-lg font-bold">{initials}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{user?.roles?.[0]?.name || 'User'}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Shield, label: 'Role', value: user?.roles?.map(r => r.name).join(', ') || '—' },
              { icon: Building2, label: 'Department', value: user?.department?.name || '—' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                <item.icon className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <FormInput label="Current Password" id="cp" type="password" value={form.current_password} onChange={e => setForm({...form, current_password: e.target.value})} error={errors.current_password?.[0]} required />
            <FormInput label="New Password" id="np" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} error={errors.password?.[0]} required />
            <FormInput label="Confirm New Password" id="cnp" type="password" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} required />
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-50 transition-colors">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
