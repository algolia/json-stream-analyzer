import {
  BooleanType,
  NullType,
  NumberType,
  StringType,
  ArrayType,
  ObjectType,
  UnionType,
  MissingType
} from '../inferer';

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

    it('has a marker', () => {
      const b1 = new NumberType(1, 'someMarker');
  
      expect(b1.marker).toEqual('someMarker');
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
      const combined = (new NumberType())
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
      const combined: UnionType = (new NumberType()).combine(new MissingType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });
  
    it('can combine with NullType', () => {
      const combined = (new NumberType()).combine(new NullType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });
  
    it('can combine with StringType', () => {
      const combined = (new NumberType()).combine(new StringType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });
  
    it('can combine with ObjectType', () => {
      const combined = (new NumberType()).combine(new ObjectType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });
  
    it('can combine with BooleanType', () => {
      const combined = (new NumberType()).combine(new BooleanType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });
  
    it('can combine with ArrayType', () => {
      const combined = (new NumberType()).combine(new ArrayType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Number.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  });

  describe('#convert', () => {
    it('transforms Number into NumberType', () => {
      const converted = (new NumberType()).convert(234);

      expect(converted.type).toEqual('Number');
      expect(converted.counter).toEqual(1);
    });
  });
});