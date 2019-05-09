import { Diagnostic, PathStatistics } from '../models';

/**
 * Finds Union Types that have a missing Type
 * @param {PathStatistics} pathStats - the path statistics to inspect for issues
 * @returns {Diagnostic[]} the list of missing data issues found
 */
export const diagnoseUnionWithMissing = ({
  type,
  path,
  stats,
}: PathStatistics): Diagnostic[] => {
  if (type === 'Union' && stats.Missing) {
    return [
      {
        id: 'missing',
        title: 'Missing Data',
        type,
        path,
        affected: stats.Missing.counter,
        marker: stats.Missing.marker,
      },
    ];
  }

  return [];
};

/**
 * Finds Array Types that have a missing Type
 * @param {PathStatistics} pathStats - the path statistics to inspect for issues
 * @returns {Diagnostic[]} the list of empty array issues found
 */
export const diagnoseArrayWithMissing = ({
  type,
  path,
  stats,
}: PathStatistics): Diagnostic[] => {
  if (type === 'Array' && stats.Missing) {
    return [
      {
        id: 'emptyArray',
        title: 'Empty Array',
        type,
        path,
        affected: stats.Missing.counter,
        marker: stats.Missing.marker,
      },
    ];
  }

  return [];
};

const isMultiType = (types: string[]): boolean => {
  if (types.length === 2 && types.indexOf('Missing') === -1) return true;
  return types.length > 2;
};

/**
 * finds Union Types that have multiple non-missing types
 * @param {PathStatistics} pathStats - the path statistics to inspect for issues
 * @returns {Diagnostic[]} the list of inconsistent type issues found
 */
export const diagnoseInconsistentUnionType = ({
  type,
  path,
  stats,
}: PathStatistics): Diagnostic[] => {
  if (type !== 'Union') {
    // Arrays with multiple types should be handled differently
    return [];
  }

  if (isMultiType(Object.keys(stats))) {
    const modeType = Object.entries(stats).reduce(
      (bestType: string | null, [key, { counter }]) => {
        if (key === 'Missing') {
          return bestType;
        }

        if (!bestType) {
          return key;
        }

        if (stats[bestType].counter < counter) {
          return key;
        }

        return bestType;
      },
      null
    );

    const diagnostics: Diagnostic[] = Object.entries(stats)
      .filter(([key]) => key !== modeType && key !== 'Missing')
      .map(([key, value]) => {
        return {
          id: 'inconsistentType',
          title: `Inconsistent Type (${key} instead of ${modeType})`,
          type,
          path,
          affected: value.counter,
          marker: value.marker,
        };
      });

    return diagnostics;
  }

  return [];
};

/**
 * finds Array Types that have multiple non-missing types
 * @param {PathStatistics} pathStats - the path statistics to inspect for issues
 * @returns {Diagnostic[]} the list of polymorphic array issues found
 */
export const diagnoseInconsistentArrayType = ({
  type,
  path,
  stats,
  total,
}: PathStatistics): Diagnostic[] => {
  if (type !== 'Array') {
    // Arrays with multiple types should be handled differently
    return [];
  }

  if (isMultiType(Object.keys(stats))) {
    const possibleMarker = Object.entries(stats).filter(
      ([key]) => key !== 'Missing'
    )[0][1].marker;

    const diagnostic: Diagnostic = {
      id: 'polymorphicArray',
      title: `Array may contain multiple types`,
      type,
      path,
      affected: total,
      marker: possibleMarker,
    };

    return [diagnostic];
  }

  return [];
};

/**
 * Finds Object types with numbers as keys
 * @param {PathStatistics} pathStats - the path statistics to inspect for issues
 * @returns {Diagnostic[]} the list of numerical keys on Object issues found
 */
export const diagnoseNumericalKeysOnObject = ({
  path,
  stats,
  type,
}: PathStatistics): Diagnostic[] => {
  if (type !== 'Object') {
    return [];
  }

  const numericalKeys = Object.entries(stats)
    .filter(([key]) => !Number.isNaN(parseFloat(key)))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([_, value]) => value);

  if (!numericalKeys.length) {
    return [];
  }

  const largestNumericalKey = numericalKeys.sort(
    ({ counter: a }, { counter: b }) => b - a
  )[0];

  const diagnostic: Diagnostic = {
    id: 'numericalKeyOnObject',
    title: `Object with numbers as keys`,
    type,
    path,
    // we can't know for sure how many records are affected, but there's at least that amount that is affected
    affected: largestNumericalKey.counter,
    marker: largestNumericalKey.marker,
  };

  return [diagnostic];
};

export const diagnose = (pathList: PathStatistics[]): Diagnostic[] => {
  return (
    pathList
      .map(pathStats => [
        ...diagnoseUnionWithMissing(pathStats),
        ...diagnoseArrayWithMissing(pathStats),
        ...diagnoseInconsistentUnionType(pathStats),
        ...diagnoseInconsistentArrayType(pathStats),
        ...diagnoseNumericalKeysOnObject(pathStats),
      ])
      // flattens the list of lists into a list
      .reduce((f, l) => [...f, ...l], [])
  );
};

export default diagnose;
