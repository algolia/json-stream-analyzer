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

describe('NullType simple test case', () => {
  describe('constructor', () => {
    it('has type Null', () => {
      const b1 = new NullType();

      expect(b1.type).toEqual('Null');
    });

    it('has counter set to 1', () => {
      const b1 = new NullType();

      expect(b1.counter).toEqual(1);
    });

    it('has a marker', () => {
      const b1 = new NullType({ counter: 1, marker: 'someMarker' });

      expect(b1.marker).toEqual('someMarker');
    });
  });

  describe('#combine', () => {
    it('combines with NullType', () => {
      const b1 = new NullType();
      const b2 = new NullType();

      const combined = b1.combine(b2);

      expect(combined.type).toEqual('Null');
      expect(combined.counter).toEqual(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new NullType();
      const b2 = new NullType();

      b1.combine(b2);

      expect(b1.type).toEqual('Null');
      expect(b2.type).toEqual('Null');
      expect(b1.counter).toEqual(1);
      expect(b2.counter).toEqual(1);
    });

    it('combine can be chained', () => {
      const combined = new NullType()
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType())
        .combine(new NullType());

      expect(combined.type).toEqual('Null');
      expect(combined.counter).toEqual(10);
    });

    it('can combine with MissingType', () => {
      const combined: UnionType = new NullType().combine(new MissingType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Null.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });

    it('can combine with NumberType', () => {
      const combined = new NullType().combine(new NumberType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Null.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });

    it('can combine with StringType', () => {
      const combined = new NullType().combine(new StringType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Null.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new NullType().combine(new ObjectType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Null.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new NullType().combine(new BooleanType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Null.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new NullType().combine(new ArrayType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Null.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  });

  describe('#convert', () => {
    it('transforms null into NullType', () => {
      const converted = new NullType().convert(null);

      expect(converted.type).toEqual('Null');
      expect(converted.counter).toEqual(1);
    });
  });
});
