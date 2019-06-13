/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
export type SchemaTypeID =
  | 'unknownType'
  | 'String'
  | 'Boolean'
  | 'Number'
  | 'Null'
  | 'Missing'
  | 'Object'
  | 'Array'
  | 'Union';

export interface ComplexTypeStatistics {
  [key: string]: {
    counter: number;
    tag?: any;
  };
}

export interface PathStatistics {
  path: string[];
  total: number;
  stats: ComplexTypeStatistics;
  type: SchemaTypeID;
}

interface SchemaObject {
  [key: string]: SchemaType;
}

type TagCombiner = (thisTag: any, otherTag?: any) => any;

interface CombineOptions {
  counter?: number;
  combineTag: TagCombiner;
}

const keepFirst: TagCombiner = thisTag => thisTag;

interface SchemaTypeParams {
  counter?: number;
  tag?: any;
}

export class SchemaType {
  /**
   * Unique type ID that can be used to discriminate between different Schema
   * Types like NumberType, StringType, ObjectType
   */
  public type: SchemaTypeID;

  /**
   * A user-defined identifier that is used to label every node of the schema.
   * In the context of an Algolia Record, the objectID could be used as a tag.
   *
   * The tags are useless during the conversion of a JSON object but can be very
   * useful during the combination of the models, as models that are different can
   * then show different tags, which the user can then use to find what caused
   * the difference.
   *
   * Note: In the model, we will only ever keep only one tag on every node of the
   * tree representation of the schema type
   */
  public tag?: any;

