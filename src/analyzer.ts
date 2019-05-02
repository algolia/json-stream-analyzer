import convertToSchema, { SchemaType } from './inferer';
import diagnoseTypeIssues from './diagnostics/types';
import { Diagnostic } from './diagnostics/models';

export interface AnalyzerOptions {
  generator: (params: any) => AsyncIterator<any>;
  estimator: (params: any) => { size: number, exact: boolean };
}

class Analyzer {
  private generator: (params: any) => AsyncIterator<any>;
  private estimator: (params: any) => { size: number, exact: boolean };
  private browser?: AsyncIterator<any>;
  private browsing: boolean;
  private model: SchemaType | null;
  private processed: number;
  private total: number;
  private exact: boolean;

  constructor({ generator, estimator }: AnalyzerOptions) {
    this.generator = generator;
    this.estimator = estimator;
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
      let { value, done } = await this.browser.next();
      completed = done;
      if (!done) {
        const schema = convertToSchema(value, value.objectID);
        if (!this.model) {
          this.model = schema;
        }
        else {
          this.model = this.model.combine(schema);
        }
        this.processed += 1;
      }
      else {
        this.browsing = false;
      }
    }
  }

  start = async (browserParams: any) => {
    const { size, exact } = await this.estimator(browserParams);
    this.total = size;
    this.exact = exact;
    this.browser = this.generator(browserParams);
    this.browsing = true;
    this.model = null;
    this.processed = 0;
    this.computeSchema()
  }
  
  pause = () => {
    this.browsing = false
  }

  resume = () => {
    this.browsing = true;
    this.computeSchema();
  }

  diagnose = () => {
    if (!this.model) {
      return {
        processed: {
          count: 0,
          total: 0,
          exact: this.exact
        },
        issues: [] as Diagnostic[],
        model: { type: 'Unknown', counter: 0 } as SchemaType,
      }
    }

    const issues = [...diagnoseTypeIssues(this.model)];
    return {
      processed: {
        count: this.processed,
        total: this.total,
        exact: this.exact
      },
      issues,
      model: this.model
    }
  }
}

export default Analyzer;