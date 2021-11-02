import convertToSchema from '../convert';

import { ArrayType } from './ArrayType';
import { BooleanType } from './BooleanType';
import { MissingType } from './MissingType';
import { NullType } from './NullType';
import { NumberType } from './NumberType';
import { ObjectType } from './ObjectType';
import { StringType } from './StringType';
import type { UnionType } from './UnionType';

describe('ObjectType simple test case', () => {
  describe('constructor', () => {
    it('has type Object', () => {
      const b1 = new ObjectType();

      expect(b1.type).toBe('Object');
    });

    it('has counter set to 1', () => {
      const b1 = new ObjectType();

      expect(b1.counter).toBe(1);
    });

    it('has a tag', () => {
      const b1 = new ObjectType({ counter: 1, tag: 'someTag' });

      expect(b1.tag).toBe('someTag');
    });
  });

  describe('#combine', () => {
    it('combines with ObjectType', () => {
      const b1 = new ObjectType();
      const b2 = new ObjectType();

      const combined = b1.combine(b2);

      expect(combined.type).toBe('Object');
      expect(combined.counter).toBe(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new ObjectType();
      const b2 = new ObjectType();

      b1.combine(b2);

      expect(b1.type).toBe('Object');
      expect(b2.type).toBe('Object');
      expect(b1.counter).toBe(1);
      expect(b2.counter).toBe(1);
    });

    it('combine can be chained', () => {
      const combined = new ObjectType()
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType())
        .combine(new ObjectType());

      expect(combined.type).toBe('Object');
      expect(combined.counter).toBe(10);
    });

    it('can combine with MissingType', () => {
      const combined = new ObjectType().combine(new MissingType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Object.counter).toBe(1);
      expect(combined.types.Missing.counter).toBe(1);
    });

    it('can combine with NullType', () => {
      const combined = new ObjectType().combine(new NullType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Object.counter).toBe(1);
      expect(combined.types.Null.counter).toBe(1);
    });

    it('can combine with StringType', () => {
      const combined = new ObjectType().combine(new StringType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Object.counter).toBe(1);
      expect(combined.types.String.counter).toBe(1);
    });

    it('can combine with NumberType', () => {
      const combined = new ObjectType().combine(new NumberType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Object.counter).toBe(1);
      expect(combined.types.Number.counter).toBe(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new ObjectType().combine(new BooleanType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Object.counter).toBe(1);
      expect(combined.types.Boolean.counter).toBe(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new ObjectType().combine(new ArrayType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Object.counter).toBe(1);
      expect(combined.types.Array.counter).toBe(1);
    });
  });
});

describe('ObjectType schema test case', () => {
  it('has a schema field', () => {
    const type = new ObjectType();

    expect(type.schema).toBeDefined();
  });

  describe('#convert', () => {
    it('transform complex Object into ObjectType with correct schema', () => {
      const record = {
        someNums: [1, 2, 3],
        isSimple: false,
        nested: {
          nullable: null,
          pattern: 'somePattern',
        },
      };

      const converted = convertToSchema(record) as ObjectType;

      const expectedSchema = {
        someNums: {
          type: 'Array',
          counter: 1,
          types: {
            Number: {
              type: 'Number',
              counter: 1,
            },
          },
        },
        isSimple: {
          type: 'Boolean',
          counter: 1,
        },
        nested: {
          type: 'Object',
          counter: 1,
          schema: {
            nullable: {
              type: 'Null',
              counter: 1,
            },
            pattern: {
              type: 'String',
              counter: 1,
            },
          },
        },
      };

      const simplifiedSchema = JSON.parse(JSON.stringify(converted.schema));

      expect(simplifiedSchema).toEqual(expectedSchema);
    });
  });

  describe('#combine', () => {
    it('combines complex Objects into ObjectType with correct schema', () => {
      const firstRecord = {
        someNums: [1, 2, 3],
        isSimple: false,
        nested: {
          nullable: null,
          pattern: 'somePattern',
        },
      };

      const secondRecord = {
        someNums: [42],
        nested: {
          nullable: null,
          pattern: 'https://localhost:8000/some-test-url',
        },
        extra: {
          tests: [true, true, true],
        },
      };

      const converted = convertToSchema(firstRecord, 'm1').combine(
        convertToSchema(secondRecord, 'm2')
      ) as ObjectType;

      const expectedSchema = {
        someNums: {
          type: 'Array',
          counter: 2,
          tag: 'm1',
          types: {
            Number: {
              type: 'Number',
              counter: 2,
              tag: 'm1',
            },
          },
        },
        isSimple: {
          type: 'Union',
          counter: 2,
          types: {
            Missing: {
              type: 'Missing',
              counter: 1,
              tag: 'm2',
            },
            Boolean: {
              type: 'Boolean',
              counter: 1,
              tag: 'm1',
            },
          },
        },
        nested: {
          type: 'Object',
          counter: 2,
          tag: 'm1',
          schema: {
            nullable: {
              type: 'Null',
              counter: 2,
              tag: 'm1',
            },
            pattern: {
              type: 'String',
              counter: 2,
              tag: 'm1',
            },
          },
        },
        extra: {
          type: 'Union',
          counter: 2,
          types: {
            Missing: {
              type: 'Missing',
              counter: 1,
              tag: 'm1',
            },
            Object: {
              type: 'Object',
              counter: 1,
              tag: 'm2',
              schema: {
                tests: {
                  type: 'Array',
                  counter: 1,
                  tag: 'm2',
                  types: {
                    Boolean: {
                      type: 'Boolean',
                      counter: 1,
                      tag: 'm2',
                    },
                  },
                },
              },
            },
          },
        },
      };

      const simplifiedSchema = JSON.parse(JSON.stringify(converted.schema));
      expect(simplifiedSchema).toEqual(expectedSchema);
    });

    it('combines complex Objects and Array into UnionType with correct schema', () => {
      const firstRecord = {
        nested: {
          nullable: null,
          pattern: 'somePattern',
        },
      };

      const secondRecord = {
        nested: [
          { nullable: null, pattern: 'somePattern' },
          { nullable: null, pattern: 'someOtherPattern' },
          { nullable: null, pattern: 'someStrangePattern' },
        ],
      };

      const converted = convertToSchema(firstRecord).combine(
        convertToSchema(secondRecord)
      );
      const reverseConverted = convertToSchema(secondRecord).combine(
        convertToSchema(firstRecord)
      );

      const expectedSchema = {
        type: 'Object',
        counter: 2,
        schema: {
          nested: {
            type: 'Union',
            counter: 2,
            types: {
              Array: {
                type: 'Array',
                counter: 1,
                types: {
                  Object: {
                    type: 'Object',
                    counter: 1,
                    schema: {
                      nullable: {
                        type: 'Null',
                        counter: 1,
                      },
                      pattern: {
                        type: 'String',
                        counter: 1,
                      },
                    },
                  },
                },
              },
              Object: {
                type: 'Object',
                counter: 1,
                schema: {
                  nullable: {
                    type: 'Null',
                    counter: 1,
                  },
                  pattern: {
                    type: 'String',
                    counter: 1,
                  },
                },
              },
            },
          },
        },
      };

      const simplifiedSchema = JSON.parse(JSON.stringify(converted));
      expect(simplifiedSchema).toEqual(expectedSchema);

      const simplifiedReverseSchema = JSON.parse(
        JSON.stringify(reverseConverted)
      );
      expect(simplifiedReverseSchema).toEqual(expectedSchema);
    });
  });
});
