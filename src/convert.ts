import { SchemaType, SchemaObject } from './interfaces';
import {
  ArrayType,
  BooleanType,
  MissingType,
  NullType,
  NumberType,
  ObjectType,
  StringType,
} from './types';

const convertToSchema = (content: any, tag?: any): SchemaType => {
  if (typeof content === 'number') {
    return new NumberType({ counter: 1, tag });
  }

  if (typeof content === 'boolean') {
    return new BooleanType({ counter: 1, tag });
  }

  if (typeof content === 'string') {
    return new StringType({ counter: 1, tag });
  }

  if (content === null) {
    return new NullType({ counter: 1, tag });
  }

  if (Array.isArray(content)) {
    let types: SchemaObject;

    if (!content.length) {
      types = { Missing: new MissingType({ counter: 1, tag }) };
    } else {
      types = content.reduce((partial, item) => {
        const schema = convertToSchema(item, tag);
        const update: SchemaObject = {};
        if (partial[schema.type]) {
          update[schema.type] = partial[schema.type].combine(schema, {
            counter: 1,
          });
        } else {
          update[schema.type] = schema;
        }

        return { ...partial, ...update };
      }, {});
    }
    return new ArrayType({ counter: 1, tag }, types);
  }

  const schema: SchemaObject = Object.entries(content).reduce(
    (schemas: SchemaObject, [key, subContent]) => {
      return { ...schemas, [key]: convertToSchema(subContent, tag) };
    },
    {}
  );
  return new ObjectType({ counter: 1, tag }, schema);
};

export default convertToSchema;
