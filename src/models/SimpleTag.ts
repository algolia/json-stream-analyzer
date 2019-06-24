import { SchemaType, Diagnostic, Model } from '../interfaces';
import convertToSchema from '../convert';

export class SimpleTagModel implements Model {
  public tag: (record: any) => any;
  public schema?: SchemaType;

  public constructor({ tag }: { tag: (record: any) => any }) {
    this.tag = tag;
  }

  public convert = (record: any): SchemaType => {
    const tag = this.tag(record);
    return convertToSchema(record, tag);
  };

  public combineTag = (firstTag: any): any => {
    return firstTag;
  };

  public combine = (first: SchemaType, second: SchemaType): SchemaType => {
    return first.combine(second, { combineTag: this.combineTag });
  };

  public diagnose = (): Diagnostic[] => {
    if (this.schema) {
      return this.schema.diagnose();
    }

    return [];
  };

  public diagnoseRecord = (record: any): Diagnostic[] => {
    const tag = this.tag(record);
    const recordModel = convertToSchema(record, tag);

    let combined;
    if (this.schema) {
      combined = this.combine(record, this.schema);
    } else {
      combined = recordModel;
    }

    return combined.diagnose().filter((diagnostic: Diagnostic) => {
      return diagnostic.tag === tag;
    });
  };

  public addToModel = (record: any): void => {
    const recordModel = this.convert(record);
    if (!this.schema) {
      this.schema = recordModel;
    } else {
      this.schema = this.combine(this.schema, recordModel);
    }
  };

  public traverseSchema = (path: string[]) => {
    if (!this.schema) {
      return { path, schema: this.schema };
    }
    return this.schema.traverse(path);
  };
}
