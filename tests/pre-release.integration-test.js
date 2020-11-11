/**
 * Assumes that the following command was run before
 * `yarn build && cd dist && yarn unlink && yarn link && cd .. && yarn link @algolia/json-stream-analyzer`
 */
describe('library structure', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('can require main library', () => {
    const library = require('@algolia/json-stream-analyzer');

    expect(library).toBeDefined();
    expect(library.models).toBeDefined();
    expect(library.types).toBeDefined();

    expect(library.default).toBeDefined();
  });

  it('can require inference sub-library', () => {
    const library = require('@algolia/json-stream-analyzer/types');

    expect(library).toBeDefined();
    expect(library.ArrayType).toBeDefined();
    expect(library.BooleanType).toBeDefined();
    expect(library.MissingType).toBeDefined();
    expect(library.NullType).toBeDefined();
    expect(library.NumberType).toBeDefined();
    expect(library.ObjectType).toBeDefined();
    expect(library.UnionType).toBeDefined();
    expect(library.UnknownType).toBeDefined();
  });

  it('can require diagnostic sub-library', () => {
    const library = require('@algolia/json-stream-analyzer/models');

    expect(library).toBeDefined();
    expect(library.ArrayTagModel).toBeDefined();
    expect(library.SimpleTagModel).toBeDefined();
  });
});

describe('library behaviour', () => {
  const library = require('@algolia/json-stream-analyzer');

  it('builds expected analysis', () => {
    const { ArrayTagModel } = library.models;
    const model = new ArrayTagModel({ tag: ({ id }) => `${id}`, size: 2 });

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

    inputs.forEach(input => model.addToModel(input));

    const expected = [
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['optArray'],
        affected: 1,
        tag: ['1'],
      },
      {
        id: 'healthy',
        title: 'Healthy Records',
        type: 'Union',
        path: ['optArray'],
        affected: 3,
        tag: ['2', '3'],
      },
      {
        id: 'emptyArray',
        title: 'Empty Array',
        type: 'Array',
        path: ['optArray', '(Array)'],
        affected: 1,
        tag: ['3'],
      },
      {
        id: 'healthy',
        title: 'Healthy Records',
        type: 'Array',
        path: ['optArray', '(Array)'],
        affected: 2,
        tag: ['2', '4'],
      },
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['optArray', '(Array)', '[Object]', 'description'],
        affected: 1,
        tag: ['4'],
      },
      {
        id: 'healthy',
        title: 'Healthy Records',
        type: 'Union',
        path: ['optArray', '(Array)', '[Object]', 'description'],
        affected: 1,
        tag: ['2'],
      },
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['optDesc'],
        affected: 3,
        tag: ['2', '3'],
      },
      {
        id: 'healthy',
        title: 'Healthy Records',
        type: 'Union',
        path: ['optDesc'],
        affected: 1,
        tag: ['1'],
      },
    ];

    const actual = model.diagnose();

    expect(actual).toEqual(expected);
  });

  it('builds the other expected analysis', () => {
    const records = [
      {
        objectID: '4228100',
        title: 'JBL - Flip 3 Portable Bluetooth Speaker - Black',
        img: 'https://cdn-demo.algolia.com/bestbuy-0118/4228100_sb.jpg',
        rating: 4,
        onsale: false,
      },
      {
        objectID: '6848136',
        title: 'Apple - EarPods™ with Remote and Mic - White',
        img: 'https://cdn-demo.algolia.com/bestbuy-0118/6848136_sb.jpg',
        rating: 4,
        onsale: false,
        category: 'headphones',
      },
    ];

    const { ArrayTagModel } = library.models;
    const model = new ArrayTagModel({
      tag: ({ objectID }) => objectID,
      size: 20,
    });

    records.forEach(record => model.addToModel(record));

    const expected = [
      {
        id: 'missing',
        title: 'Missing Data',
        type: 'Union',
        path: ['category'],
        affected: 1,
        tag: ['4228100'],
      },
      {
        id: 'healthy',
        title: 'Healthy Records',
        type: 'Union',
        path: ['category'],
        affected: 1,
        tag: ['6848136'],
      },
    ];

    const actual = model.diagnose();

    expect(actual).toEqual(expected);
  });
});
