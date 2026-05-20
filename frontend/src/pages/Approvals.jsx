import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ClipboardCheck, CheckCircle2, XCircle, Eye, 
  Clock, FileText, User, ArrowRight, ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import TextArea from '../components/ui/TextArea';

const Approvals = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in_review'); // 'in_review' or 'pending'

  // Modal actions
  const [showModal, setShowModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'return'
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [activeTab]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/records?status=${activeTab}`);
      setRecords(response.data.data || []);
    } catch (error) {
      toast.error('Error fetching records for approval.');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (id, type) => {
    setSelectedRecordId(id);
    setActionType(type);
    setComments('');
    setShowModal(true);
  };

  const handleActionSubmit = async () => {
    if ((actionType === 'reject' || actionType === 'return') && !comments.trim()) {
      toast.error('Comments are required for rejection or revision requests.');
      return;
    }

    setSubmitting(true);
    try {
      let endpoint = '';
      if (actionType === 'approve') endpoint = 'approve';
      else if (actionType === 'reject') endpoint = 'reject';
      else if (actionType === 'return') endpoint = 'return-for-revision';

      await api.post(`/records/${selectedRecordId}/${endpoint}`, { comments });
      toast.success(
        actionType === 'approve' ? 'Record final approved!' :
        actionType === 'reject' ? 'Record rejected.' : 'Record returned for revision.'
      );
      setShowModal(false);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Approval Queue</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
          Review, approve, reject, or return records submitted by managers and employees.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('in_review')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'in_review'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Awaiting Final Approval ({activeTab === 'in_review' ? records.length : '…'})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Awaiting Manager Review ({activeTab === 'pending' ? records.length : '…'})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">All caught up!</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            There are no submissions waiting in this queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-left">
          <AnimatePresence mode="popLayout">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                {/* Status Bar Indicator */}
                <div className={`absolute left-0 top-0 w-1 h-full ${activeTab === 'in_review' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === 'in_review' 
                          ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' 
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{record.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                            {record.category?.name || 'General'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                            {record.department?.name || 'Global'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(record.uploader?.name || 'User')}&background=random`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-800 dark:text-zinc-200">{record.uploader?.name}</p>
                        <p className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Uploader</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400 dark:text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">{new Date(record.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {record.description && (
                    <p className="text-gray-500 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                      {record.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800/50">
                  <button 
                    onClick={() => navigate(`/records/${record.id}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button 
                    onClick={() => openActionModal(record.id, 'return')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-xs font-semibold transition-all"
                  >
                    Return
                  </button>
                  <button 
                    onClick={() => openActionModal(record.id, 'reject')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-xs font-semibold transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => openActionModal(record.id, 'approve')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-600/10"
                  >
                    {activeTab === 'in_review' ? 'Approve Final' : 'Approve'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal for Action Feedback */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          actionType === 'approve' ? 'Final Approve Submission' :
          actionType === 'reject' ? 'Reject Submission' : 'Return for Revision'
        }
        size="sm"
      >
        <div className="space-y-4">
          {(actionType === 'reject' || actionType === 'return') && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Feedback required</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Please provide a clear comment explaining the reason. The employee will receive a notification and see your comments.
                </p>
              </div>
            </div>
          )}

          <TextArea
            label={actionType === 'approve' ? 'Approval comments (optional)' : 'Feedback / reason (required)'}
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={4}
            placeholder={
              actionType === 'approve' ? 'Add any optional approval remarks…' :
              actionType === 'reject' ? 'State why this submission is rejected…' :
              'Specify changes or revisions needed…'
            }
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleActionSubmit}
              disabled={submitting}
              className={`flex-1 py-2 text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Processing…' : 'Submit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Approvals;
