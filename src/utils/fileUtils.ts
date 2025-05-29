import Papa from 'papaparse';

export interface RawFileData {
  type: 'csv' | 'json' | 'txt';
  data: any;
  rows?: string[][];
}

export const readFile = async (file: File): Promise<RawFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.type === 'application/json') {
          const jsonData = JSON.parse(e.target?.result as string);
          resolve({
            type: 'json',
            data: jsonData
          });
        } else {
          const text = e.target?.result as string;
          Papa.parse(text, {
            complete: (results) => {
              resolve({
                type: file.type === 'text/csv' ? 'csv' : 'txt',
                data: text,
                rows: results.data as string[][]
              });
            },
            error: () => {
              reject(new Error('Failed to parse file'));
            }
          });
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}; 