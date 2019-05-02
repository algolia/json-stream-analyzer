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

describe('UnionType simple test case', () => {
  describe('constructor', () => {
    it('has type Union', () => {
      const b1 = new UnionType();
  
      expect(b1.type).toEqual('Union');
    });
  
    it('has counter set to 0', () => {
      const b1 = new UnionType();
  
      expect(b1.counter).toEqual(0);
    });
  });

  describe('#combine', () => {
    it('combines with UnionType', () => {
      const b1 = new UnionType();
      const b2 = new UnionType();
  
      const combined = b1.combine(b2);
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(0);
    });
  
    it('combine does not mutate inputs', () => {
      const b1 = new UnionType();
      const b2 = new UnionType();
  
      b1.combine(b2);
  
      expect(b1.type).toEqual('Union');
      expect(b2.type).toEqual('Union');
      expect(b1.counter).toEqual(0);
      expect(b2.counter).toEqual(0);
    });
  
    it('combine can be chained', () => {
      const combined = (new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType())
        .combine(new UnionType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(0);
    });
  
    it('can combine with MissingType', () => {
      const combined: UnionType = (new UnionType()).combine(new MissingType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });
  
    it('can combine with StringType', () => {
      const combined: UnionType = (new UnionType()).combine(new StringType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });
  
    it('can combine with NullType', () => {
      const combined = (new UnionType()).combine(new NullType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });
  
    it('can combine with ObjectType', () => {
      const combined = (new UnionType()).combine(new ObjectType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });
  
    it('can combine with NumberType', () => {
      const combined = (new UnionType()).combine(new NumberType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });
  
    it('can combine with BooleanType', () => {
      const combined = (new UnionType()).combine(new BooleanType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });
  
    it('can combine with ArrayType', () => {
      const combined = (new UnionType()).combine(new ArrayType());
  
      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(1);
      expect(combined.types.Array.counter).toEqual(1);
    });
  });
});