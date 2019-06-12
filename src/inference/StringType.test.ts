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

describe('StringType simple test case', () => {
  describe('constructor', () => {
    it('has type String', () => {
      const b1 = new StringType();

      expect(b1.type).toEqual('String');
    });

    it('has counter set to 1', () => {
      const b1 = new StringType();

      expect(b1.counter).toEqual(1);
    });

    it('has a tag', () => {
      const b1 = new StringType({ counter: 1, tag: 'someTag' });

      expect(b1.tag).toEqual('someTag');
    });
  });

  describe('#combine', () => {
    it('combines with StringType', () => {
      const b1 = new StringType();
      const b2 = new StringType();

      const combined = b1.combine(b2);

      expect(combined.type).toEqual('String');
      expect(combined.counter).toEqual(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new StringType();
      const b2 = new StringType();

      b1.combine(b2);

      expect(b1.type).toEqual('String');
      expect(b2.type).toEqual('String');
      expect(b1.counter).toEqual(1);
      expect(b2.counter).toEqual(1);
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

      expect(combined.type).toEqual('String');
      expect(combined.counter).toEqual(10);
    });

    it('can combine with MissingType', () => {
      const combined: UnionType = new StringType().combine(new MissingType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.String.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });

    it('can combine with NullType', () => {
      const combined = new StringType().combine(new NullType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.String.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new StringType().combine(new ObjectType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.String.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });

    it('can combine with NumberType', () => {
      const combined = new StringType().combine(new NumberType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.String.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new StringType().combine(new BooleanType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.String.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });

    it('can combine with ArrayType', () => {
      const combined = new StringType().combine(new ArrayType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.String.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  });

  describe('#convert', () => {
    it('transforms String into StringType', () => {
      const converted = new StringType().convert('test');

      expect(converted.type).toEqual('String');
      expect(converted.counter).toEqual(1);
    });
  });
});
