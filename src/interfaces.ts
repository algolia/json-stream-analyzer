export type TagCombiner = (thisTag: any, otherTag?: any) => any;

export interface CombineOptions {
  counter?: number;
  combineTag: TagCombiner;
}

export type SchemaTypeID =
  | 'Array'
  | 'Boolean'
  | 'Missing'
  | 'Null'
  | 'Number'
  | 'Object'
  | 'String'
  | 'Union'
  | 'unknownType';

export interface SchemaTypeParams {
  counter?: number;
  tag?: any;
}

export interface SchemaType {
  /**
   * Unique type ID that can be used to discriminate between different Schema
   * Types like NumberType, StringType, ObjectType.
   */
  type: SchemaTypeID;

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
   * tree representation of the schema type.
   */
  tag?: any;

  /**
   * A simple counter that counts how many times this part of the model was combined.
   * This is useful to measure how many times an attribute is Missing, and compare it to
   * how many times the parent object is present, for instance.
   */
  counter: number;

  /**
   * Generic method to merge two SchemaType into a single model of the correct
   * type, and that can be overriden when a more advanced logic is needed
   * (e.g. For Object, Arrays, etc.).
   *
   * If the 2 models are of the same type, we can safely merge them together,
   * otherwise we combine them into a UnionType.
   *
   * Important: If you override this method to have a more specific combination
   * behaviour, it **MUST** first check that the types are identical, and combine
   * the two different SchemaTypes into a UnionType if they are not.
   *
   * @param {SchemaType} other - The schema to combine it with.
   * @param {number} counter - The number of times the other schema was seen.
   * @param {TagCombiner} combineTag - A method used
   * to combine tags together. If unset, it uses a keep-first strategy.
   * @returns {SchemaType} A SchemaType that is the combination of both models.
   */
  combine: (other: SchemaType, options?: CombineOptions) => SchemaType;

  /**
   * Generic method to create a copy of the current model. It is overriden when
   * a more advanced logic is needed.
   *
   * For immutability purposes.
   *
   * @returns {SchemaType} The copy.
   */
  copy: () => SchemaType;

  diagnose: (path?: string[]) => Diagnostic[];

  traverse: (path?: string[]) => { schema?: SchemaType; path: string[] };
}

export interface SchemaObject {
  [key: string]: SchemaType;
}

export type DiagnosticID =
  | 'emptyArray'
  | 'healthy'
  | 'inconsistentType'
  | 'missing'
  | 'numericalKeyOnObject'
  | 'polymorphicArray';

export interface Diagnostic {
  id: DiagnosticID;
  title: string;
  type: SchemaTypeID;
  path: string[];
  affected: number;
  tag?: any;
}

export interface Model {
  tag: (record: any) => any;
  schema?: SchemaType;
  convert: (record: any) => SchemaType;
  combineTag: (thisTag: any, otherTag: any) => any;
  combine: (first: SchemaType, second: SchemaType) => SchemaType;
  diagnose: () => Diagnostic[];
  diagnoseRecord: (record: any) => Diagnostic[];
  addToModel: (record: any) => void;
  traverseSchema: (path: string[]) => { schema?: SchemaType; path: string[] };
}

export interface ModelArgs {
  tag: (record: any) => any;
}
export interface ModelOptions {
  collectStatistics?: {
    array?: boolean;
    boolean?: boolean;
  };
  modifier?: (path: string[], node: any) => any;
}
