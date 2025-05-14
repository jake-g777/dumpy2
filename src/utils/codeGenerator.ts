import { SelectedNode } from '../types';
import { toPascalCase, toCamelCase, pathToPropertyName } from './jsonUtils';

interface TypeMapping {
  null: string;
  string: string;
  number: string;
  boolean: string;
  object: string;
  array: string;
}

const typeScriptTypes: TypeMapping = {
  null: 'null',
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  object: 'object',
  array: 'any[]'
};

const cSharpTypes: TypeMapping = {
  null: 'object',
  string: 'string',
  number: 'double',
  boolean: 'bool',
  object: 'object',
  array: 'List<object>'
};

const javaTypes: TypeMapping = {
  null: 'Object',
  string: 'String',
  number: 'Double',
  boolean: 'Boolean',
  object: 'Object',
  array: 'List<Object>'
};

const inferType = (value: any, language: 'typescript' | 'csharp' | 'java'): string => {
  const typeMap = language === 'typescript' 
    ? typeScriptTypes 
    : language === 'csharp' 
      ? cSharpTypes 
      : javaTypes;
  
  if (value === null) return typeMap.null;
  if (Array.isArray(value)) {
    if (value.length === 0) return typeMap.array;
    
    const itemType = inferType(value[0], language);
    const allSameType = value.every(item => inferType(item, language) === itemType);
    
    if (allSameType) {
      if (language === 'typescript') return `${itemType}[]`;
      if (language === 'csharp') return `List<${itemType}>`;
      return `List<${itemType}>`;
    }
    
    return typeMap.array;
  }
  
  if (typeof value === 'object') return typeMap.object;
  return typeMap[typeof value as keyof TypeMapping];
};

export const generateTypeScript = (node: SelectedNode, ignoredNodes: Set<string>): string => {
  if (!node || typeof node.value !== 'object' || node.value === null) {
    return '// Select an object or array node to generate a TypeScript interface';
  }

  const className = pathToPropertyName(node.path);
  const isArray = Array.isArray(node.value);

  const shouldIncludeProperty = (path: (string | number)[]) => {
    return !ignoredNodes.has(path.join('.'));
  };

  if (isArray) {
    if (node.value.length === 0) {
      return `type ${className} = any[];\n`;
    }

    if (typeof node.value[0] === 'object' && node.value[0] !== null) {
      const itemClass = `${className}Item`;
      let code = `interface ${itemClass} {\n`;

      const item = node.value[0];
      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
        const propType = inferType(val, 'typescript');

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += `  ${propName}: ${toPascalCase(key)};\n`;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += `  ${propName}: ${toPascalCase(key)}Item[];\n`;
        } else {
          code += `  ${propName}: ${propType};\n`;
        }
      }

      code += '}\n\n';
      code += `type ${className} = ${itemClass}[];\n`;

      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += '\n' + generateNestedType(key, val, 'typescript', propertyPath, ignoredNodes);
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += '\n' + generateNestedArrayType(key, val[0], 'typescript', propertyPath, ignoredNodes);
        }
      }

      return code;
    }

    const sampleType = typeof node.value[0];
    return `type ${className} = ${sampleType}[];\n`;
  }

  let code = `interface ${className} {\n`;

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
    const propType = inferType(val, 'typescript');

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += `  ${propName}: ${toPascalCase(key)};\n`;
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += `  ${propName}: ${toPascalCase(key)}Item[];\n`;
    } else {
      code += `  ${propName}: ${propType};\n`;
    }
  }

  code += '}\n';

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += '\n' + generateNestedType(key, val, 'typescript', propertyPath, ignoredNodes);
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += '\n' + generateNestedArrayType(key, val[0], 'typescript', propertyPath, ignoredNodes);
    }
  }

  return code;
};

