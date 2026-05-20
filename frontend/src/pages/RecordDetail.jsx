import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Download, CheckCircle2, XCircle,
  RotateCcw, Clock, Eye, X, AlertCircle, MessageSquare,
  Image as ImageIcon, Film, Music, FileCode, File,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import TextArea from '../components/ui/TextArea';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// ── helpers ───────────────────────────────────────────────────────────────────
const getFileCategory = (ext = '') => {
  ext = ext.toLowerCase();
  if (['pdf'].includes(ext))                              return 'pdf';
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (['mp4','mov','avi','mkv','webm','ogg'].includes(ext))        return 'video';
  if (['mp3','wav','ogg','aac','m4a'].includes(ext))               return 'audio';
  if (['txt','csv','json','xml','html','css','js','ts','md'].includes(ext)) return 'text';
  return 'other';
};

const FileIcon = ({ ext, size = 'w-4 h-4' }) => {
  const cat = getFileCategory(ext);
  const cls = `${size} shrink-0`;
  if (cat === 'image') return <ImageIcon className={`${cls} text-pink-500`} />;
  if (cat === 'video') return <Film className={`${cls} text-violet-500`} />;
  if (cat === 'audio') return <Music className={`${cls} text-amber-500`} />;
  if (cat === 'text' || cat === 'pdf') return <FileCode className={`${cls} text-blue-500`} />;
  return <File className={`${cls} text-gray-400`} />;
};

