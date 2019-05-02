import { SchemaType, UnionType, ArrayType, ObjectType } from "../inferer";
import { Diagnostic, TypeStatsPath, TypeStats, DiagnosticFrequency } from "./models";

// TODO this could maybe be a method on SchemaType (it could allow for easier extensibility -- less files to modify when adding types/formats)
const convertSchemaToPathList = (model: SchemaType, path = '', list: TypeStatsPath[] = []) => {
  if (model.type === 'Union') {
    const unionModel = model as UnionType;
    const stats = Object.entries(unionModel.types).reduce((partial: TypeStats, [ key, value ]) => {
      partial[key] = { counter: value.counter, marker: value.marker };
      return partial;
    }, {});
    list.push({ path, stats, type: 'Union' });

    Object.entries(unionModel.types).forEach(([key, value]) => {
      convertSchemaToPathList(value, `${path}.(${key})`, list);
    })
  }

  if (model.type === 'Array') {
    const arrayModel = model as ArrayType;
    const stats = Object.entries(arrayModel.types).reduce((partial: TypeStats, [ key, value ]) => {
      partial[key] = { counter: value.counter, marker: value.marker };
      return partial;
    }, {});
    list.push({ path, stats, type: 'Array' });

    Object.entries(arrayModel.types).forEach(([key, value]) => {
      convertSchemaToPathList(value, `${path}.[${key}]`, list);
    });
  }

  if (model.type === 'Object') {
    const objectModel = model as ObjectType;
    Object.entries(objectModel.schema).forEach(([key, value]) => {
      convertSchemaToPathList(value, `${path}.${key}`, list);
    });
  }

  return list;
}

const computeDiagnosticFrequencies = (stats: TypeStats): DiagnosticFrequency[] => {
  const total = Object.values(stats).reduce((sum, { counter }) => sum + counter, 0);

  const frequencies: DiagnosticFrequency[] = Object.entries(stats).map(([ key, value ]) => {
    return {
      cause: key,
      marker: value.marker,
      ratio: value.counter/total,
      count: value.counter
    }
  });

  return frequencies;
}

const diagnoseMissingType = (path: TypeStatsPath): string | null => {
  if (path.stats.Missing) {
    const ratio = path.stats.Missing.counter/Object.values(path.stats).reduce((sum, { counter }) => sum + counter, 0);
    if (ratio < 0.5) {
      return 'missing'
    } else {
      return 'extra'
    }
  }

  return null;
};

const isMultiType = (types: string[]) => {
  if (types.length == 2 && types.indexOf('Missing') === -1) return true;
  return types.length > 2;
}

const diagnoseMultiType = (path: TypeStatsPath): string | null => {
  if (isMultiType(Object.keys(path.stats))) {
    return 'multi'
  }

  return null;
};

const diagnoseNumericalKeysOnObject = (path: TypeStatsPath): string | null => {
  const leaf = path.path.split('.').slice(-1)[0];
  if (Number.isNaN(parseFloat(leaf))) {
    return null;
  }
  
  return 'numericalKeys';
};


const diagnoseTypeIssues = (model: SchemaType) => {
  const pathList = convertSchemaToPathList(model);

  return pathList.reduce((diagnostics: Diagnostic[], path: TypeStatsPath) => {
    const frequencies = computeDiagnosticFrequencies(path.stats);
    let issues = [
      diagnoseMissingType(path),
      diagnoseMultiType(path),
      diagnoseNumericalKeysOnObject(path)
    ].filter(v => !!v);

    if (issues.length) {
      return diagnostics.concat(issues.map((name) => ({
        path: path.path,
        type: path.type,
        name: name as string,
        frequencies
      })));
    }

    return diagnostics;
  }, []);
};

export default diagnoseTypeIssues;