export const generateCSharp = (node: SelectedNode, ignoredNodes: Set<string>): string => {
  if (!node || typeof node.value !== 'object' || node.value === null) {
    return '// Select an object or array node to generate a C# class';
  }

  const className = pathToPropertyName(node.path);
  const isArray = Array.isArray(node.value);

  const shouldIncludeProperty = (path: (string | number)[]) => {
    return !ignoredNodes.has(path.join('.'));
  };

  if (isArray) {
    if (node.value.length === 0) {
      return `public class ${className} : List<object> { }\n`;
    }

    if (typeof node.value[0] === 'object' && node.value[0] !== null) {
      const itemClass = `${className}Item`;
      let code = `using System;\nusing System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\n`;
      code += `public class ${itemClass}\n{\n`;

      const item = node.value[0];
      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        const propName = toPascalCase(key);
        const propType = inferType(val, 'csharp');

        code += `    [JsonPropertyName("${key}")]\n`;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += `    public ${toPascalCase(key)} ${propName} { get; set; }\n\n`;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += `    public List<${toPascalCase(key)}Item> ${propName} { get; set; }\n\n`;
        } else {
          code += `    public ${propType} ${propName} { get; set; }\n\n`;
        }
      }

      code += '}\n\n';
      code += `public class ${className} : List<${itemClass}> { }\n`;

      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += '\n' + generateNestedType(key, val, 'csharp', propertyPath, ignoredNodes);
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += '\n' + generateNestedArrayType(key, val[0], 'csharp', propertyPath, ignoredNodes);
        }
      }

      return code;
    }

    const sampleType = inferType(node.value[0], 'csharp');
    return `public class ${className} : List<${sampleType}> { }\n`;
  }

  let code = `using System;\nusing System.Collections.Generic;\nusing System.Text.Json.Serialization;\n\n`;
  code += `public class ${className}\n{\n`;

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    const propName = toPascalCase(key);
    const propType = inferType(val, 'csharp');

    code += `    [JsonPropertyName("${key}")]\n`;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += `    public ${toPascalCase(key)} ${propName} { get; set; }\n\n`;
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += `    public List<${toPascalCase(key)}Item> ${propName} { get; set; }\n\n`;
    } else {
      code += `    public ${propType} ${propName} { get; set; }\n\n`;
    }
  }

  code += '}\n';

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += '\n' + generateNestedType(key, val, 'csharp', propertyPath, ignoredNodes);
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += '\n' + generateNestedArrayType(key, val[0], 'csharp', propertyPath, ignoredNodes);
    }
  }

  return code;
};

