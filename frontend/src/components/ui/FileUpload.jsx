import React, { useRef } from 'react';
import { Paperclip, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const FileUpload = ({ label, onChange, multiple = false, accept, files: controlledFiles, allowedExtensions = [] }) => {
  const ref = useRef(null);
  const [files, setFiles] = React.useState([]);
  const [rejectedFiles, setRejectedFiles] = React.useState([]);
  const activeFiles = controlledFiles || files;

  const isAllowed = (file) => {
    if (!allowedExtensions || allowedExtensions.length === 0) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(ext);
  };

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    const allowed = selected.filter(isAllowed);
    const rejected = selected.filter(f => !isAllowed(f));
    setRejectedFiles(rejected);
    const updated = multiple ? [...activeFiles, ...allowed] : allowed;
    setFiles(updated);
    onChange?.(updated);
    // Reset the input so same file can be re-selected after removal
    e.target.value = '';
  };

  const removeFile = (index) => {
    const updated = activeFiles.filter((_, i) => i !== index);
    setFiles(updated);
    onChange?.(updated);
  };

  // Build accept string from allowedExtensions if not explicitly provided
  const effectiveAccept = accept || (allowedExtensions.length > 0
    ? allowedExtensions.map(e => `.${e}`).join(',')
    : undefined);

  const hintText = allowedExtensions.length > 0
    ? `Allowed: ${allowedExtensions.map(e => e.toUpperCase()).join(', ')}`
    : effectiveAccept;

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">{label}</label>}

      {/* Compact upload button */}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-primary/10 dark:hover:bg-primary/20 border border-gray-200 dark:border-zinc-700 hover:border-primary/40 text-gray-600 dark:text-zinc-300 hover:text-primary rounded-lg text-sm font-medium transition-all">
        <Paperclip className="w-4 h-4" />
        Attach file{multiple ? 's' : ''}
        {hintText && <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-normal">({hintText})</span>}
      </button>
      <input ref={ref} type="file" className="hidden" multiple={multiple} accept={effectiveAccept} onChange={handleChange} />

      {/* Rejected files warning */}
      {rejectedFiles.length > 0 && (
        <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {rejectedFiles.length} file(s) rejected — wrong type for this category
            </p>
          </div>
          {rejectedFiles.map((f, i) => (
            <p key={i} className="text-[11px] text-red-500 dark:text-red-400 ml-5">{f.name}</p>
          ))}
        </div>
      )}

      {/* Accepted files list */}
      {activeFiles.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {activeFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-zinc-300 flex-1 truncate">{file.name}</span>
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">{(file.size / 1024).toFixed(0)} KB</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-gray-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
