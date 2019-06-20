import { SchemaType, Diagnostic } from '../interfaces';
import convertToSchema from '../convert';

export class SimpleTagModel {
  private tag: (record: any) => any;
  private model?: SchemaType;

  public constructor({ tag }: { tag: (record: any) => any }) {
    this.tag = tag;
  }

  public convert(record: any): SchemaType {
    const tag = this.tag(record);
    return convertToSchema(record, tag);
  }

  public combineTag(firstTag: any): any {
    return firstTag;
  }

  public combine(first: SchemaType, second: SchemaType): SchemaType {
    return first.combine(second, { combineTag: this.combineTag });
  }

  public diagnose(): Diagnostic[] {
    if (this.model) {
      return this.model.diagnose();
    }

    return [];
  }

  public diagnoseRecord(record: any): Diagnostic[] {
    const tag = this.tag(record);
    const recordModel = convertToSchema(record, tag);

    let combined;
    if (this.model) {
      combined = this.combine(record, this.model);
    } else {
      combined = recordModel;
    }

    return combined.diagnose().filter((diagnostic: Diagnostic) => {
      return diagnostic.tag === tag;
    });
  }

  public addToModel(record: any): void {
    const recordModel = this.convert(record);
    if (!this.model) {
      this.model = recordModel;
    } else {
      this.model = this.combine(this.model, recordModel);
    }
  }
}
