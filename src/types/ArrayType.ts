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

const isMultiType = (types: string[]): boolean => {
  if (types.length === 2 && types.indexOf('Missing') === -1) return true;
  return types.length > 2;
};

export class ArrayType implements SchemaType {
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
    types: SchemaObject = {}
  ) {
    this.counter = counter;
    this.tag = tag;
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
        return { ...partial, [type]: schema.copy() };
      },
      {}
    );

    combinedTypes = Object.entries(other.types).reduce(
      (partial: SchemaObject, [type, schema]) => {
        const update: SchemaObject = {};
        if (partial[type]) {
          update[type] = partial[type].combine(schema, {
            counter,
            combineTag,
          });
        } else {
          update[type] = schema.copy();
        }

        return { ...partial, ...update };
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

  private diagnoseChildren = (path: string[]) => {
    return Object.entries(this.types).reduce(
      (currentDiagnostics: Diagnostic[], [type, schema]) => {
        return [
          ...currentDiagnostics,
          ...schema.diagnose([...path, `[${type}]`]),
        ];
      },
      []
    );
  };

  public diagnose = (path: string[] = []): Diagnostic[] => {
    const diagnostics: Diagnostic[] = [];
    let missingAffected = 0;
    if (this.types.Missing) {
      const diagnostic: Diagnostic = {
        id: 'emptyArray',
        title: 'Empty Array',
        type: this.type,
        path,
        affected: this.types.Missing.counter,
        tag: this.types.Missing.tag,
      };

      diagnostics.push(diagnostic);

      missingAffected = this.types.Missing.counter;
    }

    const possibleTag = Object.entries(this.types).filter(
      ([key]) => key !== 'Missing'
    )[0][1].tag;

    if (isMultiType(Object.keys(this.types))) {
      const diagnostic: Diagnostic = {
        id: 'polymorphicArray',
        title: `Array may contain multiple types`,
        type: this.type,
        path,
        affected: this.counter - missingAffected,
        tag: possibleTag,
      };

      diagnostics.push(diagnostic);
    } else if (diagnostics.length > 0) {
      const diagnostic: Diagnostic = {
        id: 'healthy',
        title: `Healthy Records`,
        type: this.type,
        path,
        affected: this.counter - missingAffected,
        tag: possibleTag,
      };

      diagnostics.push(diagnostic);
    }

    return [...diagnostics, ...this.diagnoseChildren(path)];
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

    if (segment.match(/^\[.*\]$/)) {
      // the type-check is a fail-safe -- this should never be false without a processing bug
      const match = segment!.match(/^\[(.*)\]$/);
      const subSchema = this.types[match![0]];
      if (subSchema) {
        const { path: subPath, schema: traversedSchema } = subSchema.traverse(
          path.slice(1)
        );
        return { path: [segment, ...subPath], schema: traversedSchema };
      }
    }

    return invalidPathSchema;
  };
}
