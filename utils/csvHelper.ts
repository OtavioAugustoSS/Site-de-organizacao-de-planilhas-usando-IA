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

export function downloadCSV(data: DataRow[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to download.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        const value = row[fieldName];
        // Escape quotes by doubling them and wrap in quotes if value contains comma or quote
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}