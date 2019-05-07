export type SchemaTypeID =
  | 'unknownType'
  | 'String'
  | 'Boolean'
  | 'Number'
  | 'Null'
  | 'Missing'
  | 'Object'
  | 'Array'
  | 'Union';

export interface ComplexTypeStatistics {
  [key: string]: {
    counter: number;
    marker?: string;
  };
}

export interface PathStatistics {
  path: string[];
  total: number;
  stats: ComplexTypeStatistics;
  type: SchemaTypeID;
}

export type DiagnosticID =
  | 'missing'
  | 'emptyArray'
  | 'inconsistentType'
  | 'polymorphicArray'
  | 'numericalKeyOnObject';

export interface Diagnostic {
  id: DiagnosticID;
  title: string;
  type: SchemaTypeID;
  path: string[];
  affected: number;
  marker?: string;
}

export interface PathDiagnosticAggregate {
  path: string[];
  issues: Diagnostic[];
  nbIssues: number;
  totalAffected: number;
  total: number;
}
