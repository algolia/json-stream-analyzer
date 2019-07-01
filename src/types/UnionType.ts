import {
  Diagnostic,
  CombineOptions,
  SchemaTypeID,
  SchemaTypeParams,
  SchemaType,
  SchemaObject,
} from '../interfaces';
import { keepFirst } from '../tags/combiners';

const isMultiType = (types: string[]): boolean => {
  if (types.length === 2 && types.indexOf('Missing') === -1) return true;
  return types.length > 2;
};

export class UnionType implements SchemaType {
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
    types: SchemaObject = {}
  ) {
    this.counter = counter;
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
  ): UnionType => {
    let combinedTypes: SchemaObject = Object.entries(this.types).reduce(
      (copy: SchemaObject, [type, schema]) => {
        return { ...copy, [type]: schema.copy() };
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
          const update: SchemaObject = {};
          if (types[type]) {
            update[type] = types[type].combine(schema, {
              counter,
              combineTag,
            });
          } else {
            update[type] = schema.copy();
          }
          return { ...types, ...update };
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

  private diagnoseChildren = (path: string[]) => {
    return Object.entries(this.types).reduce(
      (currentDiagnostics: Diagnostic[], [type, schema]) => {
        return [
          ...currentDiagnostics,
          ...schema.diagnose([...path, `(${type})`]),
        ];
      },
      []
    );
  };

  public diagnose = (path: string[] = []) => {
    let diagnostics: Diagnostic[] = [];

    if (this.types.Missing) {
      const diagnostic: Diagnostic = {
        id: 'missing',
        title: 'Missing Data',
        type: this.type,
        path,
        affected: this.types.Missing.counter,
        tag: this.types.Missing.tag,
      };

      diagnostics.push(diagnostic);
    }

    const modeType = Object.entries(this.types).reduce(
      (bestType: string | null, [key, { counter }]) => {
        if (key === 'Missing') {
          return bestType;
        }

        if (!bestType) {
          return key;
        }

        if (this.types[bestType].counter < counter) {
          return key;
        }

        return bestType;
      },
      null
    );

    if (isMultiType(Object.keys(this.types))) {
      const multiTypeDiagnostics: Diagnostic[] = Object.entries(this.types)
        .filter(([key]) => key !== modeType && key !== 'Missing')
        .map(([key, value]) => {
          return {
            id: 'inconsistentType',
            title: `Inconsistent Type (${key} instead of ${modeType})`,
            type: this.type,
            path,
            affected: value.counter,
            tag: value.tag,
          };
        });

      diagnostics = [...diagnostics, ...multiTypeDiagnostics];
    }

    const healthyDiagnostic: Diagnostic = {
      id: 'healthy',
      title: `Healthy Records`,
      type: this.type,
      path,
      affected: this.types[modeType!].counter,
      tag: this.types[modeType!].tag,
    };

    diagnostics.push(healthyDiagnostic);

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

    if (segment.match(/^\(.*\)$/)) {
      // the type-check is a fail-safe -- this should never be false without a processing bug
      const match = segment!.match(/^\((.*)\)$/);
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
