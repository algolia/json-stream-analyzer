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

describe('ArrayType simple test case', () => {
  describe('constructor', () => {
    it('has type Array', () => {
      const b1 = new ArrayType();

      expect(b1.type).toEqual('Array');
    });

    it('has counter set to 1', () => {
      const b1 = new ArrayType();

      expect(b1.counter).toEqual(1);
    });

    it('has a marker', () => {
      const b1 = new ArrayType(1, 'someMarker');

      expect(b1.marker).toEqual('someMarker');
    });
  });

  describe('#combine', () => {
    it('combines with ArrayType', () => {
      const b1 = new ArrayType();
      const b2 = new ArrayType();

      const combined = b1.combine(b2);

      expect(combined.type).toEqual('Array');
      expect(combined.counter).toEqual(2);
    });

    it('combine does not mutate inputs', () => {
      const b1 = new ArrayType();
      const b2 = new ArrayType();

      b1.combine(b2);

      expect(b1.type).toEqual('Array');
      expect(b2.type).toEqual('Array');
      expect(b1.counter).toEqual(1);
      expect(b2.counter).toEqual(1);
    });

    it('combine can be chained', () => {
      const combined = new ArrayType()
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType())
        .combine(new ArrayType());

      expect(combined.type).toEqual('Array');
      expect(combined.counter).toEqual(10);
    });

    it('can combine with NullType', () => {
      const combined: UnionType = new ArrayType().combine(new NullType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Array.counter).toEqual(1);
      expect(combined.types.Null.counter).toEqual(1);
    });

    it('can combine with NumberType', () => {
      const combined = new ArrayType().combine(new NumberType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Array.counter).toEqual(1);
      expect(combined.types.Number.counter).toEqual(1);
    });

    it('can combine with StringType', () => {
      const combined = new ArrayType().combine(new StringType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Array.counter).toEqual(1);
      expect(combined.types.String.counter).toEqual(1);
    });

    it('can combine with ObjectType', () => {
      const combined = new ArrayType().combine(new ObjectType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Array.counter).toEqual(1);
      expect(combined.types.Object.counter).toEqual(1);
    });

    it('can combine with BooleanType', () => {
      const combined = new ArrayType().combine(new BooleanType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Array.counter).toEqual(1);
      expect(combined.types.Boolean.counter).toEqual(1);
    });

    it('can combine with MissingType', () => {
      const combined = new ArrayType().combine(new MissingType());

      expect(combined.type).toEqual('Union');
      expect(combined.counter).toEqual(2);
      expect(combined.types.Array.counter).toEqual(1);
      expect(combined.types.Missing.counter).toEqual(1);
    });
  });

  describe('#convert', () => {
    it('transforms Array into ArrayType', () => {
      const converted = new ArrayType().convert([]);

      expect(converted.type).toEqual('Array');
      expect(converted.counter).toEqual(1);
    });
  });
});

describe('Array type SAT test case', () => {
  it('defines correct schema for string arrays', () => {
    const converted = new ArrayType().convert([
      'someText',
      'someText',
    ]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.String).toBeDefined();
    expect(converted.types.String.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('defines correct schema for boolean arrays', () => {
    const converted = new ArrayType().convert([true, true]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.Boolean).toBeDefined();
    expect(converted.types.Boolean.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('defines correct schema for null arrays', () => {
    const converted = new ArrayType().convert([null, null, null]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.Null).toBeDefined();
    expect(converted.types.Null.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('defines correct schema for number arrays', () => {
    const converted = new ArrayType().convert([123, 42, 6]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.Number).toBeDefined();
    expect(converted.types.Number.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('defines correct schema for array arrays', () => {
    const converted = new ArrayType().convert([[234], [24], [23]]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.Array).toBeDefined();
    expect(converted.types.Array.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('defines correct schema for object arrays', () => {
    const converted = new ArrayType().convert([
      { count: 123 },
      { count: 42 },
      { count: 234 },
    ]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.Object).toBeDefined();
    expect(converted.types.Object.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('defines correct schema for multi-type arrays', () => {
    const converted = new ArrayType().convert([
      'someText',
      123,
      null,
    ]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.String).toBeDefined();
    expect(converted.types.String.counter).toEqual(1);
    expect(converted.types.Number).toBeDefined();
    expect(converted.types.Number.counter).toEqual(1);
    expect(converted.types.Null).toBeDefined();
    expect(converted.types.Null.counter).toEqual(1);
    expect(converted.counter).toEqual(1);
  });

  it('merges child object schemas into one', () => {
    const converted = new ArrayType().convert([
      { count: 123 },
      { count: 42, opt: true },
      { count: 234 },
    ]) as ArrayType;

    expect(converted.type).toEqual('Array');
    expect(converted.types.Object).toBeDefined();
    expect(converted.types.Object.type).toEqual('Object');
    expect(converted.types.Object.counter).toEqual(1);

    const sub = converted.types.Object as ObjectType;
    expect(sub.schema.count.type).toEqual('Number');
    expect(sub.schema.count.counter).toEqual(1);
    expect(sub.schema.opt.type).toEqual('Union');

    const opt = sub.schema.opt as UnionType;
    expect(opt.types.Missing).toBeDefined();
    expect(opt.types.Missing.counter).toEqual(1);
    expect(opt.types.Boolean).toBeDefined();
    expect(opt.types.Boolean.counter).toEqual(1);

    expect(converted.counter).toEqual(1);
  });
});
