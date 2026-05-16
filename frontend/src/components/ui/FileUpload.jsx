import React, { useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const FileUpload = ({ label, onChange, multiple = false, accept, files: controlledFiles }) => {
  const ref = useRef(null);
  const [files, setFiles] = React.useState([]);
  const activeFiles = controlledFiles || files;

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const updated = multiple ? [...activeFiles, ...newFiles] : newFiles;
    setFiles(updated);
    onChange?.(updated);
  };

  const removeFile = (index) => {
    const updated = activeFiles.filter((_, i) => i !== index);
    setFiles(updated);
    onChange?.(updated);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">{label}</label>}
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 dark:hover:border-primary/40 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.03] transition-all group">
        <Upload className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2 group-hover:text-primary/50 transition-colors" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          <span className="text-primary font-medium">Click to upload</span> or drag and drop
        </p>
        {accept && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">{accept}</p>}
        <input ref={ref} type="file" className="hidden" multiple={multiple} accept={accept} onChange={handleChange} />
      </div>
      {activeFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {activeFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-lg">
              <FileText className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-zinc-300 flex-1 truncate">{file.name}</span>
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-gray-400">
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
