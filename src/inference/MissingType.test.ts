import {
  BooleanType,
  NullType,
  NumberType,
  StringType,
  ArrayType,
  ObjectType,
  UnionType,
  MissingType,
} from '.';

describe('MissingType simple test case', () => {
  describe('constructor', () => {
    it('has type Missing', () => {
      const b1 = new MissingType();

      expect(b1.type).toEqual('Missing');
    });

    it('has counter set to 1', () => {
      const b1 = new MissingType();

      expect(b1.counter).toEqual(1);
    });

    it('has a marker', () => {
      const b1 = new MissingType(1, 'someMarker');

      expect(b1.marker).toEqual('someMarker');
    });
  });

  describe('#combine', () => {
    it('combines with MissingType', () => {
      const b1 = new MissingType();
      const b2 = new MissingType();

      const combined = b1.combine(b2);

      expect(combined.type).toEqual('Missing');
      expect(combined.counter).toEqual(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new MissingType();
      const b2 = new MissingType();

      b1.combine(b2);

      expect(b1.type).toEqual('Missing');
      expect(b2.type).toEqual('Missing');
      expect(b1.counter).toEqual(1);
      expect(b2.counter).toEqual(1);
    });

    it('combine can be chained', () => {
      const combined = new MissingType()
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType())
        .combine(new MissingType());

      expect(combined.type).toEqual('Missing');
      expect(combined.counter).toEqual(10);
    });

    it('can combine with NullType', () => {
      const combined: UnionType = new MissingType().combine(new NullType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Missing.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });

    it('can combine with NumberType', () => {
      const combined = new MissingType().combine(new NumberType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Missing.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });

    it('can combine with StringType', () => {
      const combined = new MissingType().combine(new StringType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Missing.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new MissingType().combine(new ObjectType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Missing.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new MissingType().combine(new BooleanType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Missing.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new MissingType().combine(new ArrayType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Missing.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  });
});
