import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseSuratWithGemini } from '@/lib/ai/parseSuratWithGemini';
import { validateUploadFile } from '@/lib/utils/validateUploadFile';
import { compressImage } from '@/utils/compressImage';
import AiParsingLoader from './AiParsingLoader';
import FilePreviewCard from './FilePreviewCard';
import UploadDropzone from './UploadDropzone';

const UploadSuratAI = ({ onDataExtracted, currentData, isNotaDinas = false }) => {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // If Nota Dinas is active, hide the upload section as per requirements
  if (isNotaDinas) {
    return null;
  }

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    // Validate file using new utility
    const validation = validateUploadFile(selectedFile, { maxSize: 10 * 1024 * 1024 }); // Allow 10MB before compression
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsSuccess(false);
    
    // Compress if image
    let fileToProcess = selectedFile;
    if (selectedFile.type.startsWith('image/')) {
      try {
        fileToProcess = await compressImage(selectedFile);
        // Re-validate after compression (should be < 1MB now)
        const postCompressionValidation = validateUploadFile(fileToProcess, { maxSize: 1 * 1024 * 1024 });
        if (!postCompressionValidation.isValid) {
          toast.error(postCompressionValidation.error);
          return;
        }
      } catch (e) {
        console.warn('Compression failed, using original file', e);
      }
    } else {
      // Re-validate PDF size (max 1MB)
      const pdfValidation = validateUploadFile(selectedFile, { maxSize: 1 * 1024 * 1024 });
      if (!pdfValidation.isValid) {
        toast.error(pdfValidation.error);
        return;
      }
    }
    
    await processDocument(fileToProcess);
  };

  const processDocument = async (selectedFile) => {
    setIsParsing(true);
    
    try {
      const extractedData = await parseSuratWithGemini(selectedFile);
      
      if (extractedData) {
        const finalData = {
          ...extractedData,
          pendingFile: selectedFile
        };
        
        onDataExtracted(finalData);
        setIsSuccess(true);
        toast.success('Dokumen berhasil dianalisis AI. File akan diunggah saat data disimpan.');
      } else {
        throw new Error('Gagal memproses data atau upload file.');
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'Gagal memproses dokumen.');
      toast.error('Gagal memproses dokumen. Silakan coba lagi.');
    } finally {
      setIsParsing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setIsSuccess(false);
  };

  if (isParsing) {
    return <AiParsingLoader />;
  }

  return (
    <div className="w-full space-y-4">
      {!file ? (
        <UploadDropzone onFileSelect={handleFileChange} />
      ) : (
        <div className="space-y-4">
          <FilePreviewCard 
            file={file} 
            onRemove={resetUpload} 
            status={isSuccess ? 'success' : (error ? 'error' : 'ready')} 
          />
          
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button 
                onClick={() => processDocument(file)}
                className="ml-auto flex items-center gap-1 font-bold hover:underline"
              >
                <RefreshCw size={14} /> Coba Lagi
              </button>
            </div>
          )}
          
          {isSuccess && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1">
                <Sparkles size={16} className="text-emerald-500" />
                Berhasil Diekstrak!
              </div>
              <p className="text-xs text-emerald-600">
                Data dari dokumen telah diisi ke form secara otomatis. Silakan tinjau kembali.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadSuratAI;
