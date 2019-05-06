export interface DiagnosticFrequency {
  cause: string;
  marker?: string;
  ratio: number;
  count: number;
}

export interface Diagnostic {
  path: string[];
  type: string;
  name: string;
  marker?: string;
  frequencies: DiagnosticFrequency[];
}
