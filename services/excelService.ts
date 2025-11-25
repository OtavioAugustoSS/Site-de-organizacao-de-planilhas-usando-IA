import { FileData } from '../types';

// Access the global XLSX variable loaded via CDN in index.html
declare const XLSX: any;

export const parseExcelFile = async (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume data is in the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON (header: 1 returns array of arrays)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          reject(new Error("File is empty"));
          return;
        }

        // Extract headers and rows
        const headers = (jsonData[0] as any[]).map(String);
        // Get remaining rows, convert to object based on headers if needed, 
        // but for now let's keep raw data to preserve integrity until mapping
        // Actually, let's convert to object array for easier manipulation later
        const rowsRaw = jsonData.slice(1);
        const rows = rowsRaw.map((row: any[]) => {
            const rowObj: any = {};
            headers.forEach((h, i) => {
                rowObj[h] = row[i];
            });
            return rowObj;
        });

        resolve({
          name: file.name,
          headers,
          rows,
          rawFile: file
        });
      } catch (err) {
        reject(new Error("Failed to parse spreadsheet"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

export const generateExcelFile = (data: any[], fileName: string): Blob => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Restructured");
  
  // Write to buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
