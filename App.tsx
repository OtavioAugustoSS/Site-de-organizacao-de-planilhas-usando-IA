import React, { useState, useCallback } from 'react';
import { restructureSpreadsheet } from './services/geminiService';
import { downloadXLSX, readFileAsCSV } from './utils/csvHelper';
import { ProcessedData } from './types';
import FileUpload from './components/FileUpload';
import Loader from './components/Loader';
import { FileIcon, TargetIcon, DownloadIcon, SparklesIcon, CheckCircleIcon } from './components/Icons';

export default function App() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceData, setSourceData] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateData, setTemplateData] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    file: File | null, 
    type: 'source' | 'template'
  ) => {
    setError(null);
    setProcessedData(null);
    
    if (type === 'source') {
      setSourceFile(file);
    } else {
      setTemplateFile(file);
    }

    if (file) {
      setLoadingMessage(`Reading ${type} spreadsheet...`);
      setIsLoading(true);
      setError(null);
      try {
        const csvString = await readFileAsCSV(file);
        if (type === 'source') {
          setSourceData(csvString);
        } else {
          setTemplateData(csvString);
        }
      } catch (err) {
        if (type === 'source') {
          setSourceData(null);
          setSourceFile(null);
        } else {
          setTemplateData(null);
          setTemplateFile(null);
        }
        setError(err instanceof Error ? err.message : `Could not read the ${type} file.`);
      } finally {
        setIsLoading(false);
      }
    } else {
       if (type === 'source') {
        setSourceData(null);
      } else {
        setTemplateData(null);
      }
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceData || !templateData) {
      setError('Please provide both a source and a template spreadsheet.');
      return;
    }

    setLoadingMessage('AI is analyzing and restructuring...');
    setIsLoading(true);
    setError(null);
    setProcessedData(null);

    try {
      const result = await restructureSpreadsheet(sourceData, templateData);
      setProcessedData(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceData, templateData]);

  const isButtonDisabled = !sourceData || !templateData || isLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
            Spreadsheet Restructuring AI
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Automatically reformat your spreadsheets to match any structure using the power of AI.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileIcon className="w-6 h-6 mr-2 text-blue-500" />
                1. Upload Source Spreadsheet
              </h2>
              <FileUpload onFileChange={(file) => handleFileChange(file, 'source')} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TargetIcon className="w-6 h-6 mr-2 text-teal-500" />
                2. Upload Template Spreadsheet
              </h2>
              <FileUpload onFileChange={(file) => handleFileChange(file, 'template')} />
            </div>

          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-400 rounded-lg shadow-lg hover:from-blue-600 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isLoading ? loadingMessage : 'Restructure Spreadsheet'}
            </button>
          </div>
        </form>
        
        {isLoading && <Loader message={loadingMessage} />}

        {error && (
          <div className="mt-8 max-w-4xl mx-auto text-center bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {processedData && (
          <div className="mt-12 max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Transformation Complete!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Your new spreadsheet is ready for download.</p>
              <button
                onClick={() => downloadXLSX(processedData.data, 'restructured-data.xlsx')}
                className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transform hover:scale-105 transition-all duration-300"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download XLSX
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-center">Transformation Summary</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                {processedData.transformationSummary.map((change, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 mr-3 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}