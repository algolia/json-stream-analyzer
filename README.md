# json-stream-analyzer

A library to analyze JSON streams and find structural issues in the stream's schema

## Disclaimer

This tool is currently designed for internal use only. There is no guarantee on maintenance, or stability, of the API of the tool. It may change at any point, without warning, and without following proper semver.

## Standard usage
```js
import { SimpleTagModel } from '@algolia/json-stream-analyzer/models';

// this will build a model that can keep track of the schema of a stream 
// and keep one tag for each diverging element of the schema
const model = new SimpleTagModel({
  tag: (record) => record.objectID
});

const records = [
  {
    objectID: 1,
    title: 'How to build a performant library?',
    prices: {
      hardcover: 52,
      ebook: 10,
    },
  },
  {
    objectID: 3,
    title: 'Mastering the art of example in 12 steps',
    description:
      'The description and prices.hardcover fields are missing in some records and prices.ebook has multiple types',
    prices: {
      ebook: '10$',
    },
  },
];

// feed the records to the model
records.forEach(model.addToModel);

// get the schema of the model
console.log(JSON.stringify(model.schema, null, 2));
/*
{
  "counter": 2,
  "tag": 1,
  "type": "Object",
  "schema": {
    "objectID": {
      "counter": 2,
      "tag": 1,
      "type": "Number"
    },
    "title": {
      "counter": 2,
      "tag": 1,
      "type": "String"
    },
    "description": {
      "counter": 2,
      "type": "Union",
      "types": {
        "Missing": {
          "counter": 1,
          "tag": 1,
          "type": "Missing"
        },
        "String": {
          "counter": 1,
          "tag": 3,
          "type": "String"
        }
      }
    },
    "prices": {
      "counter": 2,
      "tag": 1,
      "type": "Object",
      "schema": {
        "ebook": {
          "counter": 2,
          "type": "Union",
          "types": {
            "Number": {
              "counter": 1,
              "tag": 1,
              "type": "Number"
            },
            "String": {
              "counter": 1,
              "tag": 3,
              "type": "String"
            }
          }
        },
        "hardcover": {
          "counter": 2,
          "type": "Union",
          "types": {
            "Number": {
              "counter": 1,
              "tag": 1,
              "type": "Number"
            },
            "Missing": {
              "counter": 1,
              "tag": 3,
              "type": "Missing"
            }
          }
        }
      }
    }
  }
}
*/

// immediately find issues within the schema
const diagnostics = model.diagnose();
/*
[
  {
    id: 'missing',
    title: 'Missing Data',
    type: 'Union',
    path: [ 'description' ],
    affected: 1,
    tag: 1
  },
  {
    id: 'healthy',
    title: 'Healthy Records',
    type: 'Union',
    path: [ 'description' ],
    affected: 1,
    tag: 3
  },
  {
    id: 'inconsistentType',
    title: 'Inconsistent Type (String instead of Number)',
    type: 'Union',
    path: [ 'prices', 'ebook' ],
    affected: 1,
    tag: 3
  },
  {
    id: 'healthy',
    title: 'Healthy Records',
    type: 'Union',
    path: [ 'prices', 'ebook' ],
    affected: 1,
    tag: 1
  },
  {
    id: 'missing',
    title: 'Missing Data',
    type: 'Union',
    path: [ 'prices', 'hardcover' ],
    affected: 1,
    tag: 3
  },
  {
    id: 'healthy',
    title: 'Healthy Records',
    type: 'Union',
    path: [ 'prices', 'hardcover' ],
    affected: 1,
    tag: 1
  }
]
*/

// find issues within record based on a schema
model.diagnoseRecord({
  objectID: 1,
  title: 'How to build a performant library?',
  prices: {
    hardcover: 52,
    ebook: 10,
  },
});
/*
[
  {
    id: 'missing',
    title: 'Missing Data',
    type: 'Union',
    path: [ 'description' ],
    affected: 2,
    tag: 1
  }
]
*/
```
test
