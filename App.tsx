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
      const fileType = type === 'source' ? 'de origem' : 'modelo';
      setLoadingMessage(`Lendo planilha ${fileType}...`);
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
        setError(err instanceof Error ? err.message : `Não foi possível ler o arquivo ${fileType}.`);
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
      setError('Por favor, forneça a planilha de origem e a planilha modelo.');
      return;
    }

    setLoadingMessage('A IA está analisando e reestruturando...');
    setIsLoading(true);
    setError(null);
    setProcessedData(null);

    try {
      const result = await restructureSpreadsheet(sourceData, templateData);
      setProcessedData(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
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
            IA para Reestruturação de Planilhas
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Reformate automaticamente suas planilhas para corresponder a qualquer estrutura usando o poder da IA.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileIcon className="w-6 h-6 mr-2 text-blue-500" />
                1. Enviar Planilha de Origem
              </h2>
              <FileUpload onFileChange={(file) => handleFileChange(file, 'source')} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold mb-4 flex items-center">
                <TargetIcon className="w-6 h-6 mr-2 text-teal-500" />
                2. Enviar Planilha Modelo
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
              {isLoading ? loadingMessage : 'Reestruturar Planilha'}
            </button>
          </div>
        </form>
        
        {isLoading && <Loader message={loadingMessage} />}

        {error && (
          <div className="mt-8 max-w-4xl mx-auto text-center bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {processedData && (
          <div className="mt-12 max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Transformação Concluída!</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Sua nova planilha está pronta para download.</p>
              <button
                onClick={() => downloadXLSX(processedData.data, 'dados-reestruturados.xlsx')}
                className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transform hover:scale-105 transition-all duration-300"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Baixar XLSX
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-center">Resumo da Transformação</h3>
              
              <div className="mb-6 p-4 bg-blue-50 dark:bg-gray-700/50 border-l-4 border-blue-400 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <SparklesIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {processedData.aiCommentary}
                    </p>
                  </div>
                </div>
              </div>

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