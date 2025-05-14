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