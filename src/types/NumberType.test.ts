import { ArrayType } from './ArrayType';
import { BooleanType } from './BooleanType';
import { MissingType } from './MissingType';
import { NullType } from './NullType';
import { NumberType } from './NumberType';
import { ObjectType } from './ObjectType';
import { StringType } from './StringType';
import { UnionType } from './UnionType';

describe('NumberType simple test case', () => {
  describe('constructor', () => {
    it('has type Number', () => {
      const b1 = new NumberType();

      expect(b1.type).toEqual('Number');
    });

    it('has counter set to 1', () => {
      const b1 = new NumberType();

      expect(b1.counter).toEqual(1);
    });

    it('has a tag', () => {
      const b1 = new NumberType({ counter: 1, tag: 'someTag' });

      expect(b1.tag).toEqual('someTag');
    });
  });

  describe('#combine', () => {
    it('combines with NumberType', () => {
      const b1 = new NumberType();
      const b2 = new NumberType();

      const combined = b1.combine(b2);

      expect(combined.type).toEqual('Number');
      expect(combined.counter).toEqual(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new NumberType();
      const b2 = new NumberType();

      b1.combine(b2);

      expect(b1.type).toEqual('Number');
      expect(b2.type).toEqual('Number');
      expect(b1.counter).toEqual(1);
      expect(b2.counter).toEqual(1);
    });

    it('combine can be chained', () => {
      const combined = new NumberType()
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType())
        .combine(new NumberType());

      expect(combined.type).toEqual('Number');
      expect(combined.counter).toEqual(10);
    });

    it('can combine with MissingType', () => {
      const combined = new NumberType().combine(new MissingType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });

    it('can combine with NullType', () => {
      const combined = new NumberType().combine(new NullType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });

    it('can combine with StringType', () => {
      const combined = new NumberType().combine(new StringType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new NumberType().combine(new ObjectType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new NumberType().combine(new BooleanType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new NumberType().combine(new ArrayType()) as UnionType;

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  });
});
