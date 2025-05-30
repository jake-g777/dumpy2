import Papa from 'papaparse';
import { RawFileData } from './fileUtils';

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export const parseFileData = (data: string[][]): ParsedData => {
  if (!data || data.length === 0) {
    return { headers: [], rows: [] };
  }

  // Assume first row is headers
  const headers = data[0].map(header => header.trim());
  const rows = data.slice(1);

  return { headers, rows };
};

export const parseDataWithHeaderRow = (data: string[][], headerRowIndex: number): ParsedData => {
  if (!data || data.length === 0 || headerRowIndex >= data.length) {
    return { headers: [], rows: [] };
  }

  const headers = data[headerRowIndex].map(header => header.trim());
  const rows = data.slice(headerRowIndex + 1);

  return { headers, rows };
}; 