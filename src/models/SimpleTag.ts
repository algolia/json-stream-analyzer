import { SchemaType, Diagnostic } from "../interfaces";
import convertToSchema from "../convert";

export class SimpleTagModel {
  private tag: (record: any) => any;
  private model?: SchemaType;

  constructor({ tag }: { tag: (record: any) => any }) {
    this.tag = tag;
  }

  convert(record: any): SchemaType {
    const tag = this.tag(record);
    return convertToSchema(record, tag);
  }

  combineTag(firstTag: any) {
    return firstTag;
  }

  combine(first: SchemaType, second: SchemaType): SchemaType {
    return first.combine(second, { combineTag: this.combineTag })
  }

  diagnose(): Diagnostic[] {
    if (this.model) {
      return this.model.diagnose();
    }

    return [];
  }

  diagnoseRecord(record: any) {
    const tag = this.tag(record);
    const recordModel = convertToSchema(record, tag);

    let combined;
    if (this.model) {
      combined = this.combine(record, this.model);
    }
    else {
      combined = recordModel;
    }

    return combined.diagnose().filter((diagnostic: Diagnostic) => {
      return diagnostic.tag === tag;
    });
  }

  addToModel(record: any) {
    const recordModel = this.convert(record);
    if (!this.model) {
      this.model = recordModel;
    }
    else {
      this.model = this.combine(this.model, recordModel);
    }
  }
}
