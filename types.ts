export type DataRow = Record<string, string | number>;

export interface ProcessedData {
  headers: string[];
  data: DataRow[];
  transformationSummary: string[];
}

export interface GeminiResponse {
    headers: string[];
    rows: string[][];
    transformationSummary: string[];
}
