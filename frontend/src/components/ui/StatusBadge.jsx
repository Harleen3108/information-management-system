import React from 'react';

const STATUS_MAP = {
  draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300' },
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  approved: { label: 'Approved', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  revision: { label: 'Revision', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  archived: { label: 'Archived', classes: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide ${cfg.classes}`}>
      <span className={`w-1 h-1 rounded-full ${
        status === 'approved' ? 'bg-emerald-500' :
        status === 'rejected' ? 'bg-red-500' :
        status === 'pending' ? 'bg-amber-500' :
        status === 'revision' ? 'bg-blue-500' :
        status === 'archived' ? 'bg-purple-500' : 'bg-gray-400'
      }`} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
