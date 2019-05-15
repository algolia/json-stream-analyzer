import {
  Analysis,
  Diagnostic,
  PathDiagnosticAggregate,
  Analyzer,
} from '../interfaces';

import convertToSchema, { SchemaType } from '../inference';
import diagnose from '../diagnostics';
import { aggregateByPath } from '../aggregation';

interface SyncAnalyzerOptions {
  tag: (value: any) => string;
}

export class SyncAnalyzer implements Analyzer {
  private tag: (value: any) => string;
  private model: SchemaType | null;
  private processed: number;

  public constructor({ tag }: SyncAnalyzerOptions) {
    this.tag = tag;
    this.model = null;
    this.processed = 0;
  }

  public pushToModel = (inputs: any[]) => {
    this.model = inputs.reduce((model: SchemaType | null, input: any) => {
      const schema = convertToSchema(input, this.tag(input));
      if (!model) {
        return schema;
      } else {
        return model.combine(schema);
      }
    }, this.model);

    this.processed += inputs.length;
  };

  public reset = () => {
    this.model = null;
    this.processed = 0;
  };

  public diagnose = (): Analysis => {
    if (!this.model) {
      return {
        processed: {
          count: 0,
        },
        issues: [],
        model: new SchemaType(0),
      };
    }

    const diagnostics: Diagnostic[] = diagnose(this.model.asList());
    const issues: PathDiagnosticAggregate[] = aggregateByPath(
      diagnostics,
      this.model
    );

    issues.sort(({ totalAffected: a }, { totalAffected: b }) => b - a);

    return {
      processed: {
        count: this.processed,
      },
      issues,
      model: this.model,
    };
  };
}

export default SyncAnalyzer;
