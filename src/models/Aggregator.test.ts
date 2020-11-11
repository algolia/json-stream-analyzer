import { AggregatorModel } from './Aggregator';

describe('Flat', () => {
  it('should aggregate multiple json', () => {
    const aggregator = new AggregatorModel();

    aggregator.aggr({
      objectID: 1,
      title: 'How to build a performant library?',
      prices: {
        hardcover: 52,
        ebook: 10,
        mixed: '7',
      },
      tags: ['foo', 'bar'],
      visible: true,
    });
    aggregator.aggr({
      objectID: 2,
      title: 'Lorem ipsum',
      prices: {
        ebook: 10,
        mixed: 9,
      },
      tags: ['foobar', { id: 2 }],
      users: [{ id: 1, name: 'Foo' }],
      visible: false,
      foo: null,
    });
    aggregator.aggr({
      objectID: 2,
      title: 'Lorem ipsum',
      prices: false,
      tags: true,
      visible: false,
      foo: null,
    });
    aggregator.aggr(true);
    aggregator.aggr([{ myId: 1, desc: 'Foo' }]);
    aggregator.aggr(null);

    expect(Array.from(aggregator.schema)).toStrictEqual([
      [
        [],
        {
          types: [
            { type: 'Object', counter: 3 },
            {
              type: 'Boolean',
              counter: 1,
            },
            {
              type: 'Array',
              counter: 1,
            },
            {
              type: 'Null',
              counter: 1,
            },
          ],
          mixed: true,
          total: 6,
        },
      ],
      [
        ['objectID'],
        {
          types: [{ type: 'Number', counter: 3 }],
          mixed: false,
          total: 3,
        },
      ],
      [
        ['title'],
        {
          types: [{ type: 'String', counter: 3 }],
          mixed: false,
          total: 3,
        },
      ],
      [
        ['prices'],
        {
          types: [
            { type: 'Object', counter: 2 },
            { type: 'Boolean', counter: 1 },
          ],
          mixed: true,
          total: 3,
        },
      ],
      [
        ['prices', 'hardcover'],
        {
          types: [{ type: 'Number', counter: 1 }],
          mixed: false,
          total: 1,
        },
      ],
      [
        ['prices', 'ebook'],
        {
          types: [{ type: 'Number', counter: 2 }],
          mixed: false,
          total: 2,
        },
      ],
      [
        ['prices', 'mixed'],
        {
          types: [
            { type: 'String', counter: 1 },
            { type: 'Number', counter: 1 },
          ],
          mixed: true,
          total: 2,
        },
      ],
      [
        ['tags'],
        {
          types: [
            { type: 'Array', counter: 2 },
            { type: 'Boolean', counter: 1 },
          ],
          values: {
            mixed: true,
            total: 4,
            types: [
              { type: 'String', counter: 3 },
              { type: 'Object', counter: 1 },
            ],
          },
          mixed: true,
          total: 3,
        },
      ],
      [
        ['visible'],
        {
          types: [{ type: 'Boolean', counter: 3 }],
          mixed: false,
          total: 3,
        },
      ],
      [
        ['tags', 'id'],
        {
          mixed: false,
          total: 1,
          types: [
            {
              type: 'Number',
              counter: 1,
            },
          ],
        },
      ],
      [
        ['users'],
        {
          types: [{ type: 'Array', counter: 1 }],
          values: {
            mixed: false,
            total: 1,
            types: [{ type: 'Object', counter: 1 }],
          },
          mixed: false,
          total: 1,
        },
      ],
      [
        ['users', 'id'],
        {
          mixed: false,
          total: 1,
          types: [
            {
              type: 'Number',
              counter: 1,
            },
          ],
        },
      ],
      [
        ['users', 'name'],
        {
          mixed: false,
          total: 1,
          types: [
            {
              type: 'String',
              counter: 1,
            },
          ],
        },
      ],
      [
        ['foo'],
        {
          types: [{ type: 'Null', counter: 2 }],
          mixed: false,
          total: 2,
        },
      ],
      [
        ['myId'],
        {
          mixed: false,
          total: 1,
          types: [
            {
              type: 'Number',
              counter: 1,
            },
          ],
        },
      ],
      [
        ['desc'],
        {
          mixed: false,
          total: 1,
          types: [
            {
              type: 'String',
              counter: 1,
            },
          ],
        },
      ],
    ]);
  });

  it('should handle config', () => {
    const aggregator = new AggregatorModel();

    const rec = {
      appId: '',
      apiKey: '',
      indexPrefix: 'test_',
      rateLimit: 16,
      schedule: 'every 1 day',
      renderJavaScript: false,
      startUrls: [
        'http://localhost:8000/test-website/404',
        'http://localhost:8000/test-website/500',
        'http://localhost:8000/test-website/infinite_redirects',
        'http://localhost:8000/test-website/perf?max=10&nb_links=8&current=0&prev=-1',
        'http://localhost:8000/test-website/products?max=30',
        'http://localhost:8000/test-website/blog',
        'http://localhost:8000/test-website/static/others/',
        'http://localhost:8000/test-website/static/others/test-javascript.html',
        'http://localhost:8000/test-website/static/others/canonical-source.html',
        'http://localhost:8000/test-website/static/others/canonical-target.html',
        'http://localhost:8000/test-website/secure/test',
      ],
      sitemaps: [
        'http://localhost:8000/test-website/static/others/sitemap.xml',
        'http://localhost:8000/test-website/static/others/sitemap-index.xml',
      ],
      exclusionPatterns: [
        'http://localhost:8000/test-website/blog/*elasticsearch*',
        'http://localhost:8000/test-website/static/documents/',
      ],
      externalDataSources: [
        {
          dataSourceId: 'myCSV',
          type: 'csv',
          url: 'http://localhost:8000/test-website/website-data.csv',
        },
        {
          dataSourceId: 'pageviewsCSV',
          type: 'csv',
          url: 'http://localhost:8000/test-website/static/others/pageviews.csv',
        },
      ],
      actions: [
        {
          name: 'perf',
          indexName: 'localhost.perf',
          pathsToMatch: ['http://localhost:8000/test-website/perf*'],
          recordExtractor: {
            __type: 'function',
            src: '',
          },
        },
        {
          name: 'products',
          indexName: 'localhost.products',
          pathsToMatch: ['http://localhost:8000/test-website/products/*'],
          recordExtractor: {
            __type: 'function',
            src: '',
          },
        },
        {
          name: 'blog',
          indexName: 'localhost.blog',
          pathsToMatch: ['http://localhost:8000/test-website/blog/*'],
          recordExtractor: {
            __type: 'function',
            src: '',
          },
        },
        {
          name: 'static',
          indexName: 'localhost.static',
          pathsToMatch: [
            'http://localhost:8000/test-website/static/others/*',
            'http://localhost:8000/test-website/secure/test',
          ],
          recordExtractor: {
            __type: 'function',
            src: '',
          },
        },
      ],
      initialIndexSettings: {
        'localhost.products': {
          searchableAttributes: ['title', 'brand'],
          customRanking: ['desc(onsale)'],
          attributesForFaceting: [
            'searchable(brand)',
            'category',
            'onsale',
            'filterOnly(price)',
          ],
        },
        'localhost.blog': {
          searchableAttributes: ['title', 'author'],
          customRanking: ['desc(date)'],
          attributesForFaceting: ['categories', 'author'],
        },
      },
    };
    aggregator.aggr(rec);

    expect(Array.from(aggregator.schema)).toStrictEqual([]);
  });
});
