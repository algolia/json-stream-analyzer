import { SchemaType, SchemaTypeID } from './inference';

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
  tag?: any;
}

export interface PathDiagnosticAggregate {
  path: string[];
  issues: Diagnostic[];
  nbIssues: number;
  totalAffected: number;
  total: number;
}

export interface Analysis {
  processed: {
    count: number;
  };
  issues: PathDiagnosticAggregate[];
  dismissed: PathDiagnosticAggregate[];
  model: SchemaType;
}

export interface Analyzer {
  diagnose: () => Analysis;
}
