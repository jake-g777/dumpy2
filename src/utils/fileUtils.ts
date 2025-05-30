import Papa from 'papaparse';

export interface FileData {
  type: 'csv' | 'json';
  data: any;
  rows?: string[][];
}

export const readFile = async (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          resolve({
            type: 'json',
            data: jsonData
          });
        } else {
          // Assume CSV for other files
          Papa.parse(content, {
            complete: (results) => {
              resolve({
                type: 'csv',
                data: results.data,
                rows: results.data as string[][]
              });
            },
            error: (error) => {
              reject(error);
            }
          });
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

export const parseFileData = (fileData: FileData) => {
  if (fileData.type === 'json') {
    throw new Error('JSON files should be parsed using parseJsonData');
  }
  
  if (!fileData.rows || fileData.rows.length === 0) {
    throw new Error('No data found in file');
  }
  
  const headers = fileData.rows[0];
  const rows = fileData.rows.slice(1);
  
  return {
    headers,
    rows
  };
};

export const parseJsonData = (jsonData: any, path: string[]) => {
  let current = jsonData;
  
  for (const key of path) {
    if (current === undefined || current === null) {
      throw new Error(`Invalid path: ${path.join('.')}`);
    }
    current = current[key];
  }
  
  if (!Array.isArray(current)) {
    throw new Error('Selected path does not point to an array');
  }
  
  if (current.length === 0) {
    return {
      headers: [],
      rows: []
    };
  }
  
  const firstItem = current[0];
  const headers = Object.keys(firstItem);
  const rows = current.map(item => headers.map(header => item[header]?.toString() ?? ''));
  
  return {
    headers,
    rows
  };
};

export const extractJsonPaths = (jsonData: any): { path: string[]; type: 'array' | 'object' }[] => {
  const paths: { path: string[]; type: 'array' | 'object' }[] = [];
  
  const traverse = (obj: any, currentPath: string[] = []) => {
    if (Array.isArray(obj)) {
      paths.push({ path: currentPath, type: 'array' });
    } else if (obj && typeof obj === 'object') {
      paths.push({ path: currentPath, type: 'object' });
      Object.entries(obj).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          traverse(value, [...currentPath, key]);
        }
      });
    }
  };
  
  traverse(jsonData);
  return paths;
};

export const parseDataWithHeaderRow = (rows: string[][], headerRowIndex: number) => {
  if (headerRowIndex >= rows.length) {
    throw new Error('Header row index out of bounds');
  }
  
  const headers = rows[headerRowIndex];
  const dataRows = rows.slice(headerRowIndex + 1);
  
  return {
    headers,
    rows: dataRows
  };
};

export const handleExport = (data: { headers: string[]; rows: string[][] }) => {
  const csv = Papa.unparse({
    fields: data.headers,
    data: data.rows
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'export.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 