  /**
   * A simple counter that counts how many times this part of the model was combined.
   * This is useful to measure how many times an attribute is Missing, and compare it to
   * how many times the parent object is present, for instance.
   */
  public counter: number;

  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 }
  ) {
    this.counter = counter;
    this.tag = tag;
    this.type = 'unknownType';
  }

  /**
   * Generic method to merge two SchemaType into a single model of the correct
   * type, and that can be overriden when a more advanced logic is needed
   * (e.g. for Object, Arrays, etc.).
   *
   * If the 2 models are of the same type, we can safely merge them together,
   * otherwise we combine them into a UnionType
   *
   * Important: If you override this method to have a more specific combination
   * behaviour, it **MUST** first check that the types are identical, and combine
   * the two different SchemaTypes into a UnionType if they are not.
   *
   * @param {SchemaType} other - the schema to combine it with
   * @param {number} counter - the number of times the other schema was seen
   * @param {TagCombiner} combineTag - a method used
   * to combine tags together. If unset, it uses a keep-first strategy.
   * @returns {SchemaType} a SchemaType that is the combination of both models
   */
  public combine = (
    other: SchemaType,
    { counter, combineTag = keepFirst }: CombineOptions = {
      combineTag: keepFirst,
    }
  ) => {
    if (other.type === this.type) {
      // @ts-ignore ts(2351)
      const result = new other.constructor({
        counter: counter || this.counter + other.counter,
        tag: combineTag(this.tag, other.tag),
      });
      return result;
    }

    const union = new UnionType();
    return union
      .combine(this, { counter, combineTag })
      .combine(other, { counter, combineTag });
  };

  /**
   * transforms a JSON element into a SchemaType
   *
   * @param {any} content - the element to transform into a SchemaType
   * @param {string} tag - a user-defined identifier for that element
   * that may be used as a trace for analysis purposes
   * @returns {SchemaType} the corresponding SchemaType
   */
  public convert = (content: any, tag?: any): SchemaType => {
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
      let types;

      if (!content.length) {
        types = { Missing: new MissingType({ counter: 1, tag }) };
      } else {
        types = content.reduce((partial, item) => {
          const schema = this.convert(item, tag);
          if (partial[schema.type]) {
            partial[schema.type] = partial[schema.type].combine(schema, {
              counter: 1,
            });
          } else {
            partial[schema.type] = schema;
          }

          return partial;
        }, {});
      }
      return new ArrayType({ counter: 1, tag }, types);
    }

    const schema: SchemaObject = Object.entries(content).reduce(
      (schemas: SchemaObject, [key, subContent]) => {
        schemas[key] = this.convert(subContent, tag);
        return schemas;
      },
      {}
    );
    return new ObjectType({ counter: 1, tag }, schema);
  };

  /**
   * Generic method to create a copy of the current model. It is overriden when
   * a more advanced logic is needed.
   *
   * For immutability purposes.
   * @returns {SchemaType} the copy
   */
  public copy = () => {
    // @ts-ignore ts(2351)
    return new this.constructor({ counter: this.counter, tag: this.tag });
  };

  /**
   * Generic method to transform a model into a list of PathStatistics.
   *
   * @param {string[]} path - the path that lead up to this SchemaType. used when
   * recursively building the list of PathStatistics
   * @returns {PathStatistics[]} the corresponding list of PathStatistics
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public asList = (path: string[] = []): PathStatistics[] => {
    // If the type/format is simple (boolean, number, null, etc.), don't return
    // any data, as we only care about complex types, like Object, Arrays, Unions
    // and complex formats, like String/URL, String/Date, etc.
    return [];
  };
}

export class StringType extends SchemaType {
  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 }
  ) {
    super({ counter, tag });
    this.type = 'String';
  }
}

export class BooleanType extends SchemaType {
  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 }
  ) {
    super({ counter, tag });
    this.type = 'Boolean';
  }
}

export class NumberType extends SchemaType {
  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 }
  ) {
    super({ counter, tag });
    this.type = 'Number';
  }
}

export class NullType extends SchemaType {
  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 }
  ) {
    super({ counter, tag });
    this.type = 'Null';
  }
}

export class MissingType extends SchemaType {
  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 }
  ) {
    super({ counter, tag });
    this.type = 'Missing';
  }
}

export class ObjectType extends SchemaType {
  /**
   * An object that contains the SchemaTypes associated with each attribute
   * present in the ObjectType. For instance, the ObjectType associated with
   * { a: 1, b: true } would have the following `.schema` {
   *   a: <StringType>,
   *   b: <BooleanType>
   * }
   */
  public schema: SchemaObject;

  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 },
    schema: { [key: string]: SchemaType } = {}
  ) {
    super({ counter, tag });
    this.type = 'Object';
    this.schema = schema;
  }

  /**
   * A typeguard to ensure that another SchemaType is of the same type
   * @param {SchemaType} other the schema to test
   * @returns {boolean} whether the schema to test is an ObjectType
   */
  public isSameType(other: SchemaType): other is ObjectType {
    return other.type === this.type;
  }

  /**
   * creates an immutable copy of the current ObjectType with identical `.schema`
   * @returns {ObjectType} the copy
   */
  public copy = (): ObjectType => {
    const result = new ObjectType({
      counter: this.counter,
      tag: this.tag,
    });
    result.schema = Object.entries(this.schema).reduce(
      (partial: SchemaObject, [key, schema]) => {
        partial[key] = schema.copy();
        return partial;
      },
      {}
    );

    return result;
  };

  public combine = (
    other: SchemaType,
    { counter, combineTag = keepFirst }: CombineOptions = {
      combineTag: keepFirst,
    }
  ): UnionType | ObjectType => {
    if (!this.isSameType(other)) {
      return new UnionType()
        .combine(this, { counter, combineTag })
        .combine(other, { counter, combineTag });
    }

    /**
     * The combined schema for an ObjectType should have all the attributes of
     * both models that we are combining.
     *
     * In the case where the attribute exists in both schemas, we need to combine
     * both of its model into one first. Otherwise, we need to combine the unique
     * model we found with a MissingType model of the correct size (counter) and
     * identifier (tag)
     */
    let combinedSchema = Object.entries(other.schema).reduce(
      (partial: SchemaObject, [key, schema]) => {
        if (!this.schema[key]) {
          const missing = new MissingType({
            counter: this.counter,
            tag: this.tag,
          });
          partial[key] = new UnionType()
            .combine(missing, { counter, combineTag })
            .combine(schema, { counter, combineTag });
        } else {
          partial[key] = this.schema[key].combine(schema, {
            counter,
            combineTag,
          });
        }

        return partial;
      },
      {}
    );

    combinedSchema = Object.entries(this.schema).reduce(
      (partial: SchemaObject, [key, schema]) => {
        if (!other.schema[key]) {
          const missing = new MissingType({
            counter: other.counter,
            tag: other.tag,
          });
          partial[key] = new UnionType()
            .combine(schema, { counter, combineTag })
            .combine(missing, { counter, combineTag });
        }

        return partial;
      },
      combinedSchema
    );

    const combinedCounter = counter || this.counter + other.counter;
    // @ts-ignore ts(2351)
    return new this.constructor(
      {
        counter: combinedCounter,
        tag: combineTag(this.tag, other.tag),
      },
      combinedSchema
    );
  };

  /**
   * returns a list of PathStatistics
   *
   * In the case of an ObjectType, we want to return a PathStatistics for the
   * ObjectType itself, and potentially for all its children if they are relevant.
   * The stats that are computed are basically simple statistics extracted from
   * all the attributes of the `.schema` of the model.
   *
   * @param {string[]} path - the path that lead up to this SchemaType. used when
   * recursively building the list of PathStatistics
   * @returns {PathStatistics[]} the corresponding list of PathStatistics
   */
  public asList = (path: string[] = []): PathStatistics[] => {
    const list: PathStatistics[] = [];
    const stats = Object.entries(this.schema).reduce(
      (partial, [key, value]) => {
        return {
          ...partial,
          [key]: { counter: value.counter, tag: value.tag },
        };
      },
      {}
    );
    list.push({ path, stats, total: this.counter, type: 'Object' });

    return Object.entries(this.schema).reduce(
      (acc: PathStatistics[], [key, value]) => {
        return [...acc, ...value.asList([...path, key])];
      },
      list
    );
  };
}

