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

interface JsonPath {
  path: string[];
  type: 'array' | 'object';
}

export const extractJsonPaths = (data: any): JsonPath[] => {
  const paths: JsonPath[] = [];

  const traverse = (obj: any, currentPath: string[] = []) => {
    if (Array.isArray(obj)) {
      paths.push({
        path: currentPath,
        type: 'array'
      });
      
      if (obj.length > 0) {
        traverse(obj[0], [...currentPath, '0']);
      }
    } else if (obj && typeof obj === 'object') {
      paths.push({
        path: currentPath,
        type: 'object'
      });

      Object.keys(obj).forEach(key => {
        traverse(obj[key], [...currentPath, key]);
      });
    }
  };

  traverse(data);
  return paths;
};

export const getValueAtPath = (obj: any, path: string[]): any => {
  return path.reduce((current, key) => current?.[key], obj);
};

export const parseJsonData = (data: any, path: string[]): { headers: string[]; rows: string[][] } => {
  let current = data;
  for (const key of path) {
    current = current[key];
  }

  if (Array.isArray(current)) {
    if (current.length === 0) {
      return { headers: [], rows: [] };
    }

    const firstItem = current[0];
    const headers = Object.keys(firstItem);
    const rows = current.map(item => 
      headers.map(header => String(item[header] ?? ''))
    );

    return { headers, rows };
  } else if (typeof current === 'object' && current !== null) {
    const headers = Object.keys(current);
    const rows = [headers.map(header => String(current[header] ?? ''))];
    return { headers, rows };
  }

  return { headers: [], rows: [] };
};