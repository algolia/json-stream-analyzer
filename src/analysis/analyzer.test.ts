import Analyzer, { AnalyzerOptions } from '.';
import { SchemaType } from '../inference';
import { Diagnostic } from './models';

async function* generator(inputs: any[]): AsyncIterator<any> {
  let cursor = 0;

  while (cursor < inputs.length) {
    await Promise.resolve();
    yield inputs[cursor];
    cursor++;
  }

  return;
}

async function estimator(
  inputs: any[]
): Promise<{ size: number; exact: boolean }> {
  await Promise.resolve();
  return {
    size: inputs.length,
    exact: true,
  };
}

const initParams = (inputs: any[]): AnalyzerOptions => {
  return {
    generator: () => generator(inputs),
    estimator: () => estimator(inputs),
    tag: (value: any) => (typeof value === 'object' ? `${value.id}` : 'tag'),
  };
};

describe('Analyzer', () => {
  it('has start, pause, resume, and diagnose methods', () => {
    const params = initParams([]);
    const analyzer = new Analyzer(params);

    expect(analyzer.start).toBeDefined();
    expect(analyzer.pause).toBeDefined();
    expect(analyzer.resume).toBeDefined();
    expect(analyzer.diagnose).toBeDefined();
  });

  it('does nothing if no inputs', async () => {
    const params = initParams([]);
    const analyzer = new Analyzer(params);

    const expected = {
      processed: {
        count: 0,
        total: 0,
        exact: true,
      },
      issues: [],
      model: new SchemaType(0),
    };

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.processed).toEqual(expected.processed);
    expect(actual.issues).toEqual(expected.issues);
  });

  it('finds missing field issues', async () => {
    const params = initParams([
      { id: 12, opt: 13 },
      { id: 1 },
      { id: 16, opt: 42 },
    ]);

    const analyzer = new Analyzer(params);

    const expected = [
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['opt'],
        affected: 1,
        marker: '1',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds empty array issues', async () => {
    const params = initParams([
      { id: 12, opt: [123] },
      { id: 1, opt: [] },
      { id: 16, opt: [42] },
    ]);

    const analyzer = new Analyzer(params);

    const expected = [
      {
        id: 'emptyArray',
        title: 'Empty Array',
        type: 'Array',
        path: ['opt'],
        affected: 1,
        marker: '1',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds inconsistentType issues', async () => {
    const params = initParams([
      { id: 12, opt: 13 },
      { id: 1, opt: '42' },
      { id: 16, opt: 16 },
      { id: 42, opt: null },
    ]);

    const analyzer = new Analyzer(params);

    const expected: Diagnostic[] = [
      {
        id: 'inconsistentType',
        title: 'Inconsistent Type (String instead of Number)',
        type: 'Union',
        path: ['opt'],
        affected: 1,
        marker: '1',
      },
      {
        id: 'inconsistentType',
        title: 'Inconsistent Type (Null instead of Number)',
        type: 'Union',
        path: ['opt'],
        affected: 1,
        marker: '42',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds polymorphic array issues', async () => {
    const params = initParams([
      { id: 12, opt: [13] },
      { id: 1, opt: ['42'] },
      { id: 16, opt: [16, null] },
    ]);

    const analyzer = new Analyzer(params);

    const expected: Diagnostic[] = [
      {
        id: 'polymorphicArray',
        title: 'Array may contain multiple types',
        type: 'Array',
        path: ['opt'],
        affected: 3,
        marker: '12',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds all issues linked with path', async () => {
    const params = initParams([
      { id: 12, opt: 13 },
      { id: 1, opt: '42' },
      { id: 16 },
    ]);

    const analyzer = new Analyzer(params);

    const expected: Diagnostic[] = [
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['opt'],
        affected: 1,
        marker: '16',
      },
      {
        id: 'inconsistentType',
        title: 'Inconsistent Type (String instead of Number)',
        type: 'Union',
        path: ['opt'],
        affected: 1,
        marker: '1',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds issues in nested paths', async () => {
    const params = initParams([
      { id: 12, a: { b: 1234, opt: 13 } },
      { id: 1, a: { b: 124 } },
      { id: 16, a: { b: 14, opt: 132 } },
    ]);

    const analyzer = new Analyzer(params);

    const expected: Diagnostic[] = [
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['a', 'opt'],
        affected: 1,
        marker: '1',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('markers are stable', async () => {
    const params = initParams([
      { id: 12, opt: 13 },
      { id: 1 },
      { id: 16 },
      { id: 42, opt: 43 },
      { id: 22, opt: 103 },
      { id: 19 },
    ]);

    const analyzer = new Analyzer(params);

    const expected: Diagnostic[] = [
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['opt'],
        affected: 3,
        marker: '1',
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });
});
