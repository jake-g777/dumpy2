import Papa from 'papaparse';
import { RawFileData } from './fileUtils';

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export const parseFileData = (fileData: RawFileData): ParsedData => {
  if (fileData.type === 'json') {
    throw new Error('Cannot parse JSON data with parseFileData');
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