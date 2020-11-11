/* eslint-disable @typescript-eslint/no-use-before-define */
import { SchemaTypeID } from '../interfaces';

// https://github.com/microsoft/TypeScript/issues/1897#issuecomment-557057387
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue =
  | JSONPrimitive
  | JSONObject
  | Array<JSONPrimitive | JSONObject>;
export type JSONObject = { [member: string]: JSONValue };
export type JSONArray = JSONValue[];

type Final = JSONValue;

type Types = Array<{
  type: SchemaTypeID;
  counter: number;
}>;
type ToJson = {
  total: number;
  mixed: boolean;
  types: Types;
  values: ToJson | undefined;
};

class SchemaBag {
  private types: Map<SchemaTypeID, { counter: number }> = new Map();
  private total: number = 0;
  private values: AggregatorModel | undefined;

  public add(type: SchemaTypeID, isValue: boolean = false): void {
    if (isValue) {
      if (!this.values) {
        this.values = new AggregatorModel();
      }
      this.values.add([], type);
      return;
    }

    if (!this.types.has(type)) {
      this.types.set(type, { counter: 0 });
    }

    this.total += 1;
    const ref = this.types.get(type)!;
    ref.counter += 1;
  }

  public toJSON(): ToJson {
    return {
      total: this.total,
      mixed: this.types.size > 1,
      values: this.values?.schema[0][1],
      types: Array.from(this.types.entries()).map(([type, data]) => {
        return {
          type,
          ...data,
        };
      }),
    };
  }
}

class Model {
  private aggregator;
  private path;

  public constructor(aggregator: AggregatorModel, path: string[] = []) {
    this.aggregator = aggregator;
    this.path = path;
  }

  public convert(content: Final): void {
    if (typeof content === 'number') {
      return this.aggregator.add(this.path, 'Number');
    }

    if (typeof content === 'boolean') {
      return this.aggregator.add(this.path, 'Boolean');
    }

    if (typeof content === 'string') {
      return this.aggregator.add(this.path, 'String');
    }

    if (content === null) {
      return this.aggregator.add(this.path, 'Null');
    }

    if (typeof content === 'undefined') {
      return this.aggregator.add(this.path, 'unknownType');
    }

    if (Array.isArray(content)) {
      content.forEach((value) => {
        const model = new Model(this.aggregator, [...this.path, 'values']);
        model.convert(value);
      });
      return this.aggregator.add(this.path, 'Array');
    }

    this.aggregator.add(this.path, 'Object');

    return Object.entries(content).forEach(([keyObj, obj]) => {
      const model = new Model(this.aggregator, [...this.path, keyObj]);
      model.convert(obj);
    });
  }
}

export class AggregatorModel {
  private keys = new Map<string, SchemaBag>();

  public add(key: string[], type: SchemaTypeID): void {
    const isValue = key[key.length - 1] === 'values';
    if (isValue) {
      key.pop();
    }
    const stringKey = JSON.stringify(key);
    if (!this.keys.has(stringKey)) {
      const bag = new SchemaBag();
      this.keys.set(stringKey, bag);
    }

    const ref = this.keys.get(stringKey)!;
    ref.add(type, isValue);
  }

  public aggr(content: Final): void {
    const model = new Model(this, []);
    model.convert(content);
  }

  public get schema(): Array<[string[], ToJson]> {
    return Array.from(this.keys.entries()).map(([key, schema]) => {
      return [JSON.parse(key), schema.toJSON()];
    });
  }
}
