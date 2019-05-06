import { SchemaType, PathStatistics, ComplexTypeStatistics } from '../inferer';
import { Diagnostic, DiagnosticFrequency } from './models';

const computeDiagnosticFrequencies = (
  stats: ComplexTypeStatistics
): DiagnosticFrequency[] => {
  const total = Object.values(stats).reduce(
    (sum, { counter }) => sum + counter,
    0
  );

  const frequencies: DiagnosticFrequency[] = Object.entries(stats).map(
    ([key, value]) => {
      return {
        cause: key,
        marker: value.marker,
        ratio: value.counter / total,
        count: value.counter,
      };
    }
  );

  return frequencies;
};

const diagnoseMissingType = (pathStats: PathStatistics): string | null => {
  if (pathStats.stats.Missing) {
    const ratio =
      pathStats.stats.Missing.counter /
      Object.values(pathStats.stats).reduce(
        (sum, { counter }) => sum + counter,
        0
      );
    if (ratio < 0.5) {
      return 'missing';
    } else {
      return 'extra';
    }
  }

  return null;
};

const isMultiType = (types: string[]): boolean => {
  if (types.length === 2 && types.indexOf('Missing') === -1) return true;
  return types.length > 2;
};

const diagnoseMultiType = (pathStats: PathStatistics): string | null => {
  if (isMultiType(Object.keys(pathStats.stats))) {
    return 'multi';
  }

  return null;
};

const diagnoseNumericalKeysOnObject = (
  pathStats: PathStatistics
): string | null => {
  const leaf = pathStats.path.slice(-1)[0];
  if (Number.isNaN(parseFloat(leaf))) {
    return null;
  }

  return 'numericalKeys';
};

const diagnoseTypeIssues = (model: SchemaType): Diagnostic[] => {
  const pathList = model.asList();

  return pathList.reduce((diagnostics: Diagnostic[], path: PathStatistics) => {
    const frequencies = computeDiagnosticFrequencies(path.stats);
    const issues = [
      diagnoseMissingType(path),
      diagnoseMultiType(path),
      diagnoseNumericalKeysOnObject(path),
    ].filter(v => Boolean(v));

    if (issues.length) {
      return diagnostics.concat(
        issues.map(name => ({
          path: path.path,
          type: path.type,
          name: name as string,
          frequencies,
        }))
      );
    }

    return diagnostics;
  }, []);
};

export default diagnoseTypeIssues;