export class ArrayType extends SchemaType {
  /**
   * A dictionary that contains all the types present in the ArrayType.
   *
   * Note: We use the Simplified Array Type representation for Arrays. This
   * means that we don't keep track of ordering of the elements in the array
   * but only of the types present within. e.g. [1,2,3] and [1] will have the
   * same ArrayType. ['abc', 123] and [123, 'abc'] will also have the same
   * ArrayType.
   */
  public types: SchemaObject;

  public constructor(
    { counter = 1, tag }: SchemaTypeParams = { counter: 1 },
    types: { [type: string]: SchemaType } = {}
  ) {
    super({ counter, tag });
    this.type = 'Array';
    this.types = types;
  }

  /**
   * A typeguard to ensure that another SchemaType is of the same type
   * @param {SchemaType} other the schema to test
   * @returns {boolean} whether the schema to test is an ArrayType
   */
  public isSameType(other: SchemaType): other is ArrayType {
    return other.type === this.type;
  }

  /**
   * creates an immutable copy of the current ArrayType with identical `.types`
   * @returns {ArrayType} the copy
   */
  public copy = (): ArrayType => {
    const result = new ArrayType({
      counter: this.counter,
      tag: this.tag,
    });
    result.types = Object.entries(this.types).reduce(
      (partial: SchemaObject, [key, schema]) => {
        partial[key] = schema.copy();
        return partial;
      },
      {}
    );

    return result;
  };

  public combine = (
    other: SchemaType,
    { counter, combineTag = keepFirst }: CombineOptions = {
      combineTag: keepFirst,
    }
  ): UnionType | ArrayType => {
    if (!this.isSameType(other)) {
      return new UnionType()
        .combine(this, { counter, combineTag })
        .combine(other, { counter, combineTag });
    }

    /**
     * The combined types for an ArrayType should have all the types of
     * both models that we are combining.
     *
     * In the case where the type exists in both schemas, we need to combine
     * both of its model into one first. Otherwise, we just keep the SchemaType
     * of that specific type as is.
     */
    let combinedTypes = Object.entries(this.types).reduce(
      (partial: SchemaObject, [type, schema]) => {
        partial[type] = schema.copy();
        return partial;
      },
      {}
    );

    combinedTypes = Object.entries(other.types).reduce(
      (partial: SchemaObject, [type, schema]) => {
        if (partial[type]) {
          partial[type] = partial[type].combine(schema, {
            counter,
            combineTag,
          });
        } else {
          partial[type] = schema.copy();
        }

        return partial;
      },
      combinedTypes
    );

    const combinedCounter = counter || this.counter + other.counter;
    // @ts-ignore ts(2351)
    return new this.constructor(
      {
        counter: combinedCounter,
        tag: combineTag(this.tag, other.tag),
      },
      combinedTypes
    );
  };

