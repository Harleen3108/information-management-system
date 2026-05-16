import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  Save, Bell, Shield, FileUp, GitBranch, Loader2,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/* ─── Section Definitions with metadata ─── */
const SECTIONS = [
  {
    key: 'workflow',
    title: 'Workflow Configuration',
    icon: GitBranch,
    description: 'Control record lifecycle and approval processes.',
    impact: 'These settings determine how records flow through the system — from creation to approval and archival.',
    fields: [
      { key: 'require_approval', label: 'Require Approval for New Records', type: 'toggle', hint: 'When enabled, submitted records go to a manager for approval. When disabled, records remain in their current status.' },
      { key: 'default_record_status', label: 'Default Record Status', type: 'select', options: ['draft', 'pending'], hint: 'The initial status assigned to newly created records.' },
      { key: 'allow_edit_submitted', label: 'Allow Employees to Edit Submitted Records', type: 'toggle', hint: 'When enabled, employees can modify records even after submission (before approval).' },
      { key: 'auto_archive_days', label: 'Auto-Archive After (Days)', type: 'number', placeholder: '90', hint: 'Approved records are automatically archived after this many days. Set to 0 to disable.' },
    ],
  },
  {
    key: 'file_upload',
    title: 'File Upload Configuration',
    icon: FileUp,
    description: 'Control file upload limits and allowed types.',
    impact: 'These settings enforce upload restrictions when users attach documents to records.',
    fields: [
      { key: 'max_upload_size_mb', label: 'Maximum File Size (MB)', type: 'number', placeholder: '10', hint: 'Files larger than this size will be rejected during upload.' },
      { key: 'allowed_file_types', label: 'Allowed File Types', type: 'text', placeholder: 'pdf,docx,xlsx,jpg,png', hint: 'Comma-separated list of file extensions permitted for upload.' },
    ],
  },
  {
    key: 'notifications',
    title: 'Notification Configuration',
    icon: Bell,
    description: 'Manage how and when users receive alerts.',
    impact: 'Controls the notification system — turning these off will stop all alerts for the respective channels.',
    fields: [
      { key: 'enable_in_app_notifications', label: 'Enable In-App Notifications', type: 'toggle', hint: 'Show notification badges and alerts within the application.' },
      { key: 'enable_email_notifications', label: 'Enable Email Notifications', type: 'toggle', hint: 'Send email alerts for important events (requires SMTP configuration).' },
      { key: 'notify_manager_on_submission', label: 'Notify Managers on Record Submission', type: 'toggle', hint: 'Managers receive a notification when an employee submits a record for approval.' },
      { key: 'notify_employee_on_decision', label: 'Notify Employees on Approval/Rejection', type: 'toggle', hint: 'Employees are notified when their submitted records are approved, rejected, or returned.' },
    ],
  },
  {
    key: 'security',
    title: 'Security Configuration',
    icon: Shield,
    description: 'Authentication and session security policies.',
    impact: 'These settings protect user accounts and enforce security standards across the organization.',
    fields: [
      { key: 'session_timeout_minutes', label: 'Session Timeout (Minutes)', type: 'number', placeholder: '30', hint: 'Inactive users are automatically logged out after this duration.' },
      { key: 'min_password_length', label: 'Minimum Password Length', type: 'number', placeholder: '8', hint: 'Enforced when users create or change their password.' },
      { key: 'require_strong_password', label: 'Require Strong Passwords', type: 'toggle', hint: 'When enabled, passwords must contain uppercase, lowercase, numbers, and special characters.' },
    ],
  },
];

const Settings = () => {
  const toast = useToast();
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/settings');
        const flat = {};
        Object.values(res.data).forEach(group => {
          Object.entries(group).forEach(([k, v]) => { flat[k] = v; });
        });
        setValues(flat);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const setValue = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [];
      SECTIONS.forEach(section => {
        section.fields.forEach(f => {
          payload.push({ key: f.key, value: values[f.key] ?? '', group: section.key });
        });
      });
      await api.put('/settings', { settings: payload });
      toast.success('System configuration saved successfully');
      setDirty(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner text="Loading configuration..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Configure organization-wide settings that affect the entire application.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {dirty && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">You have unsaved changes.</p>
        </motion.div>
      )}

      {/* Sections */}
      {SECTIONS.map((section, si) => (
        <motion.div key={section.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/8 dark:bg-primary/10 rounded-xl flex items-center justify-center">
                <section.icon className="w-[18px] h-[18px] text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{section.description}</p>
              </div>
            </div>
            {/* Impact note */}
            <div className="mt-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed">{section.impact}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="px-6 py-5 space-y-5">
            {section.fields.map(field => (
              <div key={field.key} className="max-w-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor={field.key} className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {field.label}
                  </label>
                </div>

                {field.type === 'toggle' ? (
                  <button
                    onClick={() => setValue(field.key, values[field.key] === 'true' ? 'false' : 'true')}
                    className="flex items-center gap-3 group"
                    role="switch"
                    aria-checked={values[field.key] === 'true'}
                    aria-label={field.label}>
                    <div className={`relative w-10 h-[22px] rounded-full transition-colors ${
                      values[field.key] === 'true'
                        ? 'bg-primary'
                        : 'bg-gray-200 dark:bg-zinc-700'
                    }`}>
                      <div className={`absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${
                        values[field.key] === 'true' ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      values[field.key] === 'true'
                        ? 'text-primary'
                        : 'text-gray-400 dark:text-zinc-500'
                    }`}>
                      {values[field.key] === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                ) : field.type === 'select' ? (
                  <select id={field.key} value={values[field.key] || ''}
                    onChange={e => setValue(field.key, e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input id={field.key} type={field.type} value={values[field.key] || ''}
                    onChange={e => setValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                )}

                {field.hint && (
                  <p className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Settings;
