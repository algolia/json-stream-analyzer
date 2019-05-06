import Analyzer, { AnalyzerOptions } from '../analyzer';
import { SchemaType } from '../inferer';

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
        name: 'missing',
        path: ['opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 2, ratio: 2 / 3 },
          { cause: 'Missing', marker: '1', count: 1, ratio: 1 / 3 },
        ],
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds extra field issues', async () => {
    const params = initParams([{ id: 12, opt: 13 }, { id: 1 }, { id: 16 }]);

    const analyzer = new Analyzer(params);

    const expected = [
      {
        name: 'extra',
        path: ['opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 1, ratio: 1 / 3 },
          { cause: 'Missing', marker: '1', count: 2, ratio: 2 / 3 },
        ],
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });

  it('finds extra multi-type issues', async () => {
    const params = initParams([
      { id: 12, opt: 13 },
      { id: 1, opt: '42' },
      { id: 16, opt: 16 },
    ]);

    const analyzer = new Analyzer(params);

    const expected = [
      {
        name: 'multi',
        path: ['opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 2, ratio: 2 / 3 },
          { cause: 'String', marker: '1', count: 1, ratio: 1 / 3 },
        ],
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

    const expected = [
      {
        name: 'missing',
        path: ['opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 1, ratio: 1 / 3 },
          { cause: 'String', marker: '1', count: 1, ratio: 1 / 3 },
          { cause: 'Missing', marker: '16', count: 1, ratio: 1 / 3 },
        ],
      },
      {
        name: 'multi',
        path: ['opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 1, ratio: 1 / 3 },
          { cause: 'String', marker: '1', count: 1, ratio: 1 / 3 },
          { cause: 'Missing', marker: '16', count: 1, ratio: 1 / 3 },
        ],
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

    const expected = [
      {
        name: 'missing',
        path: ['a', 'opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 2, ratio: 2 / 3 },
          { cause: 'Missing', marker: '1', count: 1, ratio: 1 / 3 },
        ],
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

    const expected = [
      {
        name: 'extra',
        path: ['opt'],
        type: 'Union',
        frequencies: [
          { cause: 'Number', marker: '12', count: 3, ratio: 1 / 2 },
          { cause: 'Missing', marker: '1', count: 3, ratio: 1 / 2 },
        ],
      },
    ];

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.issues).toEqual(expected);
  });
});
