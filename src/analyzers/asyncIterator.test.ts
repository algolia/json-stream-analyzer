import Analyzer, { AsyncIteratorAnalyzerOptions } from './asyncIterator';
import { SchemaType } from '../inference';

async function* generator(inputs: any[]): AsyncIterator<any> {
  let cursor = 0;

  while (cursor < inputs.length) {
    await Promise.resolve();
    yield inputs[cursor];
    cursor++;
  }

  return;
}

const initParams = (inputs: any[]): AsyncIteratorAnalyzerOptions => {
  return {
    generator: () => generator(inputs),
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
      },
      issues: [],
      model: new SchemaType({ counter: 0 }),
    };

    await analyzer.start();
    const actual = analyzer.diagnose();

    expect(actual.processed).toEqual(expected.processed);
    expect(actual.issues).toEqual(expected.issues);
  });
});
