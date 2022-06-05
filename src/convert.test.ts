import convertToSchema from './convert';
import type { ObjectType } from './types';

describe('convertToSchema', () => {
  it('transforms Array into ArrayType', () => {
    const converted = convertToSchema([]);

    expect(converted.type).toBe('Array');
    expect(converted.counter).toBe(1);
  });

  it('transforms Boolean into BooleanType', () => {
    const converted = convertToSchema(true);

    expect(converted.type).toBe('Boolean');
    expect(converted.counter).toBe(1);
  });

  it('transforms null into NullType', () => {
    const converted = convertToSchema(null);

    expect(converted.type).toBe('Null');
    expect(converted.counter).toBe(1);
  });

  it('transforms Number into NumberType', () => {
    const converted = convertToSchema(234);

    expect(converted.type).toBe('Number');
    expect(converted.counter).toBe(1);
  });

  it('transforms String into StringType', () => {
    const converted = convertToSchema('test');

    expect(converted.type).toBe('String');
    expect(converted.counter).toBe(1);
  });

  it('transforms Object into ObjectType', () => {
    const converted = convertToSchema({});

    expect(converted.type).toBe('Object');
    expect(converted.counter).toBe(1);
  });
});

describe('statistics', () => {
  it('should collect statistics', () => {
    const options = { collectStatistics: { array: true, boolean: true } };
    const converted = convertToSchema(
      { bool: true, arr: ['foo', 'bar'] },
      undefined,
      options
    ) as ObjectType;

    expect(converted.type).toBe('Object');

    const simplifiedSchema = JSON.parse(JSON.stringify(converted.schema));
    expect(simplifiedSchema).toMatchInlineSnapshot(`
      Object {
        "arr": Object {
          "counter": 1,
          "stats": Object {
            "lengths": Object {
              "2": 1,
            },
          },
          "type": "Array",
          "types": Object {
            "String": Object {
              "counter": 1,
              "type": "String",
            },
          },
        },
        "bool": Object {
          "counter": 1,
          "stats": Object {
            "trueVal": 1,
          },
          "type": "Boolean",
        },
      }
    `);
  });
});
