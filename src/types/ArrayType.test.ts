import convertToSchema from '../convert';
import type { Diagnostic } from '../interfaces';

import { ArrayType } from './ArrayType';
import { BooleanType } from './BooleanType';
import { MissingType } from './MissingType';
import { NullType } from './NullType';
import { NumberType } from './NumberType';
import { ObjectType } from './ObjectType';
import { StringType } from './StringType';
import type { UnionType } from './UnionType';

describe('ArrayType simple test case', () => {
  describe('constructor', () => {
    it('has type Array', () => {
      const b1 = new ArrayType();

      expect(b1.type).toBe('Array');
    });

    it('has counter set to 1', () => {
      const b1 = new ArrayType();

      expect(b1.counter).toBe(1);
    });

    it('has a tag', () => {
      const b1 = new ArrayType({ counter: 1, tag: 'someTag' });

      expect(b1.tag).toBe('someTag');
    });
  });

  describe('#combine', () => {
    it('combines with ArrayType', () => {
      const b1 = new ArrayType();
      const b2 = new ArrayType();

      const combined = b1.combine(b2);

      expect(combined.type).toBe('Array');
      expect(combined.counter).toBe(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new ArrayType();
      const b2 = new ArrayType();

      b1.combine(b2);

      expect(b1.type).toBe('Array');
      expect(b2.type).toBe('Array');
      expect(b1.counter).toBe(1);
      expect(b2.counter).toBe(1);
    });

    it('combine can be chained', () => {
      const combined = new ArrayType()
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType());

      expect(combined.type).toBe('Array');
      expect(combined.counter).toBe(10);
    });

    it('can combine with NullType', () => {
      const combined: any = new ArrayType().combine(new NullType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Array.counter).toBe(1);
      expect(combined.types.Null.counter).toBe(1);
    });

    it('can combine with NumberType', () => {
      const combined = new ArrayType().combine(new NumberType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Array.counter).toBe(1);
      expect(combined.types.Number.counter).toBe(1);
    });

    it('can combine with StringType', () => {
      const combined = new ArrayType().combine(new StringType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Array.counter).toBe(1);
      expect(combined.types.String.counter).toBe(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new ArrayType().combine(new ObjectType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Array.counter).toBe(1);
      expect(combined.types.Object.counter).toBe(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new ArrayType().combine(new BooleanType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Array.counter).toBe(1);
      expect(combined.types.Boolean.counter).toBe(1);
    });

    it('can combine with MissingType', () => {
      const combined = new ArrayType().combine(new MissingType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.Array.counter).toBe(1);
      expect(combined.types.Missing.counter).toBe(1);
    });
  });
});

describe('Simple Array Type test case', () => {
  it('defines correct schema for string arrays', () => {
    const converted = convertToSchema(['someText', 'someText']) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.String).toBeDefined();
    expect(converted.types.String.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('defines correct schema for boolean arrays', () => {
    const converted = convertToSchema([true, true]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.Boolean).toBeDefined();
    expect(converted.types.Boolean.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('defines correct schema for null arrays', () => {
    const converted = convertToSchema([null, null, null]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.Null).toBeDefined();
    expect(converted.types.Null.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('defines correct schema for number arrays', () => {
    const converted = convertToSchema([123, 42, 6]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.Number).toBeDefined();
    expect(converted.types.Number.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('defines correct schema for array arrays', () => {
    const converted = convertToSchema([[234], [24], [23]]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.Array).toBeDefined();
    expect(converted.types.Array.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('defines correct schema for object arrays', () => {
    const converted = convertToSchema([
      { count: 123 },
      { count: 42 },
      { count: 234 },
    ]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.Object).toBeDefined();
    expect(converted.types.Object.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('defines correct schema for multi-type arrays', () => {
    const converted = convertToSchema(['someText', 123, null]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.String).toBeDefined();
    expect(converted.types.String.counter).toBe(1);
    expect(converted.types.Number).toBeDefined();
    expect(converted.types.Number.counter).toBe(1);
    expect(converted.types.Null).toBeDefined();
    expect(converted.types.Null.counter).toBe(1);
    expect(converted.counter).toBe(1);
  });

  it('merges child object schemas into one', () => {
    const converted = convertToSchema([
      { count: 123 },
      { count: 42, opt: true },
      { count: 234 },
    ]) as ArrayType;

    expect(converted.type).toBe('Array');
    expect(converted.types.Object).toBeDefined();
    expect(converted.types.Object.type).toBe('Object');
    expect(converted.types.Object.counter).toBe(1);

    const sub = converted.types.Object as ObjectType;
    expect(sub.schema.count.type).toBe('Number');
    expect(sub.schema.count.counter).toBe(1);
    expect(sub.schema.opt.type).toBe('Union');

    const opt = sub.schema.opt as UnionType;
    expect(opt.types.Missing).toBeDefined();
    expect(opt.types.Missing.counter).toBe(1);
    expect(opt.types.Boolean).toBeDefined();
    expect(opt.types.Boolean.counter).toBe(1);

    expect(converted.counter).toBe(1);
  });

  it('diagnoses empty array schema even when only provided with empty arrays', () => {
    const firstModel = convertToSchema([]) as ArrayType;
    const secondModel = convertToSchema([]) as ArrayType;
    const combined = firstModel.combine(secondModel);

    expect(combined.type).toBe('Array');
    expect(combined.types.Missing).toBeDefined();
    expect(combined.types.Missing.counter).toBe(2);
    expect(combined.counter).toBe(2);

    const diagnostics = combined.diagnose();

    const expectedDiags: Diagnostic[] = [
      {
        id: 'emptyArray',
        title: 'Empty Array',
        type: 'Array',
        path: [],
        affected: 2,
      },
    ];

    expect(diagnostics).toEqual(expectedDiags);
  });
});
