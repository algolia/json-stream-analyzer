import {
  Analysis,
  Diagnostic,
  PathDiagnosticAggregate,
  Analyzer,
} from '../interfaces';

import convertToSchema, { SchemaType } from '../inference';
import diagnose from '../diagnostics';
import { aggregateByPath } from '../aggregation';

export interface AsyncIteratorAnalyzerOptions {
  generator: (params: any) => AsyncIterator<any>;
  tag: (value: any) => any;
}

export class AsyncIteratorAnalyzer implements Analyzer {
  private generator: (params: any) => AsyncIterator<any>;
  private tag: (value: any) => any;
  private browser?: AsyncIterator<any>;
  private browsing: boolean;
  private model: SchemaType | null;
  private processed: number;

  public constructor({ generator, tag }: AsyncIteratorAnalyzerOptions) {
    this.generator = generator;
    this.tag = tag;
    this.browsing = false;
    this.model = null;
    this.processed = 0;
  }

  private computeSchema = async () => {
    if (!this.browser) {
      return;
    }

    this.browsing = true;
    let completed = false;
    while (this.browsing && !completed) {
      const { value, done } = await this.browser.next();
      completed = done;
      if (!done) {
        const schema = convertToSchema(value, this.tag(value));
        if (!this.model) {
          this.model = schema;
        } else {
          this.model = this.model.combine(schema);
        }
        this.processed += 1;
      } else {
        this.browsing = false;
      }
    }
  };

  public start = (browserParams?: any): Promise<void> => {
    this.browser = this.generator(browserParams);
    this.model = null;
    this.processed = 0;
    return this.computeSchema();
  };

  public pause = () => {
    this.browsing = false;
  };

  public resume = () => {
    this.computeSchema();
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
      dismissed: [],
      model: this.model,
    };
  };
}

export default AsyncIteratorAnalyzer;
