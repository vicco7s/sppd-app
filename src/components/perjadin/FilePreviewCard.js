import React from 'react';
import { FileText, X, CheckCircle2 } from 'lucide-react';

const FilePreviewCard = ({ file, onRemove, status = 'ready' }) => {
  const isImage = file.type.startsWith('image/');
  
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${isImage ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
          <FileText size={24} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800 truncate max-w-[200px] md:max-w-xs">
            {file.name}
          </h4>
          <div className="flex items-center text-xs text-gray-500 space-x-2">
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            <span>•</span>
            <span className="uppercase">{file.type.split('/')[1]}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {status === 'success' && (
          <div className="flex items-center text-emerald-600 text-xs font-medium mr-2">
            <CheckCircle2 size={16} className="mr-1" />
            Terproses
          </div>
        )}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Hapus file"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default FilePreviewCard;
