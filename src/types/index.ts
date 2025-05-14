export interface JsonData {
  [key: string]: any;
}

export interface SelectedNode {
  path: (string | number)[];
  value: any;
  key: string;
  displayValue: string;
  type: string;
  isArray: boolean;
  isObject: boolean;
}

export interface TreeNodeState {
  isIgnored: boolean;
  path: (string | number)[];
}