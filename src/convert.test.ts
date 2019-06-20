import convertToSchema from './convert';

describe('convertToSchema', () => {
  it('transforms Array into ArrayType', () => {
    const converted = convertToSchema([]);

    expect(converted.type).toEqual('Array');
    expect(converted.counter).toEqual(1);
  });

  it('transforms Boolean into BooleanType', () => {
    const converted = convertToSchema(true);

    expect(converted.type).toEqual('Boolean');
    expect(converted.counter).toEqual(1);
  });

  it('transforms null into NullType', () => {
    const converted = convertToSchema(null);

    expect(converted.type).toEqual('Null');
    expect(converted.counter).toEqual(1);
  });

  it('transforms Number into NumberType', () => {
    const converted = convertToSchema(234);

    expect(converted.type).toEqual('Number');
    expect(converted.counter).toEqual(1);
  });

  it('transforms String into StringType', () => {
    const converted = convertToSchema('test');

    expect(converted.type).toEqual('String');
    expect(converted.counter).toEqual(1);
  });

  it('transforms Object into ObjectType', () => {
    const converted = convertToSchema({});

    expect(converted.type).toEqual('Object');
    expect(converted.counter).toEqual(1);
  });
});
