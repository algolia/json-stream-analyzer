/**
 * Assumes that the following command was run before
 * `yarn build && cd dist && yarn unlink && yarn link && cd .. && yarn link json-stream-analyzer`
 */
describe('library structure', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('can require main library', () => {
    const library = require('json-stream-analyzer');

    expect(library).toBeDefined();
    expect(library.inference).toBeDefined();
    expect(library.diagnostics).toBeDefined();
    expect(library.aggregation).toBeDefined();
    expect(library.analyzers).toBeDefined();

    expect(library.default).toBeDefined();
  });

  it('can require inference sub-library', () => {
    const library = require('json-stream-analyzer/inference');

    expect(library).toBeDefined();
    expect(library.SchemaType).toBeDefined();
  });

  it('can require diagnostic sub-library', () => {
    const library = require('json-stream-analyzer/diagnostics');

    expect(library).toBeDefined();
    expect(library.diagnose).toBeDefined();
  });

  it('can require aggregation sub-library', () => {
    const library = require('json-stream-analyzer/aggregation');

    expect(library).toBeDefined();
    expect(library.aggregateByPath).toBeDefined();
  });

  it('can require analyzers sub-library', () => {
    const library = require('json-stream-analyzer/analyzers');

    expect(library).toBeDefined();
    expect(library.SyncAnalyzer).toBeDefined();
  });
});

describe('library behaviour', () => {
  let library = require('json-stream-analyzer');

  it('builds expected analysis', () => {
    const { SyncAnalyzer } = library.analyzers;
    const analyzer = new SyncAnalyzer({ tag: ({ id }) => `${id}` });

    const inputs = [
      { id: 1, optDesc: 'some optional description' },
      {
        id: 2,
        optArray: [
          {
            description:
              'an array that can be empty or missing, and so can this description',
            value: 12,
          },
        ],
      },
      { id: 3, optArray: [] },
      { id: 4, optArray: [{ value: 42 }] },
    ];

    analyzer.pushToModel(inputs);

    const expected = {
      processed: { count: 4 },
      issues: [
        {
          path: ['optDesc'],
          issues: [
            {
              id: 'missing',
              title: 'Missing Data',
              type: 'Union',
              path: ['optDesc'],
              affected: 3,
              marker: '2',
            },
          ],
          nbIssues: 1,
          totalAffected: 3,
          total: 4,
        },
        {
          path: ['optArray'],
          issues: [
            {
              id: 'missing',
              title: 'Missing Data',
              type: 'Union',
              path: ['optArray'],
              affected: 1,
              marker: '1',
            },
            {
              id: 'emptyArray',
              title: 'Empty Array',
              type: 'Array',
              path: ['optArray', '(Array)'],
              affected: 1,
              marker: '3',
            },
          ],
          nbIssues: 2,
          totalAffected: 2,
          total: 4,
        },
        {
          path: ['optArray', '[]', 'description'],
          issues: [
            {
              id: 'missing',
              title: 'Missing Data',
              type: 'Union',
              path: ['optArray', '(Array)', '[Object]', 'description'],
              affected: 1,
              marker: '4',
            },
          ],
          nbIssues: 1,
          totalAffected: 1,
          total: 2,
        },
      ],
    };

    const actual = analyzer.diagnose();

    expect(actual.processed).toEqual(expected.processed);
    expect(actual.issues).toEqual(expected.issues);
  });
});
