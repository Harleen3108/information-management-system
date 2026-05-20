import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, trend, isUp, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
    >
      <div className="flex justify-between items-start">
        <div className={`${color} p-3 rounded-2xl shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
            isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
          }`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{label}</h3>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;
