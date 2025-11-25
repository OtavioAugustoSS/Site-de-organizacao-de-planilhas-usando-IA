import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, FileText } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  selectedFile: FileData | null;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onFileSelect, 
  onClear, 
  selectedFile, 
  accept = ".xlsx,.xls,.csv,.ods" 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
      <div className="flex items-center gap-3 mb-4">
        {selectedFile ? (
            <FileText className="text-primary w-6 h-6" />
        ) : (
            <FileSpreadsheet className="text-primary w-6 h-6" />
        )}
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{label}</h2>
      </div>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-48 rounded-lg 
          border-2 border-dashed transition-all duration-200 flex-grow
          ${selectedFile 
            ? 'border-primary bg-sky-50 dark:bg-sky-900/20 cursor-default' 
            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer'
          }
          ${isDragging ? 'border-primary scale-[0.99] bg-sky-50 dark:bg-sky-900/10' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileInput}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center animate-fadeIn text-center p-4">
            <div className="bg-white dark:bg-slate-700 p-3 rounded-full shadow-sm mb-3">
               <FileSpreadsheet className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1 max-w-[200px] truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {selectedFile.headers.length} Columns detected
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 font-medium px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <X className="w-3 h-3" /> Remove File
            </button>
          </div>
        ) : (
          <div className="text-center p-4 pointer-events-none">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              XLSX, XLS, CSV or ODS
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
