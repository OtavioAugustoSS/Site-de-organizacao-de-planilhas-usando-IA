
import React, { useState, useRef } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileChange(file);
    } else {
      setFileName('');
      onFileChange(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".xlsx, .xls, .csv"
      />
      <div
        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">XLSX, XLS, or CSV</p>
        </div>
      </div>
      {fileName && (
        <div className="mt-4 text-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
          Selected: <span className="font-semibold">{fileName}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
