import { SchemaTypeID } from '../inference';

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