export const generateJava = (node: SelectedNode, ignoredNodes: Set<string>): string => {
  if (!node || typeof node.value !== 'object' || node.value === null) {
    return '// Select an object or array node to generate a Java class';
  }

  const className = pathToPropertyName(node.path);
  const isArray = Array.isArray(node.value);

  const shouldIncludeProperty = (path: (string | number)[]) => {
    return !ignoredNodes.has(path.join('.'));
  };

  if (isArray) {
    if (node.value.length === 0) {
      return `import java.util.ArrayList;\n\npublic class ${className} extends ArrayList<Object> { }\n`;
    }

    if (typeof node.value[0] === 'object' && node.value[0] !== null) {
      const itemClass = `${className}Item`;
      let code = `import java.util.List;\nimport com.fasterxml.jackson.annotation.JsonProperty;\n\n`;
      code += `public class ${itemClass} {\n`;

      const item = node.value[0];
      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        const propName = toCamelCase(key);
        const propType = inferType(val, 'java');

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += `    @JsonProperty("${key}")\n`;
          code += `    private ${toPascalCase(key)} ${propName};\n\n`;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += `    @JsonProperty("${key}")\n`;
          code += `    private List<${toPascalCase(key)}Item> ${propName};\n\n`;
        } else {
          code += `    @JsonProperty("${key}")\n`;
          code += `    private ${propType} ${propName};\n\n`;
        }
      }

      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        const propName = toCamelCase(key);
        const propType = inferType(val, 'java');
        const methodName = toPascalCase(key);

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += `    public ${toPascalCase(key)} get${methodName}() {\n`;
          code += `        return ${propName};\n    }\n\n`;
          code += `    public void set${methodName}(${toPascalCase(key)} ${propName}) {\n`;
          code += `        this.${propName} = ${propName};\n    }\n\n`;
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += `    public List<${toPascalCase(key)}Item> get${methodName}() {\n`;
          code += `        return ${propName};\n    }\n\n`;
          code += `    public void set${methodName}(List<${toPascalCase(key)}Item> ${propName}) {\n`;
          code += `        this.${propName} = ${propName};\n    }\n\n`;
        } else {
          code += `    public ${propType} get${methodName}() {\n`;
          code += `        return ${propName};\n    }\n\n`;
          code += `    public void set${methodName}(${propType} ${propName}) {\n`;
          code += `        this.${propName} = ${propName};\n    }\n\n`;
        }
      }

      code += '}\n\n';
      code += `import java.util.ArrayList;\n\npublic class ${className} extends ArrayList<${itemClass}> { }\n`;

      for (const [key, val] of Object.entries(item)) {
        const propertyPath = [...node.path, 0, key];
        if (!shouldIncludeProperty(propertyPath)) continue;

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          code += '\n' + generateNestedType(key, val, 'java', propertyPath, ignoredNodes);
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          code += '\n' + generateNestedArrayType(key, val[0], 'java', propertyPath, ignoredNodes);
        }
      }

      return code;
    }

    const sampleType = inferType(node.value[0], 'java');
    return `import java.util.ArrayList;\n\npublic class ${className} extends ArrayList<${sampleType}> { }\n`;
  }

  let code = `import java.util.List;\nimport com.fasterxml.jackson.annotation.JsonProperty;\n\n`;
  code += `public class ${className} {\n`;

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    const propName = toCamelCase(key);
    const propType = inferType(val, 'java');

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += `    @JsonProperty("${key}")\n`;
      code += `    private ${toPascalCase(key)} ${propName};\n\n`;
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += `    @JsonProperty("${key}")\n`;
      code += `    private List<${toPascalCase(key)}Item> ${propName};\n\n`;
    } else {
      code += `    @JsonProperty("${key}")\n`;
      code += `    private ${propType} ${propName};\n\n`;
    }
  }

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    const propName = toCamelCase(key);
    const propType = inferType(val, 'java');
    const methodName = toPascalCase(key);

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += `    public ${toPascalCase(key)} get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(${toPascalCase(key)} ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += `    public List<${toPascalCase(key)}Item> get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(List<${toPascalCase(key)}Item> ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    } else {
      code += `    public ${propType} get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(${propType} ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    }
  }

  code += '}\n';

  for (const [key, val] of Object.entries(node.value)) {
    const propertyPath = [...node.path, key];
    if (!shouldIncludeProperty(propertyPath)) continue;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      code += '\n' + generateNestedType(key, val, 'java', propertyPath, ignoredNodes);
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      code += '\n' + generateNestedArrayType(key, val[0], 'java', propertyPath, ignoredNodes);
    }
  }

  return code;
};

const generateNestedType = (key: string, value: any, language: 'typescript' | 'csharp' | 'java', parentPath?: (string | number)[], ignoredNodes?: Set<string>): string => {
  if (typeof value !== 'object' || value === null) return '';
  
  const className = toPascalCase(key);
  
  const shouldIncludeProperty = (path: (string | number)[]) => {
    return !ignoredNodes?.has(path.join('.'));
  };
  
  if (language === 'typescript') {
    let code = `interface ${className} {\n`;
    for (const [propKey, propVal] of Object.entries(value)) {
      const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
      if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;
      
      const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propKey) ? propKey : `'${propKey}'`;
      const propType = inferType(propVal, language);
      code += `  ${propName}: ${propType};\n`;
    }
    code += '}';
    return code;
  }
  
  if (language === 'csharp') {
    let code = `public class ${className}\n{\n`;
    for (const [propKey, propVal] of Object.entries(value)) {
      const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
      if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;

      const propName = toPascalCase(propKey);
      const propType = inferType(propVal, language);
      
      code += `    [JsonPropertyName("${propKey}")]\n`;
      if (typeof propVal === 'object' && propVal !== null && !Array.isArray(propVal)) {
        code += `    public ${toPascalCase(propKey)} ${propName} { get; set; }\n\n`;
      } else if (Array.isArray(propVal) && propVal.length > 0 && typeof propVal[0] === 'object' && propVal[0] !== null) {
        code += `    public List<${toPascalCase(propKey)}Item> ${propName} { get; set; }\n\n`;
      } else {
        code += `    public ${propType} ${propName} { get; set; }\n\n`;
      }
    }
    code += '}';
    return code;
  }
  
  let code = `public class ${className} {\n`;
  for (const [propKey, propVal] of Object.entries(value)) {
    const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
    if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;

    const propName = toCamelCase(propKey);
    const propType = inferType(propVal, 'java');
    
    code += `    @JsonProperty("${propKey}")\n`;
    if (typeof propVal === 'object' && propVal !== null && !Array.isArray(propVal)) {
      code += `    private ${toPascalCase(propKey)} ${propName};\n\n`;
    } else if (Array.isArray(propVal) && propVal.length > 0 && typeof propVal[0] === 'object' && propVal[0] !== null) {
      code += `    private List<${toPascalCase(propKey)}Item> ${propName};\n\n`;
    } else {
      code += `    private ${propType} ${propName};\n\n`;
    }
  }
  
  for (const [propKey, propVal] of Object.entries(value)) {
    const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
    if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;

    const propName = toCamelCase(propKey);
    const propType = inferType(propVal, 'java');
    const methodName = toPascalCase(propKey);
    
    if (typeof propVal === 'object' && propVal !== null && !Array.isArray(propVal)) {
      code += `    public ${toPascalCase(propKey)} get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(${toPascalCase(propKey)} ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    } else if (Array.isArray(propVal) && propVal.length > 0 && typeof propVal[0] === 'object' && propVal[0] !== null) {
      code += `    public List<${toPascalCase(propKey)}Item> get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(List<${toPascalCase(propKey)}Item> ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    } else {
      code += `    public ${propType} get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(${propType} ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    }
  }
  
  code += '}';
  return code;
};

const generateNestedArrayType = (key: string, value: any, language: 'typescript' | 'csharp' | 'java', parentPath?: (string | number)[], ignoredNodes?: Set<string>): string => {
  if (typeof value !== 'object' || value === null) return '';
  
  const className = `${toPascalCase(key)}Item`;
  
  const shouldIncludeProperty = (path: (string | number)[]) => {
    return !ignoredNodes?.has(path.join('.'));
  };
  
  if (language === 'typescript') {
    let code = `interface ${className} {\n`;
    for (const [propKey, propVal] of Object.entries(value)) {
      const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
      if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;
      
      const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propKey) ? propKey : `'${propKey}'`;
      const propType = inferType(propVal, language);
      code += `  ${propName}: ${propType};\n`;
    }
    code += '}';
    return code;
  }
  
  if (language === 'csharp') {
    let code = `public class ${className}\n{\n`;
    for (const [propKey, propVal] of Object.entries(value)) {
      const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
      if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;

      const propName = toPascalCase(propKey);
      const propType = inferType(propVal, language);
      
      code += `    [JsonPropertyName("${propKey}")]\n`;
      if (typeof propVal === 'object' && propVal !== null && !Array.isArray(propVal)) {
        code += `    public ${toPascalCase(propKey)} ${propName} { get; set; }\n\n`;
      } else if (Array.isArray(propVal) && propVal.length > 0 && typeof propVal[0] === 'object' && propVal[0] !== null) {
        code += `    public List<${toPascalCase(propKey)}Item> ${propName} { get; set; }\n\n`;
      } else {
        code += `    public ${propType} ${propName} { get; set; }\n\n`;
      }
    }
    code += '}';
    return code;
  }
  
  let code = `public class ${className} {\n`;
  for (const [propKey, propVal] of Object.entries(value)) {
    const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
    if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;

    const propName = toCamelCase(propKey);
    const propType = inferType(propVal, 'java');
    
    code += `    @JsonProperty("${propKey}")\n`;
    if (typeof propVal === 'object' && propVal !== null && !Array.isArray(propVal)) {
      code += `    private ${toPascalCase(propKey)} ${propName};\n\n`;
    } else if (Array.isArray(propVal) && propVal.length > 0 && typeof propVal[0] === 'object' && propVal[0] !== null) {
      code += `    private List<${toPascalCase(propKey)}Item> ${propName};\n\n`;
    } else {
      code += `    private ${propType} ${propName};\n\n`;
    }
  }
  
  for (const [propKey, propVal] of Object.entries(value)) {
    const propertyPath = parentPath ? [...parentPath, propKey] : [propKey];
    if (ignoredNodes && !shouldIncludeProperty(propertyPath)) continue;

    const propName = toCamelCase(propKey);
    const propType = inferType(propVal, 'java');
    const methodName = toPascalCase(propKey);
    
    if (typeof propVal === 'object' && propVal !== null && !Array.isArray(propVal)) {
      code += `    public ${toPascalCase(propKey)} get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(${toPascalCase(propKey)} ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    } else if (Array.isArray(propVal) && propVal.length > 0 && typeof propVal[0] === 'object' && propVal[0] !== null) {
      code += `    public List<${toPascalCase(propKey)}Item> get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(List<${toPascalCase(propKey)}Item> ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    } else {
      code += `    public ${propType} get${methodName}() {\n`;
      code += `        return ${propName};\n    }\n\n`;
      code += `    public void set${methodName}(${propType} ${propName}) {\n`;
      code += `        this.${propName} = ${propName};\n    }\n\n`;
    }
  }
  
  code += '}';
  return code;
};