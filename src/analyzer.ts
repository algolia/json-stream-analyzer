import convertToSchema, { SchemaType } from './inferer';
import diagnoseTypeIssues from './diagnostics/types';
import { Diagnostic } from './diagnostics/models';

export interface AnalyzerOptions {
  generator: (params: any) => AsyncIterator<any>;
  estimator: (params: any) => Promise<{ size: number; exact: boolean }>;
  tag: (value: any) => string;
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

  public diagnose = () => {
    if (!this.model) {
      return {
        processed: {
          count: 0,
          total: 0,
          exact: this.exact,
        },
        issues: [] as Diagnostic[],
        model: { type: 'Unknown', counter: 0 } as SchemaType,
      };
    }

    const issues = [...diagnoseTypeIssues(this.model)];
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
