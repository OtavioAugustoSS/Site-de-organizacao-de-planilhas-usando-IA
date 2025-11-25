import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Wand2, Download, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import { FileData, ProcessingState, RestructureResult } from './types';
import { parseExcelFile, generateExcelFile } from './services/excelService';
import { analyzeColumnMapping } from './services/geminiService';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  // File States
  const [sourceFile, setSourceFile] = useState<FileData | null>(null);
  const [templateFile, setTemplateFile] = useState<FileData | null>(null);
  
  // Processing States
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [result, setResult] = useState<RestructureResult | null>(null);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFileSelect = async (file: File, type: 'source' | 'template') => {
    try {
      setProcessingState({ status: 'reading' });
      const data = await parseExcelFile(file);
      if (type === 'source') {
        setSourceFile(data);
        // Reset result if source changes
        setResult(null); 
      } else {
        setTemplateFile(data);
      }
      setProcessingState({ status: 'idle' });
    } catch (error) {
      console.error(error);
      setProcessingState({ 
        status: 'error', 
        message: 'Failed to read file. Please ensure it is a valid spreadsheet.' 
      });
    }
  };

  const handleRestructure = async () => {
    if (!sourceFile || !templateFile) return;

    try {
      setProcessingState({ status: 'analyzing' });

      // 1. Analyze with Gemini
      const analysis = await analyzeColumnMapping(
        sourceFile.headers,
        templateFile.headers,
        sourceFile.rows
      );

      setProcessingState({ status: 'building' });

      // 2. Build new dataset based on mappings
      const newRows = sourceFile.rows.map(sourceRow => {
        const newRow: any = {};
        
        analysis.mappings.forEach(mapping => {
          if (mapping.sourceHeader && mapping.sourceHeader !== 'null') {
            newRow[mapping.targetHeader] = sourceRow[mapping.sourceHeader];
          } else {
            newRow[mapping.targetHeader] = ""; // Empty string for unmapped columns
          }
        });
        
        return newRow;
      });

      // 3. Generate Blob
      const newFileName = `Restructured_${sourceFile.name.replace(/\.[^/.]+$/, "")}.xlsx`;
      const blob = generateExcelFile(newRows, newFileName);

      // 4. Set Result
      const mappingsRecord: Record<string, string> = {};
      analysis.mappings.forEach(m => {
        if (m.sourceHeader) mappingsRecord[m.targetHeader] = m.sourceHeader;
      });

      setResult({
        fileName: newFileName,
        blob: blob,
        summary: analysis.summary,
        mappings: mappingsRecord
      });

      setProcessingState({ status: 'complete' });

    } catch (error: any) {
      console.error(error);
      setProcessingState({ 
        status: 'error', 
        message: error.message || 'An unexpected error occurred during restructuring.' 
      });
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = window.URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const canRestructure = sourceFile && templateFile && processingState.status !== 'analyzing' && processingState.status !== 'reading' && processingState.status !== 'building';

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Header / Theme Toggle */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200"
        >
          {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </header>

      <main className="w-full max-w-5xl mx-auto flex-grow flex flex-col">
        {/* Title Section */}
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI for Spreadsheet <span className="text-primary">Restructuring</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Automatically reformat your spreadsheets to match any template structure using the power of AI.
          </p>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <FileUpload 
            label="Original File (Source)"
            accept=".xlsx,.xls,.csv"
            selectedFile={sourceFile}
            onFileSelect={(f) => handleFileSelect(f, 'source')}
            onClear={() => { setSourceFile(null); setResult(null); setProcessingState({status: 'idle'}); }}
          />
          <FileUpload 
            label="Template File (Destination)"
            accept=".xlsx,.xls,.csv"
            selectedFile={templateFile}
            onFileSelect={(f) => handleFileSelect(f, 'template')}
            onClear={() => { setTemplateFile(null); setProcessingState({status: 'idle'}); }}
          />
        </div>

        {/* Action Button */}
        <div className="text-center mb-12">
          <button
            onClick={handleRestructure}
            disabled={!canRestructure}
            className={`
              relative group overflow-hidden font-bold py-4 px-10 rounded-xl shadow-lg transition-all duration-300 transform 
              flex items-center gap-3 mx-auto text-lg
              ${canRestructure 
                ? 'bg-primary hover:bg-sky-400 text-white hover:scale-105 hover:shadow-primary/40' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {processingState.status === 'analyzing' || processingState.status === 'building' ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-6 h-6" />
                Restructure Spreadsheet
              </>
            )}
          </button>
          
          {processingState.status === 'error' && (
            <p className="mt-4 text-red-500 dark:text-red-400 flex items-center justify-center gap-2 animate-pulse">
              <AlertCircle className="w-5 h-5" /> {processingState.message}
            </p>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Summary Card */}
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <CheckCircle2 className="text-primary w-6 h-6" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Process Summary</h3>
            </div>
            
            <div className="flex-grow flex items-center justify-center">
              {result ? (
                <div className="text-left w-full space-y-4 animate-fadeIn">
                  <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-lg border border-sky-100 dark:border-sky-800/30">
                     <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                       {result.summary}
                     </p>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Mapping</h4>
                    {Object.entries(result.mappings).map(([target, source], idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                         <span className="text-slate-600 dark:text-slate-400 font-medium">{source}</span>
                         <span className="text-slate-300 dark:text-slate-600 px-2">→</span>
                         <span className="text-primary font-medium">{target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  <p className="mb-2">No changes made yet.</p>
                  <p className="text-sm opacity-75">When you restructure a spreadsheet, the summary will appear here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Download Card */}
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <Download className="text-primary w-6 h-6" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Final Download</h3>
            </div>
            
            <div className="flex-grow flex flex-col items-center justify-center gap-6 py-8">
              <button
                onClick={handleDownload}
                disabled={!result}
                className={`
                  font-bold py-3 px-8 rounded-lg inline-flex items-center gap-2 transition-all duration-200
                  ${result 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transform hover:-translate-y-1' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                <Download className="text-xl" />
                Download Restructured Sheet
              </button>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                {result 
                  ? `Ready to download: ${result.fileName}`
                  : "The restructured file will be available here after processing."
                }
              </p>
            </div>
          </div>

        </div>
      </main>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
