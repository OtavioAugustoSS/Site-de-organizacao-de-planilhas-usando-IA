import { DataRow } from '../types';

declare const XLSX: any; // From sheetjs CDN

export function readFileAsCSV(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                const data = event.target?.result;
                if (!data) {
                    reject(new Error("File content is empty."));
                    return;
                }
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) {
                    reject(new Error("Spreadsheet contains no sheets."));
                    return;
                }
                const worksheet = workbook.Sheets[firstSheetName];
                const csvString = XLSX.utils.sheet_to_csv(worksheet);
                resolve(csvString);
            } catch (error) {
                console.error("Error processing spreadsheet file:", error);
                reject(new Error("Failed to parse the spreadsheet file. It might be corrupted or in an unsupported format."));
            }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            reject(new Error("Failed to read the file."));
        };

        reader.readAsBinaryString(file);
    });
}

export function downloadXLSX(data: DataRow[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to download.');
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Restructured Data");
  
  // Generate and trigger download
  XLSX.writeFile(workbook, filename, { bookType: "xlsx", type: "binary" });
}
