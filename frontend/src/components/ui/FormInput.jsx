import React from 'react';

const FormInput = ({ label, id, error, className = '', ...props }) => (
  <div className={className}>
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">{label}</label>}
    <input id={id} {...props}
      className={`w-full px-3 py-2 bg-white dark:bg-zinc-800 border rounded-lg text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none transition-all duration-150
        ${error
          ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
          : 'border-gray-200 dark:border-zinc-700 focus:border-primary focus:ring-2 focus:ring-primary/20'
        }`}
    />
    {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
  </div>
);

export default FormInput;
