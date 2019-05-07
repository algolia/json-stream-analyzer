import diagnose from '.';
import convertToSchema, { SchemaType } from '../inference';
import { Diagnostic } from '../models';

const createModel = (inputs: any[]): SchemaType => {
  return inputs.reduce((model: SchemaType | null, input: any) => {
    const converted = convertToSchema(input, `${input.id}`);
    if (!model) {
      return converted;
    }

    return model.combine(converted);
  }, null);
};

describe('diagnose', () => {
  it('does nothing if no inputs', () => {
    const expected: Diagnostic[] = [];

    const actual = diagnose([]);

    expect(actual).toEqual(expected);
  });

  it('finds missing field issues', () => {
    const model = createModel([
      { id: 12, opt: 13 },
      { id: 1 },
      { id: 16, opt: 42 },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });

  it('finds empty array issues', () => {
    const model = createModel([
      { id: 12, opt: [123] },
      { id: 1, opt: [] },
      { id: 16, opt: [42] },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });

  it('finds inconsistentType issues', () => {
    const model = createModel([
      { id: 12, opt: 13 },
      { id: 1, opt: '42' },
      { id: 16, opt: 16 },
      { id: 42, opt: null },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });

  it('finds polymorphic array issues', () => {
    const model = createModel([
      { id: 12, opt: [13] },
      { id: 1, opt: ['42'] },
      { id: 16, opt: [16, null] },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });

  it('finds all issues linked with path', () => {
    const model = createModel([
      { id: 12, opt: 13 },
      { id: 1, opt: '42' },
      { id: 16 },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });

  it('finds issues in nested paths', () => {
    const model = createModel([
      { id: 12, a: { b: 1234, opt: 13 } },
      { id: 1, a: { b: 124 } },
      { id: 16, a: { b: 14, opt: 132 } },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });

  it('markers are stable', () => {
    const model = createModel([
      { id: 12, opt: 13 },
      { id: 1 },
      { id: 16 },
      { id: 42, opt: 43 },
      { id: 22, opt: 103 },
      { id: 19 },
    ]);

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

    const actual = diagnose(model.asList());

    expect(actual).toEqual(expected);
  });
});
