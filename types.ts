export type DataRow = Record<string, string | number>;

export interface ProcessedData {
  headers: string[];
  data: DataRow[];
  transformationSummary: string[];
  aiCommentary: string;
}

export interface GeminiResponse {
    headers: string[];
    rows: string[][];
    transformationSummary: string[];
    aiCommentary: string;
}

export interface HistoryEntry {
  id: number;
  sourceFileName: string;
  templateFileName: string;
  timestamp: string;
  processedData: ProcessedData;
}
