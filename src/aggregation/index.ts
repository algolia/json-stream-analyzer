import { Diagnostic, PathDiagnosticAggregate } from '../models';
import { UnionType, ArrayType, ObjectType, SchemaType } from '../inference';

export const simplifyPath = (path: string[]): string[] => {
  return path
    .map(segment => segment.replace(/^(\[.*\])/, '[]'))
    .filter(segment => !segment.match(/^(\(.*\))$/));
};

/**
 * @param {string[]} path - a JSON Path
 * @returns {string} a simplified key that identifies all types that correspond
 * to a path
 */
export const convertPathToKey = (path: string[]): string => {
  return simplifyPath(path).join('.');
};

const traverseModel = (
  path: string[],
  model: SchemaType
): { model: SchemaType; path: string[] } => {
  const actualPath: string[] = [];
  let schema = model;

  const pathCopy = [...path];
  let pathTraversed = false;
  while (!pathTraversed && pathCopy.length > 0) {
    const segment = pathCopy.shift();
    actualPath.push(segment!);

    if (segment!.match(/^\(.*\)$/) && schema.type === 'Union') {
      // the type-check is fail-safe -- this should never be false without a processing bug
      const match = segment!.match(/^\((.*)\)$/);
      schema = (schema as UnionType).types[match![1]];
    } else if (segment!.match(/^\[.*\]$/) && schema.type === 'Array') {
      // the type-check is a fail-safe -- this should never be false without a processing bug
      const match = segment!.match(/^\[(.*)\]$/);
      schema = (schema as ArrayType).types[match![1]];
    } else if (schema.type === 'Object') {
      schema = (schema as ObjectType).schema[segment!];
    } else {
      pathTraversed = true;
    }
  }

  return { model: schema, path: actualPath };
};

export const aggregateByPath = (
  issues: Diagnostic[],
  model: SchemaType
): PathDiagnosticAggregate[] => {
  const pathIssues: { [key: string]: Diagnostic[] } = issues.reduce(
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
      const { model: subModel, path } = traverseModel(
        diagnostics[0].path,
        model
      );

      return {
        path: simplifyPath(path),
        issues: diagnostics,
        nbIssues: diagnostics.length,
        totalAffected: diagnostics.reduce(
          (sum, { affected }) => sum + affected,
          0
        ),
        total: subModel.counter,
      };
    }
  );
};
