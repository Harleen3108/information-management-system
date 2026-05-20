import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, User, Mail, Building2, Shield, Calendar,
  Files, Download, Eye, X, Filter, Search,
  Image as ImageIcon, Film, Music, FileCode, File, Tag,
  CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// ── File type helpers ─────────────────────────────────────────────────────────
const getFileCategory = (ext = '') => {
  ext = ext.toLowerCase();
  if (['pdf'].includes(ext))                                        return 'pdf';
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (['mp4','mov','avi','mkv','webm'].includes(ext))              return 'video';
  if (['mp3','wav','ogg','aac','m4a'].includes(ext))               return 'audio';
  if (['txt','csv','json','xml','md','html'].includes(ext))        return 'text';
  return 'other';
};

const FILE_ICON_MAP = {
  pdf:   { Icon: FileCode, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  image: { Icon: ImageIcon, color: 'text-pink-500',  bg: 'bg-pink-50 dark:bg-pink-900/20' },
  video: { Icon: Film,      color: 'text-violet-500',bg: 'bg-violet-50 dark:bg-violet-900/20' },
  audio: { Icon: Music,     color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  text:  { Icon: FileCode,  color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-900/20' },
  other: { Icon: File,      color: 'text-gray-400',  bg: 'bg-gray-100 dark:bg-zinc-800' },
};

const FileTypeIcon = ({ ext, size = 'w-4 h-4' }) => {
  const cat = getFileCategory(ext);
  const { Icon, color } = FILE_ICON_MAP[cat] || FILE_ICON_MAP.other;
  return <Icon className={`${size} ${color} shrink-0`} />;
};

// ── Inline Document Viewer ────────────────────────────────────────────────────
const DocViewer = ({ doc, onClose }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
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

  const downloadBlob = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl; a.download = doc.file_name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/92 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileTypeIcon ext={doc?.file_type} size="w-5 h-5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate max-w-sm">{doc?.file_name}</p>
            <p className="text-[11px] text-zinc-400">
              {doc?.file_type?.toUpperCase()} · {(doc?.file_size / 1024).toFixed(0)} KB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {blobUrl && (
            <button onClick={downloadBlob}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          )}
          <button onClick={onClose}
            className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
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
            <p className="text-zinc-500 text-sm">This file type cannot be previewed.</p>
          </div>
        )}
        {blobUrl && !error && (
          <>
            {cat === 'pdf' && <iframe src={blobUrl} title={doc.file_name} className="w-full rounded-lg bg-white" style={{ height: '75vh' }} />}
            {cat === 'image' && <img src={blobUrl} alt={doc.file_name} className="max-w-full object-contain rounded-lg shadow-2xl" style={{ maxHeight: '80vh' }} />}
            {cat === 'video' && <video src={blobUrl} controls className="max-w-full rounded-lg shadow-2xl" style={{ maxHeight: '75vh' }} />}
            {cat === 'audio' && (
              <div className="bg-zinc-800 rounded-2xl p-10 text-center space-y-5 w-96">
                <Music className="w-16 h-16 text-amber-400 mx-auto" />
                <p className="text-white font-medium truncate">{doc.file_name}</p>
                <audio src={blobUrl} controls className="w-full" />
              </div>
            )}
            {cat === 'text' && <iframe src={blobUrl} title={doc.file_name} className="w-full rounded-lg bg-white" style={{ height: '75vh' }} />}
            {cat === 'other' && (
              <div className="text-center">
                <File className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-300 font-medium mb-4">No in-browser preview for this file type.</p>
                <button onClick={downloadBlob} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
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

// ── Main Page ─────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast  = useToast();
  const { can } = useAuth();

  const [user, setUser]         = useState(null);
  const [records, setRecords]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCatFilter] = useState('');   // category_id or ''
  const [search, setSearch]     = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const canDownload = can('records.download');
  const canView     = can('records.view');

  const fetchData = useCallback(async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get('/categories'),
      ]);
      setUser(uRes.data);
      setCategories(cRes.data);
    } catch (err) {
      toast.error('Failed to load user');
      navigate('/users');
    }
  }, [id]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = { uploaded_by: id, per_page: 100 };
      if (catFilter) params.category_id = catFilter;
      if (search)    params.search = search;
      const res = await api.get('/records', { params });
      setRecords(res.data.data || []);
    } catch {
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [id, catFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const dl = async (doc) => {
    try {
      const res = await api.get(`/attachments/${doc.id}/download`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = doc.file_name;
      document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error('Download failed'); }
  };

  // Stats
  const totalDocs = records.reduce((s, r) => s + (r.documents?.length || 0), 0);
  const approved  = records.filter(r => r.status === 'approved').length;
  const pending   = records.filter(r => r.status === 'pending' || r.status === 'in_review').length;

  if (loading) return <LoadingSpinner text="Loading profile…" />;

  const roleColor = {
    'Super Admin': 'from-rose-500 to-pink-500',
    'Admin':       'from-indigo-500 to-blue-500',
    'Manager':     'from-violet-500 to-purple-500',
    'Employee':    'from-emerald-500 to-teal-500',
    'Viewer':      'from-amber-500 to-orange-500',
  };
  const userRole = user?.roles?.[0]?.name || 'No Role';

  return (
    <>
      <div className="space-y-6">
        {/* Back */}
        <button onClick={() => navigate('/users')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>

        {/* Profile header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          {/* Banner */}
          <div className={`h-24 bg-gradient-to-r ${roleColor[userRole] || 'from-gray-400 to-gray-500'}`} />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${roleColor[userRole] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white dark:border-zinc-900`}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${roleColor[userRole] || 'from-gray-400 to-gray-500'} shadow-sm`}>
                <Shield className="w-3 h-3" /> {userRole}
              </span>
            </div>

            {/* Info */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                <Mail className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-600" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                <Building2 className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-600" />
                <span>{user?.department?.name || 'No department'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                <Calendar className="w-4 h-4 shrink-0 text-gray-300 dark:text-zinc-600" />
                <span>Joined {new Date(user?.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Records', value: records.length, Icon: Files,         color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Approved',      value: approved,       Icon: CheckCircle2,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Total Files',   value: totalDocs,      Icon: File,           color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Documents section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">
              Uploaded Documents
              <span className="ml-2 text-xs font-normal text-gray-400 dark:text-zinc-500">({records.length} records)</span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search records…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all w-44"
                />
              </div>
              {/* Category filter */}
              <div className="relative">
                <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                <select
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  className="pl-8 pr-7 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none transition-all">
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category filter chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-50 dark:border-zinc-800/50">
              <button
                onClick={() => setCatFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  catFilter === '' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}>
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(String(c.id) === catFilter ? '' : String(c.id))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    String(c.id) === catFilter ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}>
                  <Tag className="w-2.5 h-2.5 inline mr-1" />
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Records list */}
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {records.length === 0 ? (
              <div className="py-16 text-center">
                <Files className="w-10 h-10 text-gray-200 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No records found</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                  {catFilter ? 'Try a different category filter' : 'This user has not uploaded any records yet'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {records.map((record, ri) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ri * 0.03 }}
                    className="px-5 py-4">
                    {/* Record header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {record.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                          <Tag className="w-2.5 h-2.5" />
                          {record.category?.name || '—'}
                        </span>
                        <StatusBadge status={record.status} />
                      </div>
                    </div>

                    {record.description && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 line-clamp-1">{record.description}</p>
                    )}

                    {/* Files in this record */}
                    {record.documents?.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {record.documents.map(doc => {
                          const cat = getFileCategory(doc.file_type);
                          const { bg, color, Icon } = FILE_ICON_MAP[cat] || FILE_ICON_MAP.other;
                          return (
                            <div key={doc.id} className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/50 rounded-lg px-3 py-2">
                              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                                <Icon className={`w-3.5 h-3.5 ${color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">{doc.file_name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                  {doc.file_type?.toUpperCase()} · {(doc.file_size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {canView && (
                                  <button
                                    onClick={() => setPreviewDoc(doc)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-md text-[11px] font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
                                    <Eye className="w-3 h-3" /> View
                                  </button>
                                )}
                                {canDownload && (
                                  <button
                                    onClick={() => dl(doc)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-[11px] font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                    <Download className="w-3 h-3" /> Download
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 italic mt-1">No files attached</p>
                    )}

                    <p className="text-[10px] text-gray-300 dark:text-zinc-600 mt-2">
                      {new Date(record.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Document viewer overlay */}
      {previewDoc && (
        <DocViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  );
};

export default UserProfile;
