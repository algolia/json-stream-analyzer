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
  tag: (value: any) => any;
  dismiss?: (diagnostic: Diagnostic) => boolean;
  sortBy?: (a: PathDiagnosticAggregate, b: PathDiagnosticAggregate) => number;
}

export class SyncAnalyzer implements Analyzer {
  private tag: (value: any) => any;
  public dismiss: (diagnostic: Diagnostic) => boolean;
  private model: SchemaType | null;
  private processed: number;
  public sortBy: (
    a: PathDiagnosticAggregate,
    b: PathDiagnosticAggregate
  ) => number;

  public constructor({ tag, dismiss, sortBy }: SyncAnalyzerOptions) {
    this.tag = tag;
    this.model = null;
    this.processed = 0;
    this.dismiss = dismiss || (() => false);
    this.sortBy = sortBy || ((a, b) => b.totalAffected - a.totalAffected);
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
        dismissed: [],
        model: new SchemaType({ counter: 0 }),
      };
    }

    const diagnostics: Diagnostic[] = diagnose(this.model.asList());
    const groupedDiagnostic = diagnostics.reduce(
      (
        {
          tracked,
          dismissed,
        }: { tracked: Diagnostic[]; dismissed: Diagnostic[] },
        diagnostic
      ) => {
        if (this.dismiss(diagnostic)) {
          return {
            tracked,
            dismissed: [...dismissed, diagnostic],
          };
        }

        return {
          tracked: [...tracked, diagnostic],
          dismissed,
        };
      },
      { tracked: [], dismissed: [] }
    );

    const issues: PathDiagnosticAggregate[] = aggregateByPath(
      groupedDiagnostic.tracked,
      this.model
    );

    const dismissed: PathDiagnosticAggregate[] = aggregateByPath(
      groupedDiagnostic.dismissed,
      this.model
    );

    issues.sort(this.sortBy);
    dismissed.sort(this.sortBy);

    return {
      processed: {
        count: this.processed,
      },
      issues,
      dismissed,
      model: this.model,
    };
  };
}

export default SyncAnalyzer;
