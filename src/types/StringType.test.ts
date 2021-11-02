import { ArrayType } from './ArrayType';
import { BooleanType } from './BooleanType';
import { MissingType } from './MissingType';
import { NullType } from './NullType';
import { NumberType } from './NumberType';
import { ObjectType } from './ObjectType';
import { StringType } from './StringType';
import type { UnionType } from './UnionType';

describe('StringType simple test case', () => {
  describe('constructor', () => {
    it('has type String', () => {
      const b1 = new StringType();

      expect(b1.type).toBe('String');
    });

    it('has counter set to 1', () => {
      const b1 = new StringType();

      expect(b1.counter).toBe(1);
    });

    it('has a tag', () => {
      const b1 = new StringType({ counter: 1, tag: 'someTag' });

      expect(b1.tag).toBe('someTag');
    });
  });

  describe('#combine', () => {
    it('combines with StringType', () => {
      const b1 = new StringType();
      const b2 = new StringType();

      const combined = b1.combine(b2);

      expect(combined.type).toBe('String');
      expect(combined.counter).toBe(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new StringType();
      const b2 = new StringType();

      b1.combine(b2);

      expect(b1.type).toBe('String');
      expect(b2.type).toBe('String');
      expect(b1.counter).toBe(1);
      expect(b2.counter).toBe(1);
    });

    it('combine can be chained', () => {
      const combined = new StringType()
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType())
        .combine(new StringType());

      expect(combined.type).toBe('String');
      expect(combined.counter).toBe(10);
    });

    it('can combine with MissingType', () => {
      const combined = new StringType().combine(new MissingType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.String.counter).toBe(1);
      expect(combined.types.Missing.counter).toBe(1);
    });

    it('can combine with NullType', () => {
      const combined = new StringType().combine(new NullType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.String.counter).toBe(1);
      expect(combined.types.Null.counter).toBe(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new StringType().combine(new ObjectType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.String.counter).toBe(1);
      expect(combined.types.Object.counter).toBe(1);
    });

    it('can combine with NumberType', () => {
      const combined = new StringType().combine(new NumberType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.String.counter).toBe(1);
      expect(combined.types.Number.counter).toBe(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new StringType().combine(new BooleanType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.String.counter).toBe(1);
      expect(combined.types.Boolean.counter).toBe(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new StringType().combine(new ArrayType()) as UnionType;

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(2);
      expect(combined.types.String.counter).toBe(1);
      expect(combined.types.Array.counter).toBe(1);
    });
  });
});