  /**
   * returns a list of PathStatistics
   *
   * In the case of an ArrayType, we want to return a PathStatistics for the
   * ArrayType itself, and potentially for all its children if they are relevant.
   * The stats that are computed are basically simple statistics extracted from
   * all the types of the `.types` field of the model.
   *
   * @param {string[]} path - the path that lead up to this SchemaType. used when
   * recursively building the list of PathStatistics
   * @returns {PathStatistics[]} the corresponding list of PathStatistics
   */
  public asList = (path: string[] = []): PathStatistics[] => {
    const list: PathStatistics[] = [];
    const stats = Object.entries(this.types).reduce((partial, [key, value]) => {
      return {
        ...partial,
        [key]: { counter: value.counter, tag: value.tag },
      };
    }, {});
    list.push({ path, stats, total: this.counter, type: 'Array' });

    return Object.entries(this.types).reduce((acc, [key, value]) => {
      return [...acc, ...value.asList([...path, `[${key}]`])];
    }, list);
  };
}

export class UnionType extends SchemaType {
  /**
   * A dictionary that contains all the types present within the UnionType.
   * For instance, the representation of 1 | 'hey' | null would be the following
   * `.types`: {
   *   Number: <NumberType>,
   *   String: <StringType>,
   *   Null: <NullType>
   * }
   */
  public types: SchemaObject;

  public constructor(
    { counter = 0 }: SchemaTypeParams = { counter: 0 },
    types = {}
  ) {
    super({ counter });
    this.type = 'Union';
    this.types = types;
  }

  /**
   * A typeguard to ensure that another SchemaType is of the same type
   * @param {SchemaType} other the schema to test
   * @returns {boolean} whether the schema to test is a UnionType
   */
  public isSameType(other: SchemaType): other is UnionType {
    return other.type === this.type;
  }

  /**
   * creates an immutable copy of the current UnionType with identical `.types`
   * @returns {UnionType} the copy
   */
  public copy = (): UnionType => {
    const result = new UnionType();

    result.counter = this.counter;
    result.types = Object.entries(this.types).reduce(
      (partial: SchemaObject, [key, schema]) => {
        partial[key] = schema.copy();
        return partial;
      },
      {}
    );

    return result;
  };

  public combine = (
    other: SchemaType,
    { counter, combineTag = keepFirst }: CombineOptions = {
      combineTag: keepFirst,
    }
  ): UnionType => {
    let combinedTypes: SchemaObject = Object.entries(this.types).reduce(
      (copy: SchemaObject, [type, schema]) => {
        copy[type] = schema.copy();
        return copy;
      },
      {}
    );

    /**
     * We can combine a UnionType with any other type of SchemaType.
     * In the case where we want to merge two UnionTypes together, we have to
     * check if the type exists in both schemas, and combine both of its model.
     * Otherwise, we just keep the SchemaType of that specific type as is, as
     * a part of the UnionType `.types` dictionary.
     */
    if (this.isSameType(other)) {
      combinedTypes = Object.entries(other.types).reduce(
        (types: SchemaObject, [type, schema]) => {
          if (types[type]) {
            types[type] = types[type].combine(schema, {
              counter,
              combineTag,
            });
          } else {
            types[type] = schema.copy();
          }
          return types;
        },
        combinedTypes
      );
    } else if (this.types[other.type]) {
      combinedTypes[other.type] = this.types[other.type].combine(other, {
        counter,
        combineTag,
      });
    } else {
      combinedTypes[other.type] = other.copy();
    }

    const combinedCounter = counter || this.counter + other.counter;
    // @ts-ignore ts(2351)
    return new this.constructor({ counter: combinedCounter }, combinedTypes);
  };

  /**
   * returns a list of PathStatistics
   *
   * In the case of an UnionType, we want to return a PathStatistics for the
   * UnionType itself, and potentially for all its children if they are relevant.
   * The stats that are computed are basically simple statistics extracted from
   * all the types of the `.types` field of the model.
   *
   * @param {string[]} path - the path that lead up to this SchemaType. used when
   * recursively building the list of PathStatistics
   * @returns {PathStatistics[]} the corresponding list of PathStatistics
   */
  public asList = (path: string[] = []): PathStatistics[] => {
    const list: PathStatistics[] = [];
    const stats = Object.entries(this.types).reduce((partial, [key, value]) => {
      return {
        ...partial,
        [key]: { counter: value.counter, tag: value.tag },
      };
    }, {});
    list.push({ path, stats, total: this.counter, type: 'Union' });

    return Object.entries(this.types).reduce((acc, [key, value]) => {
      return [...acc, ...value.asList([...path, `(${key})`])];
    }, list);
  };
}

export const convertToSchema = new SchemaType().convert;

export default convertToSchema;
