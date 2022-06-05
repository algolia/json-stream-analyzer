import convertToSchema from '../convert';
import type {
  SchemaType,
  Diagnostic,
  Model,
  ModelOptions,
  ModelArgs,
} from '../interfaces';

export class SimpleTagModel implements Model {
  options: ModelOptions;
  schema?: SchemaType;

  constructor(options: ModelArgs & ModelOptions) {
    this.options = options;
    this.tag = options.tag;
  }

  tag: ModelArgs['tag'] = () => null;

  convert = (record: any): SchemaType => {
    const tag = this.tag(record);
    return convertToSchema(record, tag, this.options);
  };

  combineTag = (firstTag: any): any => {
    return firstTag;
  };

  combine = (first: SchemaType, second: SchemaType): SchemaType => {
    return first.combine(second, { combineTag: this.combineTag });
  };

  diagnose = (): Diagnostic[] => {
    if (this.schema) {
      return this.schema.diagnose();
    }

    return [];
  };

  diagnoseRecord = (record: any): Diagnostic[] => {
    const tag = this.tag(record);
    const recordSchema = convertToSchema(record, tag, this.options);

    let combined;
    if (this.schema) {
      combined = this.combine(recordSchema, this.schema);
    } else {
      combined = recordSchema;
    }

    return combined.diagnose().filter((diagnostic: Diagnostic) => {
      return diagnostic.tag === tag && diagnostic.id !== 'healthy';
    });
  };

  addToModel = (record: any): void => {
    const recordModel = this.convert(record);
    if (!this.schema) {
      this.schema = recordModel;
    } else {
      this.schema = this.combine(this.schema, recordModel);
    }
  };

  traverseSchema = (path: string[]): ReturnType<SchemaType['traverse']> => {
    if (!this.schema) {
      return { path, schema: this.schema };
    }
    return this.schema.traverse(path);
  };
}
