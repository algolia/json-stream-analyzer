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

    it('has a marker', () => {
      const b1 = new BooleanType(1, 'someMarker');
  
      expect(b1.marker).toEqual('someMarker');
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
      const combined = (new BooleanType())
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
  
    it('can combine with NullType', () => {
      const combined: UnionType = (new BooleanType()).combine(new NullType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });
  
    it('can combine with NumberType', () => {
      const combined = (new BooleanType()).combine(new NumberType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });
  
    it('can combine with StringType', () => {
      const combined = (new BooleanType()).combine(new StringType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });
  
    it('can combine with ObjectType', () => {
      const combined = (new BooleanType()).combine(new ObjectType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });
  
    it('can combine with ArrayType', () => {
      const combined = (new BooleanType()).combine(new ArrayType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  
    it('can combine with MissingType', () => {
      const combined = (new BooleanType()).combine(new MissingType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Boolean.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });
  });

  describe('#convert', () => {
    it('transforms Boolean into BooleanType', () => {
      const converted = (new BooleanType()).convert(true);

      expect(converted.type).toEqual('Boolean');
      expect(converted.counter).toEqual(1);
    });
  });
});