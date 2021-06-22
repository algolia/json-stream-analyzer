import type { SchemaType } from '../interfaces';

import { ArrayType } from './ArrayType';
import { BooleanType } from './BooleanType';
import { MissingType } from './MissingType';
import { NullType } from './NullType';
import { NumberType } from './NumberType';
import { ObjectType } from './ObjectType';
import { StringType } from './StringType';
import type { UnionType } from './UnionType';

describe('BooleanType simple test case', () => {
  describe('constructor', () => {
    it('has type Boolean', () => {
      const b1 = new BooleanType();

      expect(b1.type).toEqual('Boolean');
    });

    it('has counter set to 1', () => {
      const b1 = new BooleanType();

      expect(b1.counter).toEqual(1);
    });

    it('has a tag', () => {
      const b1 = new BooleanType({ counter: 1, tag: 'someTag' });

      expect(b1.tag).toEqual('someTag');
    });
  });

  describe('#combine', () => {
    it('combines with BooleanType', () => {
      const b1 = new BooleanType();
      const b2 = new BooleanType();

      const combined = b1.combine(b2);

      expect(combined.type).toEqual('Boolean');
      expect(combined.counter).toEqual(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new BooleanType();
      const b2 = new BooleanType();

      b1.combine(b2);

      expect(b1.type).toEqual('Boolean');
      expect(b2.type).toEqual('Boolean');
      expect(b1.counter).toEqual(1);
      expect(b2.counter).toEqual(1);
    });

    it('combine can be chained', () => {
      const combined = new BooleanType()
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType())
        .combine(new BooleanType());

      expect(combined.type).toEqual('Boolean');
      expect(combined.counter).toEqual(10);
    });

    it('combine uses combineTag correctly', () => {
      const booleans = new Array(10)
        .fill(0)
        .map((_, i) => new BooleanType({ tag: [i] }));

      // keeps the first 5 tags
      const combineTag = (first: number[], second: number[]): number[] => {
        if (first.length > 5) {
          return first;
        }

        return [...first, ...second].slice(0, 5);
      };

      const combined = booleans.reduce((acc: SchemaType, booleanType: any) => {
        if (!acc) {
          return booleanType;
        }
        return acc.combine(booleanType, { combineTag });
      });

      expect(combined.type).toEqual('Boolean');
      expect(combined.counter).toEqual(10);
      expect(combined.tag).toEqual([0, 1, 2, 3, 4]);
    });

    it('can combine with NullType', () => {
      const combined = new BooleanType().combine(new NullType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });

    it('can combine with NumberType', () => {
      const combined = new BooleanType().combine(new NumberType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });

    it('can combine with StringType', () => {
      const combined = new BooleanType().combine(new StringType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new BooleanType().combine(new ObjectType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new BooleanType().combine(new ArrayType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });

    it('can combine with MissingType', () => {
      const combined = new BooleanType().combine(
        new MissingType()
      ) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });
  });
});