// ── Document Viewer component ─────────────────────────────────────────────────
const DocViewer = ({ doc, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const cat = getFileCategory(doc?.file_type);

  useEffect(() => {
    if (!doc) return;
    let url;
    api.get(`/attachments/${doc.id}/preview`, { responseType: 'blob' })
      .then(res => {
        const mime = res.headers['content-type'] || 'application/octet-stream';
        url = URL.createObjectURL(new Blob([res.data], { type: mime }));
        setBlobUrl(url);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [doc?.id]);

  // Also download from blob
  const downloadBlob = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl; a.download = doc.file_name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <FileIcon ext={doc?.file_type} size="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold text-white truncate max-w-sm">{doc?.file_name}</p>
            <p className="text-[11px] text-zinc-400">
              {doc?.file_type?.toUpperCase()} · {(doc?.file_size / 1024).toFixed(0)} KB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {blobUrl && (
            <button
              onClick={downloadBlob}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-400">Loading preview…</p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <File className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium mb-1">Preview unavailable</p>
            <p className="text-zinc-500 text-sm">This file type cannot be previewed in the browser.</p>
          </div>
        )}

        {blobUrl && !error && (
          <>
            {/* PDF */}
            {cat === 'pdf' && (
              <iframe
                src={blobUrl}
                title={doc.file_name}
                className="w-full rounded-lg bg-white"
                style={{ height: '75vh' }}
              />
            )}
            {/* Image */}
            {cat === 'image' && (
              <img
                src={blobUrl}
                alt={doc.file_name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{ maxHeight: '80vh' }}
              />
            )}
            {/* Video */}
            {cat === 'video' && (
              <video
                src={blobUrl}
                controls
                className="max-w-full rounded-lg shadow-2xl"
                style={{ maxHeight: '75vh' }}
              />
            )}
            {/* Audio */}
            {cat === 'audio' && (
              <div className="bg-zinc-800 rounded-2xl p-10 text-center space-y-5 w-96">
                <Music className="w-16 h-16 text-amber-400 mx-auto" />
                <p className="text-white font-medium truncate">{doc.file_name}</p>
                <audio src={blobUrl} controls className="w-full" />
              </div>
            )}
            {/* Text */}
            {cat === 'text' && (
              <iframe
                src={blobUrl}
                title={doc.file_name}
                className="w-full rounded-lg bg-white"
                style={{ height: '75vh' }}
              />
            )}
            {/* Other */}
            {cat === 'other' && (
              <div className="text-center">
                <File className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-300 font-medium mb-4">No in-browser preview for this file type.</p>
                <button
                  onClick={downloadBlob}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                  <Download className="w-4 h-4" /> Download to view
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can, hasRole, hasAnyRole } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preview
  const [previewDoc, setPreviewDoc] = useState(null);

  const canApprove  = can('records.approve');
  const canDownload = can('records.download');
  const canView     = can('records.view');

  // Get the Sanctum token from localStorage (or wherever you store it)
  const token = localStorage.getItem('token') || '';

  const fetchRecord = useCallback(async () => {
    try { setRecord((await api.get(`/records/${id}`)).data); }
    catch (err) {
      toast.error(err.response?.status === 403 ? 'No permission' : 'Failed');
      navigate('/records');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const handleApproval = async () => {
    if ((action === 'reject' || action === 'return') && !comments.trim()) {
      toast.error('Comments required'); return;
    }
    setSubmitting(true);
    try {
      await api.post(`/records/${id}/${action}`, { comments });
      toast.success(
        action === 'approve' ? 'Approved'
        : action === 'reject' ? 'Rejected'
        : action === 'review' ? 'Sent for review'
        : 'Returned'
      );
      setShowModal(false); setComments('');
      fetchRecord();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const dl = async (doc) => {
    try {
      const res = await api.get(`/attachments/${doc.id}/download`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = doc.file_name;
      document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error('Download failed'); }
  };

  if (loading) return <LoadingSpinner text="Loading record..." />;
  if (!record) return null;

  return (
    <>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/records')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* ── Rejection / Return reason banner ── */}
        {record.status === 'rejected' && (() => {
          const last = record.approvals?.filter(a => a.status === 'rejected').at(-1);
          return (
            <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl">
              <div className="w-9 h-9 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-0.5">This record was rejected</p>
                {last?.comments
                  ? <p className="text-sm text-red-700 dark:text-red-400"><span className="font-medium">Reason:</span> {last.comments}</p>
                  : <p className="text-xs text-red-500 dark:text-red-500 italic">No reason provided by the reviewer.</p>
                }
                {last?.user && <p className="text-[11px] text-red-500 dark:text-red-500 mt-1">Reviewed by {last.user.name} on {new Date(last.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>}
              </div>
            </div>
          );
        })()}

        {record.status === 'revision' && (() => {
          const last = record.approvals?.filter(a => a.status === 'revision').at(-1);
          return (
            <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Revision requested — please correct and resubmit</p>
                {last?.comments
                  ? <p className="text-sm text-amber-700 dark:text-amber-400"><span className="font-medium">Feedback:</span> {last.comments}</p>
                  : <p className="text-xs text-amber-500 italic">No feedback provided.</p>
                }
                {last?.user && <p className="text-[11px] text-amber-500 dark:text-amber-500 mt-1">Reviewed by {last.user.name} on {new Date(last.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Info card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{record.title}</h1>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                    Created {new Date(record.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <StatusBadge status={record.status} />
              </div>
              {record.description && (
                <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">{record.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-zinc-800">
                {[
                  { l: 'Category',    v: record.category?.name },
                  { l: 'Department',  v: record.department?.name },
                  { l: 'Uploaded By', v: record.uploader?.name },
                  { l: 'Updated',     v: new Date(record.updated_at).toLocaleDateString() },
                ].map(f => (
                  <div key={f.l}>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{f.l}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{f.v || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Documents
                {record.documents?.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400 dark:text-zinc-500">
                    ({record.documents.length} file{record.documents.length > 1 ? 's' : ''})
                  </span>
                )}
              </h2>

              {!record.documents?.length ? (
                <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">No documents attached.</p>
              ) : (
                <div className="space-y-2">
                  {record.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl px-4 py-3 group">
                      <FileIcon ext={doc.file_type} size="w-5 h-5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.file_name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                          {doc.file_type?.toUpperCase()} · {(doc.file_size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Preview button */}
                        {canView && (
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                        )}
                        {/* Download button */}
                        {canDownload && (
                          <button
                            onClick={() => dl(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <Download className="w-3 h-3" /> Download
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {canApprove && (
              (hasRole('Manager') && record.status === 'pending') ||
              (hasAnyRole(['Super Admin', 'Admin']) && ['pending', 'in_review'].includes(record.status))
            ) && (
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  {hasAnyRole(['Super Admin', 'Admin']) ? 'Admin Actions' : 'Manager Actions'}
                </h3>
                <div className="space-y-2">
                  <button onClick={() => { setAction('approve'); setComments(''); setShowModal(true); }}
                    className="w-full flex items-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> 
                    {hasAnyRole(['Super Admin', 'Admin']) ? 'Final Approve Record' : 'Approve & Forward'}
                  </button>
                  <button onClick={() => { setAction('return'); setComments(''); setShowModal(true); }}
                    className="w-full flex items-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Return for Revision
                  </button>
                  <button onClick={() => { setAction('reject'); setComments(''); setShowModal(true); }}
                    className="w-full flex items-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <XCircle className="w-4 h-4" /> Reject Record
                  </button>
                </div>
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
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
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

        {/* Approval action modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            action === 'approve' ? '✅ Approve Record'
            : action === 'reject' ? '❌ Reject Record'
            : action === 'review' ? '🔍 Move to In Review'
            : '↩ Return for Revision'
          }
          size="sm">
          <div className="space-y-4">
            {/* Reject / Return warning */}
            {(action === 'reject' || action === 'return') && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    {action === 'reject' ? 'Reason is required' : 'Feedback is required'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    {action === 'reject'
                      ? 'The employee will see this reason on their record so they understand why it was rejected.'
                      : 'The employee will see your feedback and must correct the record before resubmitting.'}
                  </p>
                </div>
              </div>
            )}

            <TextArea
              label={`${action === 'reject' ? 'Rejection Reason' : action === 'return' ? 'Revision Feedback' : 'Comments'} ${(action === 'reject' || action === 'return') ? '(required)' : '(optional)'}`}
              id="ac"
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={4}
              placeholder={
                action === 'approve' ? 'Optional approval note for the record…'
                : action === 'review' ? 'Optional note…'
                : action === 'reject' ? 'Explain clearly why this record is being rejected…'
                : 'Describe what needs to be corrected or improved…'
              }
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg font-medium text-sm">
                Cancel
              </button>
              <button
                onClick={handleApproval}
                disabled={submitting}
                className={`flex-1 py-2.5 text-white rounded-lg font-semibold text-sm shadow-sm disabled:opacity-50 ${
                  action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700'
                  : action === 'reject' ? 'bg-red-600 hover:bg-red-700'
                  : action === 'review' ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {submitting ? 'Processing…'
                  : action === 'approve' ? 'Approve'
                  : action === 'reject' ? 'Reject'
                  : action === 'review' ? 'Move to Review'
                  : 'Send Back'}
              </button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Full-screen document viewer */}
      {previewDoc && (
        <DocViewer
          doc={previewDoc}
          token={token}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  );
};

export default RecordDetail;
