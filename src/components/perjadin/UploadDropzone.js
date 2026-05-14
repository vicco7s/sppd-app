import React from 'react';
import { Upload, Sparkles, Zap, FileText } from 'lucide-react';

const UploadDropzone = ({ onFileSelect, accept = ".pdf,.jpg,.jpeg,.png", title = "Upload Surat Undangan" }) => {
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileSelect(droppedFile);
  };

  return (
    <div className="w-full">
      <div 
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="relative group cursor-pointer"
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => onFileSelect(e.target.files[0])}
          accept={accept}
        />
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 group-hover:bg-indigo-50/50 group-hover:border-indigo-400 transition-all duration-300">
          <div className="w-16 h-16 mb-4 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Upload className="text-indigo-500 w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-4">PDF, JPG, PNG (Maks 1MB)</p>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
            <Sparkles size={14} />
            AI akan membantu mengisi form otomatis
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-400 font-medium">
          <span className="flex items-center gap-1">
            <Zap size={10} className="text-amber-400" /> 
            Gunakan file di bawah 1MB untuk hasil instan
          </span>
          <span className="flex items-center gap-1">
            <FileText size={10} /> 
            PDF 1 halaman lebih cepat
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadDropzone;
