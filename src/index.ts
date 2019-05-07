import convertToSchema, { SchemaType } from './inference';
import diagnose from './diagnostics';
import { Diagnostic, PathDiagnosticAggregate } from './models';
import { aggregateByPath } from './aggregation';

export interface AnalyzerOptions {
  generator: (params: any) => AsyncIterator<any>;
  estimator: (params: any) => Promise<{ size: number; exact: boolean }>;
  tag: (value: any) => string;
}

export interface Analysis {
  processed: {
    count: number;
    total: number;
    exact: boolean;
  };
  issues: PathDiagnosticAggregate[];
  model: SchemaType;
}

class Analyzer {
  private generator: (params: any) => AsyncIterator<any>;
  private estimator: (params: any) => Promise<{ size: number; exact: boolean }>;
  private tag: (value: any) => string;
  private browser?: AsyncIterator<any>;
  private browsing: boolean;
  private model: SchemaType | null;
  private processed: number;
  private total: number;
  private exact: boolean;

  public constructor({ generator, estimator, tag }: AnalyzerOptions) {
    this.generator = generator;
    this.estimator = estimator;
    this.tag = tag;
    this.browsing = false;
    this.model = null;
    this.processed = 0;
    this.total = 0;
    this.exact = false;
  }

  private computeSchema = async () => {
    if (!this.browser) {
      return;
    }

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

  public start = async (browserParams?: any): Promise<void> => {
    const { size, exact } = await this.estimator(browserParams);
    this.total = size;
    this.exact = exact;
    this.browser = this.generator(browserParams);
    this.browsing = true;
    this.model = null;
    this.processed = 0;
    return this.computeSchema();
  };

  public pause = () => {
    this.browsing = false;
  };

  public resume = () => {
    this.browsing = true;
    this.computeSchema();
  };

  public diagnose = (): Analysis => {
    if (!this.model) {
      return {
        processed: {
          count: 0,
          total: 0,
          exact: this.exact,
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
        total: this.total,
        exact: this.exact,
      },
      issues,
      model: this.model,
    };
  };
}

export default Analyzer;
