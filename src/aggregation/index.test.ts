import convertToSchema, { SchemaType } from '../inference';
import { PathDiagnosticAggregate } from '../models';
import { aggregateByPath, convertPathToKey } from '.';
import diagnose from '../diagnostics';

const createModel = (inputs: any[]): SchemaType => {
  return inputs.reduce((model: SchemaType | null, input: any) => {
    const converted = convertToSchema(input, `${input.id}`);
    if (!model) {
      return converted;
    }

    return model.combine(converted);
  }, null);
};

describe('convertPathToKey', () => {
  it('should convert paths correctly', () => {
    const model = createModel([
      { toto: [{ a: [123] }] },
      { toto: { a: ['test'] } },
    ]);

    const actual = model.asList().map(({ path }) => {
      return convertPathToKey(path);
    });

    const expected = [
      '', // root
      'toto', // root.toto
      'toto', // root.toto.(Array)
      'toto.[]', // root.toto.(Array).[Object]
      'toto.[].a', // root.toto.(Array).[Object].a
      'toto', // root.toto.(Object)
      'toto.a', // root.toto.(Object).a
    ];

    expect(actual).toEqual(expected);
  });
});

describe('aggregateByPath', () => {
  it('aggregates all issues by path', () => {
    const model = createModel([
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
    ]);

    const issues = diagnose(model.asList());

    const expected: PathDiagnosticAggregate[] = [
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
    ];

    const actual = aggregateByPath(issues, model);

    expect(actual).toEqual(expected);
  });
});
