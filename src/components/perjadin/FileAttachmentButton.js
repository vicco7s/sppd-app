import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Loader2 } from 'lucide-react';
import { createSignedUrl } from '@/lib/supabase/createSignedUrl';
import toast from 'react-hot-toast';

const FileAttachmentButton = ({ path, fileName, label = "Surat Undangan" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenFile = async () => {
    if (!path) {
      toast.error('File tidak ditemukan');
      return;
    }

    setIsLoading(true);
    try {
      const signedUrl = await createSignedUrl(path);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        throw new Error('Gagal mendapatkan akses file');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Gagal membuka file. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenFile}
      disabled={isLoading || !path}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-indigo-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
      </div>
      <div className="flex flex-col items-start text-left">
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
        <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">
          {fileName || 'Lihat Dokumen'}
        </span>
      </div>
      <ExternalLink size={14} className="ml-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
    </button>
  );
};

export default FileAttachmentButton;
