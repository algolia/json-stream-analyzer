import type {
  SchemaTypeParams,
  SchemaType,
  SchemaTypeID,
  CombineOptions,
  Diagnostic,
} from '../interfaces';
import { keepFirst } from '../tags/combiners';

import { UnionType } from './UnionType';

export interface BooleanStatistics {
  trueVal: number;
}

export class BooleanType implements SchemaType {
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

  stats: BooleanStatistics;

  constructor(
    {
      counter = 1,
      tag,
      stats,
    }: SchemaTypeParams & { stats?: BooleanStatistics } = {
      counter: 1,
    }
  ) {
    this.counter = counter;
    this.tag = tag;
    this.type = 'Boolean';
    this.stats = stats || { trueVal: 0 };
  }

  /**
   * A type guard to ensure that another SchemaType is of the same type.
   *
   * @param other - The schema to test.
   * @returns Whether the schema to test is an BooleanType.
   */
  isSameType(other: SchemaType): other is BooleanType {
    return other.type === this.type;
  }

  /**
   * Generic method to merge two SchemaType into a single model of the correct
   * type, and that can be overridden when a more advanced logic is needed
   * (e.g. For Object, Arrays, etc.).
   *
   * If the 2 models are of the same type, we can safely merge them together,
   * otherwise we combine them into a UnionType.
   *
   * Important: If you override this method to have a more specific combination
   * behavior, it **MUST** first check that the types are identical, and combine
   * the two different SchemaTypes into a UnionType if they are not.
   *
   * @param other - The schema to combine it with.
   * @param counter - The counter.
   * @param counter.counter - The number of times the other schema was seen.
   * @param counter.combineTag - A method used
   * to combine tags together. If unset, it uses a keep-first strategy.
   * @returns A SchemaType that is the combination of both models.
   */
  combine = (
    other: SchemaType,
    { counter, combineTag = keepFirst }: CombineOptions = {
      combineTag: keepFirst,
    }
  ): SchemaType => {
    if (this.isSameType(other)) {
      const combinedStats = { ...this.stats };
      combinedStats.trueVal += other.stats.trueVal;

      // @ts-expect-error ts(2351)
      const result = new other.constructor({
        counter: counter || this.counter + other.counter,
        tag: combineTag(this.tag, other.tag),
        stats: combinedStats,
      });
      return result;
    }

    const union = new UnionType();
    return union
      .combine(this, { counter, combineTag })
      .combine(other, { counter, combineTag });
  };

  /**
   * Generic method to create a copy of the current model. It is overridden when
   * a more advanced logic is needed.
   *
   * For immutability purposes.
   *
   * @returns The copy.
   */
  copy = () => {
    // @ts-expect-error ts(2351)
    return new this.constructor({
      counter: this.counter,
      tag: this.tag,
      stats: { ...this.stats },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  diagnose = (path: string[] = []): Diagnostic[] => {
    return [];
  };

  traverse = () => {
    const invalidPathSchema: { path: string[]; schema: SchemaType } = {
      path: [],
      schema: this as SchemaType,
    };

    return invalidPathSchema;
  };
}
