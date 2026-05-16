import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
    <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{text}</p>
  </div>
);

export default LoadingSpinner;
