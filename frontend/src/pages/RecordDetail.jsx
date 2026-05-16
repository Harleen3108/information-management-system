import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, FileText, Download, CheckCircle2, XCircle, RotateCcw, Clock } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import TextArea from '../components/ui/TextArea';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canApprove = can('records.approve');
  const canDownload = can('records.download');

  useEffect(() => {
    (async () => {
      try { setRecord((await api.get(`/records/${id}`)).data); }
      catch (err) { toast.error(err.response?.status === 403 ? 'No permission' : 'Failed'); navigate('/records'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleApproval = async () => {
    if ((action === 'reject' || action === 'return') && !comments.trim()) { toast.error('Comments required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/records/${id}/${action}`, { comments });
      toast.success(action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Returned');
      setShowModal(false); setComments('');
      setRecord((await api.get(`/records/${id}`)).data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const dl = async (doc) => {
    try {
      const res = await api.get(`/attachments/${doc.id}/download`, { responseType: 'blob' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = doc.file_name; document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error('Download failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading record..." />;
  if (!record) return null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/records')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{record.title}</h1>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Created {new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <StatusBadge status={record.status} />
            </div>
            {record.description && <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">{record.description}</p>}
            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
              {[
                { l: 'Category', v: record.category?.name },
                { l: 'Department', v: record.department?.name },
                { l: 'Uploaded By', v: record.uploader?.name },
                { l: 'Updated', v: new Date(record.updated_at).toLocaleDateString() },
              ].map(f => (
                <div key={f.l}>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{f.l}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{f.v || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Documents</h2>
            {!record.documents?.length ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">No documents.</p>
            ) : (
              <div className="space-y-2">
                {record.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3">
                    <FileText className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.file_name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">{doc.file_type?.toUpperCase()} · {(doc.file_size / 1024).toFixed(0)} KB</p>
                    </div>
                    {canDownload && (
                      <button onClick={() => dl(doc)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {canApprove && record.status === 'pending' && (
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 space-y-2">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Actions</h3>
              {[
                { a: 'approve', label: 'Approve', Icon: CheckCircle2, cls: 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/25' },
                { a: 'reject', label: 'Reject', Icon: XCircle, cls: 'bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/25' },
                { a: 'return', label: 'Return for Revision', Icon: RotateCcw, cls: 'bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/25' },
              ].map(b => (
                <button key={b.a} onClick={() => { setAction(b.a); setComments(''); setShowModal(true); }}
                  className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-colors ${b.cls}`}>
                  <b.Icon className="w-4 h-4" /> {b.label}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Approval History</h3>
            {!record.approvals?.length ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-4">No activity.</p>
            ) : (
              <div className="space-y-3">
                {record.approvals.map(a => (
                  <div key={a.id} className="border-l-2 border-gray-200 dark:border-zinc-700 pl-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{a.user?.name}</p>
                    {a.comments && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{a.comments}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Return'} size="sm">
        <div className="space-y-4">
          <TextArea label="Comments" id="ac" value={comments} onChange={e => setComments(e.target.value)} rows={4} placeholder={action === 'approve' ? 'Optional...' : 'Required...'} />
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm">Cancel</button>
            <button onClick={handleApproval} disabled={submitting}
              className={`flex-1 py-2.5 text-white rounded-lg font-medium text-sm shadow-sm disabled:opacity-50 ${
                action === 'approve' ? 'bg-emerald-600' : action === 'reject' ? 'bg-red-600' : 'bg-blue-600'
              }`}>{submitting ? 'Processing...' : action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Return'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RecordDetail;
