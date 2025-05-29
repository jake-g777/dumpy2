export const validateJson = (jsonString: string) => {
  try {
    // Try to parse the JSON string
    const parsed = JSON.parse(jsonString);
    
    // Check if it's an object or array
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Input is valid JSON, but not an object or array');
    }
    
    return parsed;
  } catch (error) {
    // Enhance error message for syntax errors
    if (error instanceof SyntaxError) {
      throw new Error(`JSON syntax error: ${error.message}`);
    }
    throw error;
  }
};

export const getDisplayValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }
    return 'Object';
  }
  
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > 50) {
      return `${value.substring(0, 47)}...`;
    }
    return value;
  }
  
  // For other primitive types
  return String(value);
};

export const getValueType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

export const pathToPropertyName = (path: (string | number)[]): string => {
  // Skip the 'root' if it's the first element
  const segments = path[0] === 'root' ? path.slice(1) : path;
  
  if (segments.length === 0) return 'Root';
  
  // Get the last segment as the property name
  const lastSegment = String(segments[segments.length - 1]);
  
  // Convert to PascalCase for class name
  return toPascalCase(lastSegment);
};

// Convert a string to PascalCase
export const toPascalCase = (str: string): string => {
  // Handle special characters, numbers at the beginning
  const safeStr = str.replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[^a-zA-Z]+/, '') // Remove non-alphabetic characters from start
    .replace(/^[0-9]/, ''); // Ensure doesn't start with a number
  
  // Ensure the string starts with an uppercase letter
  return safeStr.charAt(0).toUpperCase() + safeStr.slice(1);
};

// Convert a string to camelCase
export const toCamelCase = (str: string): string => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export interface JsonPath {
  path: string[];
  type: 'array' | 'object';
}

export const extractJsonPaths = (obj: any, currentPath: string[] = []): JsonPath[] => {
  let paths: JsonPath[] = [];
  
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
      paths.push({ path: currentPath, type: 'array' });
    }
    obj.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        paths = [...paths, ...extractJsonPaths(item, [...currentPath, index.toString()])];
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    paths.push({ path: currentPath, type: 'object' });
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        paths = [...paths, ...extractJsonPaths(value, [...currentPath, key])];
      }
    });
  }
  
  return paths;
};

export const getValueAtPath = (obj: any, path: string[]): any => {
  return path.reduce((current, key) => current?.[key], obj);
};

export const parseJsonData = (data: any, path?: JsonPath): { headers: string[]; rows: string[][] } => {
  let targetData = path ? getValueAtPath(data, path.path) : data;
  let rows: string[][] = [];
  let headers: string[] = [];
  
  if (Array.isArray(targetData)) {
    if (targetData.length > 0 && typeof targetData[0] === 'object') {
      headers = Object.keys(targetData[0]);
      rows = targetData.map(item => headers.map(header => String(item[header] ?? '')));
    }
    else if (targetData.length > 0 && Array.isArray(targetData[0])) {
      headers = targetData[0].map((_: any, i: number) => `Column ${i + 1}`);
      rows = targetData.map(row => row.map((cell: unknown) => String(cell ?? '')));
    }
  }
  else if (typeof targetData === 'object' && targetData !== null) {
    headers = Object.keys(targetData);
    rows = [headers.map(header => String(targetData[header] ?? ''))];
  }

  return { headers, rows };
};