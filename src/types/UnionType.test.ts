import { ArrayType } from './ArrayType';
import { BooleanType } from './BooleanType';
import { MissingType } from './MissingType';
import { NullType } from './NullType';
import { NumberType } from './NumberType';
import { ObjectType } from './ObjectType';
import { StringType } from './StringType';
import { UnionType } from './UnionType';

describe('UnionType simple test case', () => {
  describe('constructor', () => {
    it('has type Union', () => {
      const b1 = new UnionType();

      expect(b1.type).toBe('Union');
    });

    it('has counter set to 0', () => {
      const b1 = new UnionType();

      expect(b1.counter).toBe(0);
    });
  });

  describe('#combine', () => {
    it('combines with UnionType', () => {
      const b1 = new UnionType();
      const b2 = new UnionType();

      const combined = b1.combine(b2);

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(0);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new UnionType();
      const b2 = new UnionType();

      b1.combine(b2);

      expect(b1.type).toBe('Union');
      expect(b2.type).toBe('Union');
      expect(b1.counter).toBe(0);
      expect(b2.counter).toBe(0);
    });

    it('combine can be chained', () => {
      const combined = new UnionType()
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(0);
    });

    it('can combine with MissingType', () => {
      const combined: UnionType = new UnionType().combine(new MissingType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.Missing.counter).toBe(1);
    });

    it('can combine with StringType', () => {
      const combined: UnionType = new UnionType().combine(new StringType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.String.counter).toBe(1);
    });

    it('can combine with NullType', () => {
      const combined = new UnionType().combine(new NullType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.Null.counter).toBe(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new UnionType().combine(new ObjectType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.Object.counter).toBe(1);
    });

    it('can combine with NumberType', () => {
      const combined = new UnionType().combine(new NumberType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.Number.counter).toBe(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new UnionType().combine(new BooleanType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.Boolean.counter).toBe(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new UnionType().combine(new ArrayType());

      expect(combined.type).toBe('Union');
      expect(combined.counter).toBe(1);
      expect(combined.types.Array.counter).toBe(1);
    });
  });
});
