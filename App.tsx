
import React, { useState, useCallback } from 'react';
import { restructureSpreadsheet } from './services/geminiService';
import { downloadCSV } from './utils/csvHelper';
import { ProcessedData } from './types';
import FileUpload from './components/FileUpload';
import StructureInput from './components/StructureInput';
import ResultTable from './components/ResultTable';
import Loader from './components/Loader';
import { FileIcon, TargetIcon, DownloadIcon, SparklesIcon } from './components/Icons';

export default function App() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [targetStructure, setTargetStructure] = useState<string>('');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setSourceFile(file);
    setError(null);
    setProcessedData(null);
  };

  const handleStructureChange = (structure: string) => {
    setTargetStructure(structure);
    setError(null);
    setProcessedData(null);
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceFile || !targetStructure) {
      setError('Please provide both a source file and a target structure.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedData(null);

    try {
      const result = await restructureSpreadsheet(sourceFile.name, targetStructure);
      setProcessedData(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [sourceFile, targetStructure]);

  const isButtonDisabled = !sourceFile || !targetStructure.trim() || isLoading;

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
              <FileUpload onFileChange={handleFileChange} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TargetIcon className="w-6 h-6 mr-2 text-teal-500" />
                2. Define Target Structure
              </h2>
              <StructureInput value={targetStructure} onChange={handleStructureChange} />
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isButtonDisabled}
              className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-400 rounded-lg shadow-lg hover:from-blue-600 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isLoading ? 'Restructuring...' : 'Restructure Spreadsheet'}
            </button>
          </div>
        </form>
        
        {isLoading && <Loader />}

        {error && (
          <div className="mt-8 max-w-4xl mx-auto text-center bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {processedData && (
          <div className="mt-12 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Restructured Data</h2>
              <button
                onClick={() => downloadCSV(processedData.data, 'restructured-data.csv')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download CSV
              </button>
            </div>
            <ResultTable headers={processedData.headers} data={processedData.data} />
          </div>
        )}
      </main>
    </div>
  );
}
