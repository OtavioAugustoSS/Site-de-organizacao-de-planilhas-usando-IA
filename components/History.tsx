import React from 'react';
import { HistoryEntry } from '../types';
import { HistoryIcon, TrashIcon, DownloadIcon, FileIcon, TargetIcon } from './Icons';

interface HistoryProps {
  history: HistoryEntry[];
  onClearHistory: () => void;
  onDownload: (entry: HistoryEntry) => void;
}

const History: React.FC<HistoryProps> = ({ history, onClearHistory, onDownload }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <HistoryIcon className="w-7 h-7 mr-3 text-blue-500" />
          Histórico de Transformações
        </h2>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors"
            aria-label="Limpar histórico"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Limpar Histórico
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>Nenhuma transformação foi realizada ainda.</p>
          <p className="text-sm mt-2">Quando você reestruturar uma planilha, ela aparecerá aqui.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {history.map((entry) => (
            <li key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-grow min-w-0">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                   <span className="font-mono text-xs">{new Date(entry.timestamp).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center mb-1">
                  <FileIcon className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate" title={entry.sourceFileName}>Origem: {entry.sourceFileName}</span>
                </div>
                 <div className="flex items-center">
                  <TargetIcon className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate" title={entry.templateFileName}>Modelo: {entry.templateFileName}</span>
                </div>
              </div>
              <button
                onClick={() => onDownload(entry)}
                className="inline-flex items-center justify-center px-4 py-2 font-semibold text-sm text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto flex-shrink-0"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Baixar Novamente
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
