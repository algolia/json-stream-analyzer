import type { SchemaType, SchemaObject, ModelOptions } from './interfaces';
import {
  ArrayType,
  BooleanType,
  MissingType,
  NullType,
  NumberType,
  ObjectType,
  StringType,
} from './types';

const convertToSchema = (
  content: any,
  tag?: any,
  options?: ModelOptions
): SchemaType => {
  if (typeof content === 'number') {
    return new NumberType({ counter: 1, tag });
  }

  if (typeof content === 'boolean') {
    return new BooleanType({
      counter: 1,
      tag,
      stats: options?.collectStatistics?.boolean
        ? { trueVal: content === true ? 1 : 0 }
        : undefined,
    });
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
        const schema = convertToSchema(item, tag, options);
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
    return new ArrayType(
      {
        counter: 1,
        tag,
        stats: options?.collectStatistics?.array
          ? { lengths: { [content.length]: 1 } }
          : undefined,
      },
      types
    );
  }

  const schema: SchemaObject = Object.entries(content).reduce(
    (schemas: SchemaObject, [key, subContent]) => {
      return { ...schemas, [key]: convertToSchema(subContent, tag, options) };
    },
    {}
  );
  return new ObjectType({ counter: 1, tag }, schema);
};

export default convertToSchema;
