import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, lastPage, total, perPage, onPageChange }) => {
  if (lastPage <= 1) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  const pages = [];
  const range = 2;
  for (let i = Math.max(1, currentPage - range); i <= Math.min(lastPage, currentPage + range); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-zinc-800">
      <p className="text-xs text-gray-500 dark:text-zinc-500">
        <span className="font-medium text-gray-700 dark:text-zinc-300">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-zinc-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page) => (
          <button key={page} onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
              page === currentPage
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}>
            {page}
          </button>
        ))}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === lastPage}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
