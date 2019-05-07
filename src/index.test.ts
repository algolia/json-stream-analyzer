import Analyzer, { AnalyzerOptions } from '.';
import { SchemaType } from './inference';

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
});
