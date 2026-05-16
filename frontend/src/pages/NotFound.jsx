import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white tracking-tight">404</h1>
        <p className="text-lg font-medium text-gray-900 dark:text-white mt-3">Page Not Found</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center mt-8">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm shadow-sm shadow-primary/20">
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
