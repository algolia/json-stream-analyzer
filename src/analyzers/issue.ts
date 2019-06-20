import convertToSchema from '../convert';
import { Diagnostic, SchemaType } from '../interfaces';
import { UnknownType } from '../types';

interface IssueAnalysis {
  model: SchemaType;
  issues: Diagnostic[];
  dismissed: Diagnostic[];
}

export class IssueAnalyzer {
  private tag: (value: any) => any;
  private combineTag: (first: any, second: any) => any;
  public dismiss: (diagnostic: Diagnostic) => boolean;
  private model: SchemaType | null;

  public constructor({ tag, combineTag, dismiss }: any) {
    this.tag = tag;
    this.combineTag = combineTag;
    this.model = null;
    this.dismiss = dismiss || (() => false);
  }

  public pushToModel = (inputs: any[]) => {
    this.model = inputs.reduce((model: SchemaType | null, input: any) => {
      const schema = convertToSchema(input, this.tag(input));
      if (!model) {
        return schema;
      } else {
        return model.combine(schema, { combineTag: this.combineTag });
      }
    }, this.model);
  };

  public diagnose = (): IssueAnalysis => {
    if (!this.model) {
      return {
        model: new UnknownType({ counter: 0 }),
        issues: [],
        dismissed: [],
      };
    }

    const diagnostics = this.model.diagnose();
    const { issues, dismissed } = diagnostics.reduce(
      (split, diagnostic) => {
        const shouldDismiss = this.dismiss(diagnostic);

        if (shouldDismiss) {
          return { ...split, dismissed: [...split.dismissed, diagnostic] };
        }

        return { ...split, issues: [...split.issues, diagnostic] };
      },
      { issues: [] as Diagnostic[], dismissed: [] as Diagnostic[] }
    );

    return {
      model: this.model,
      issues,
      dismissed,
    };
  };
}
