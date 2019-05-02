export interface DiagnosticFrequency {
  cause: string;
  marker?: string;
  ratio: number;
  count: number;
}

export interface Diagnostic {
  path: string;
  type: string;
  name: string;
  marker?: string;
  frequencies: DiagnosticFrequency[]
}

// Type models
export interface TypeStats {
  [key: string]: {
    counter: number,
    marker?: string
  }
}

export interface TypeStatsPath {
  path: string;
  stats: TypeStats,
  type: string;
}
