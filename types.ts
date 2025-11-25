export interface FileData {
  name: string;
  headers: string[];
  rows: any[];
  rawFile: File;
}

export interface RestructureResult {
  fileName: string;
  blob: Blob;
  summary: string;
  mappings: Record<string, string>; // Target Header -> Source Header
}

export interface ProcessingState {
  status: 'idle' | 'reading' | 'analyzing' | 'building' | 'complete' | 'error';
  message?: string;
}

// Gemini Response Schema
export interface AIAnalysisResponse {
  mappings: {
    targetHeader: string;
    sourceHeader: string | null;
    confidence: number;
    reasoning: string;
  }[];
  summary: string;
}
