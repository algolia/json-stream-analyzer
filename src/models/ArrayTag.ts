import convertToSchema from '../convert';
import type { SchemaType, Diagnostic, Model } from '../interfaces';

export class ArrayTagModel implements Model {
  tag: (record: any) => any;
  schema?: SchemaType;
  private size: number;

  constructor({ tag, size }: { tag: (record: any) => any; size: number }) {
    this.tag = tag;
    this.size = size;
  }

  convert = (record: any): SchemaType => {
    const tag = [this.tag(record)];
    return convertToSchema(record, tag);
  };

  combineTag = (thisTag: any, otherTag: any): any => {
    if (Array.isArray(thisTag) && thisTag.length >= this.size) {
      return thisTag;
    }

    if (Array.isArray(thisTag) && Array.isArray(otherTag)) {
      return [...thisTag, ...otherTag].slice(0, this.size);
    }

    if (Array.isArray(thisTag)) {
      return [...thisTag, otherTag];
    }

    if (Array.isArray(otherTag)) {
      return [thisTag, ...otherTag].slice(0, this.size);
    }

    return [thisTag, otherTag];
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
    const tag = [this.tag(record)];
    const recordSchema = convertToSchema(record, tag);

    let combined;
    if (this.schema) {
      combined = this.combine(recordSchema, this.schema);
    } else {
      combined = recordSchema;
    }

    return combined.diagnose().filter((diagnostic: Diagnostic) => {
      if (diagnostic.id === 'healthy') {
        return false;
      }

      if (!Array.isArray(diagnostic.tag)) {
        return false;
      }

      return diagnostic.tag.includes(tag[0]);
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

  traverseSchema = (path: string[]) => {
    if (!this.schema) {
      return { path, schema: this.schema };
    }
    return this.schema.traverse(path);
  };
}
