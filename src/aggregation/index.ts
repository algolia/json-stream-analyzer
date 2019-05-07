import { Analysis } from '../analysis';
import { Diagnostic } from '../analysis/models';
import { UnionType, ArrayType, ObjectType, SchemaType } from '../inference';

export interface PathDiagnosticAggregate {
  path: string[];
  issues: Diagnostic[];
  nbIssues: number;
  totalAffected: number;
  total: number;
}

const convertPathToKey = (path: string[]): string => {
  return path
    .filter(segment => !segment.match(/^(\[.*\])|(\(.*\))$/))
    .join('&');
};

const traverseModel = (
  path: string[],
  model: SchemaType
): { model: SchemaType; path: string[] } => {
  const actualPath: string[] = [];
  let schema = model;

  let pathTraversed = false;
  while (!pathTraversed && path.length > 0) {
    const segment = path.shift();
    actualPath.push(segment!);

    if (segment!.match(/^\(.*\)$/) && schema.type === 'Union') {
      // the type-check is fail-safe -- this should never be false without a processing bug
      const match = segment!.match(/^\((.*)\)$/);
      schema = (schema as UnionType).types[match![0]];
    } else if (segment!.match(/^\[.*\]$/) && schema.type === 'Array') {
      // the type-check is a fail-safe -- this should never be false without a processing bug
      const match = segment!.match(/^\[(.*)\]$/);
      schema = (schema as ArrayType).types[match![0]];
    } else if (schema.type === 'Object') {
      schema = (schema as ObjectType).schema[segment!];
    } else {
      pathTraversed = true;
      // the last added element was actually not used to traverse the model
      actualPath.pop();
    }
  }

  return { model: schema, path: actualPath };
};

export const aggregateByPath = (
  analysis: Analysis
): PathDiagnosticAggregate[] => {
  const pathIssues: { [key: string]: Diagnostic[] } = analysis.issues.reduce(
    (acc: { [key: string]: Diagnostic[] }, diagnostic) => {
      const pathKey = convertPathToKey(diagnostic.path);
      const list = acc[pathKey] || [];
      list.push(diagnostic);
      return { ...acc, [pathKey]: list };
    },
    {}
  );

  return Object.values(pathIssues).map(
    (diagnostics: Diagnostic[]): PathDiagnosticAggregate => {
      const { model, path } = traverseModel(
        diagnostics[0].path,
        analysis.model
      );
      return {
        path,
        issues: diagnostics,
        nbIssues: diagnostics.length,
        totalAffected: diagnostics.reduce(
          (sum, { affected }) => sum + affected,
          0
        ),
        total: model.counter,
      };
    }
  );
};
