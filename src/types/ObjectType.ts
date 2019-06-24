import {
  SchemaTypeParams,
  Diagnostic,
  CombineOptions,
  SchemaType,
  SchemaTypeID,
  SchemaObject,
} from '../interfaces';

import { keepFirst } from '../tags/combiners';
import { UnionType } from './UnionType';
import { MissingType } from './MissingType';

export class ObjectType implements SchemaType {
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
    schema: SchemaObject = {}
  ) {
    this.counter = counter;
    this.tag = tag;
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
        return { ...partial, [key]: schema.copy() };
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
        const update: SchemaObject = {};
        if (!this.schema[key]) {
          const missing = new MissingType({
            counter: this.counter,
            tag: this.tag,
          });
          update[key] = new UnionType()
            .combine(missing, { counter, combineTag })
            .combine(schema, { counter, combineTag });
        } else {
          update[key] = this.schema[key].combine(schema, {
            counter,
            combineTag,
          });
        }

        return { ...partial, ...update };
      },
      {}
    );

    combinedSchema = Object.entries(this.schema).reduce(
      (partial: SchemaObject, [key, schema]) => {
        const update: SchemaObject = {};
        if (!other.schema[key]) {
          const missing = new MissingType({
            counter: other.counter,
            tag: other.tag,
          });
          update[key] = new UnionType()
            .combine(schema, { counter, combineTag })
            .combine(missing, { counter, combineTag });
        }

        return { ...partial, ...update };
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

  public diagnose = (path: string[] = []) => {
    let diagnostics: Diagnostic[] = [];

    const numericalKeys = Object.entries(this.schema)
      .filter(([key]) => !Number.isNaN(parseFloat(key)))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, value]) => value);

    if (numericalKeys.length) {
      const largestNumericalKey = numericalKeys.sort(
        ({ counter: a }, { counter: b }) => b - a
      )[0];

      const diagnostic: Diagnostic = {
        id: 'numericalKeyOnObject',
        title: `Object with numbers as keys`,
        type: this.type,
        path,
        // we can't know for sure how many records are affected, but there's at least that amount that is affected
        affected: largestNumericalKey.counter,
        tag: largestNumericalKey.tag,
      };

      diagnostics = [diagnostic];
    }

    return Object.entries(this.schema).reduce(
      (currentDiagnostics, [key, schema]) => {
        return [...currentDiagnostics, ...schema.diagnose([...path, key])];
      },
      diagnostics
    );
  };

  public traverse = (path: string[] = []) => {
    const invalidPathSchema: { path: string[]; schema: SchemaType } = {
      path: [],
      schema: this as SchemaType,
    };
    if (path.length === 0) {
      return invalidPathSchema;
    }

    const segment = path[0];

    const subSchema = this.schema[segment];
    if (subSchema) {
      const { path: subPath, schema: traversedSchema } = subSchema.traverse(
        path.slice(1)
      );
      return { path: [segment, ...subPath], schema: traversedSchema };
    }

    return invalidPathSchema;
  };
}
