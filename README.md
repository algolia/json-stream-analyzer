# json-stream-analyzer

A library to analyze JSON streams and find structural issues in the stream's schema

## Disclaimer

This tool is currently designed for internal use only. There is no guarantee on maintenance, or stability, of the API of the tool. It may change at any point, without warning, and without following proper semver.

## What's in the box

This library converts provides different tools to help you analyze a stream of JSON data, decomposed into four different packages:

- **inference**: A set of tools to convert any arbitrary JSON element into a type model of that element, as well as combine these models into a single one, which is the model of the stream.
- **diagnostics**: A set of tools to identify potential issues within a model. There can be false positives in the diagnostics.
- **aggregation**: A set of tools to aggregate issues by JSON path, type of issues (not avalaible yet), etc.
- **analyzers**: A set of helpers to manipulate JSON streams and find issues, implemented in different processing paradigms (currently available for AsyncIterators and Synchronous execution)

### Inference

#### `convertToSchema`

The inference sub-library exposes a core function called `convertToSchema` which converts a JSON element into it's type model.
The type models are represented by the `SchemaType` class and its descendants:

- **StringType**
- **NumberType**
- **NullType**
- **BooleanType**
- **ArrayType**
- **ObjectType**

and two special descendants:

- **UnionType**: This type represents the case where a JSON element can be of multiple types. These possible types are saved within the UnionType.
- **MissingType**: This type represent the case where a JSON element can be missing from another structure, typically for optional attributes in a JSON Object. It is usually used in conjunction with UnionType.

In addition to that, you can pass a `marker` to `convertToSchema` as a second argument. This marker can be anything you want, e.g. an IP address, an API Key, an ObjectID, etc. and will be stored in the model corresponding to JSON element that converted.

**Important:** Carefully choosing a `marker` for your JSON elements can help you find what is causing the discrepancies in your model, as this `marker` will be **partially** preserved during the analysis. (The partial preservation will be talked in depth in the [combine](./combine) section).

**Examples**:

```js
const { convertToSchema } = require('@algolia/json-stream-analyzer/inference');
let model;

const jsonString = 'hello';
model = convertToSchema(jsonString);
/**
 * model:
 * {
 *   type: 'String',
 *   counter: 1
 * }
 */

const jsonArray = ['hello', 'world'];
model = convertToSchema(jsonArray);
/**
 * model:
 * {
 *   type: 'Array',
 *   counter: 1,
 *   types: {
 *     String: {
 *       type: 'String',
 *       counter: 1
 *     }
 *   }
 * }
 */

const jsonObject = { title: 'some title', pageviews: 132 };
model = convertToSchema(jsonObject);
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 1,
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 1
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 1
 *     }
 *   }
 * }
 */

// with marker
const jsonObject = { title: 'some title', pageviews: 132 };
model = convertToSchema(jsonObject, 'myObjectID');
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 1,
 *   marker: 'myObjectID',
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 1,
 *       marker: 'myObjectID',
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 1,
 *       marker: 'myObjectID',
 *     }
 *   }
 * }
 */
```

#### `combine`

The model obtained using `convertToSchema` is the type representation of a single JSON element of the stream to analyze. It can then be combined with the type representations of other elements of the stream using the `combine` method of the model.

Here is an example with two JSON objects that are similar but one has a `description` field and not the other.

```js
const { convertToSchema } = require('@algolia/json-stream-analyzer/inference');

const jsonObject = {
  title: 'some title',
  pageviews: 132,
};
const model = convertToSchema(jsonObject);
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 1,
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 1
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 1
 *     }
 *   }
 * }
 */

const otherJsonObject = {
  title: 'some title',
  pageviews: 132,
  description: 'some optional description',
};
const otherModel = convertToSchema(otherJsonObject);
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 1,
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 1
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 1
 *     },
 *     description: {
 *       type: 'String',
 *       counter: 1
 *     }
 *   }
 * }
 */

const combinedModel = model.combine(otherModel);
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 2,
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 2
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 2
 *     },
 *     description: {
 *       type: 'Union',
 *       counter: 2,
 *       types: {
 *         Missing: {
 *           type: 'Missing',
 *           counter: 1,
 *         }
 *         String: {
 *           type: 'String',
 *           counter: 1,
 *         }
 *       }
 *     }
 *   }
 * }
 */
```

**Note:** `combine` is a partially destructive operation on `markers`, since we only keep one marker per node of the model. However, `combine` will still guarantee that you have at least one marker for each type that is present at each level in your model.

For instance, if we retake our previous example, but mark each record with a specific marker, we can identify **one** record for each parts of the model, and so we can have information on **one** of the records that have the description field, and **one** of the records that are missing it.

```js
const { convertToSchema } = require('@algolia/json-stream-analyzer/inference');

const jsonObject = {
  title: 'some title',
  pageviews: 132,
};
const model = convertToSchema(jsonObject, 'objectID1');
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 1,
 *   marker: 'objectID1',
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 1,
 *       marker: 'objectID1',
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 1,
 *       marker: 'objectID1',
 *     }
 *   }
 * }
 */

const otherJsonObject = {
  title: 'some title',
  pageviews: 132,
  description: 'some optional description',
};
const otherModel = convertToSchema(otherJsonObject, 'objectID2');
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 1,
 *   marker: 'objectID2',
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 1,
 *       marker: 'objectID2',
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 1,
 *       marker: 'objectID2',
 *     },
 *     description: {
 *       type: 'String',
 *       counter: 1,
 *       marker: 'objectID2',
 *     }
 *   }
 * }
 */

const combinedModel = model.combine(otherModel);
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 2,
 *   marker: 'objectID1',
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 2,
 *       marker: 'objectID1',
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 2,
 *       marker: 'objectID1',
 *     },
 *     description: {
 *       type: 'Union',
 *       counter: 2,
 *       marker: 'objectID2',
 *       types: {
 *         Missing: {
 *           type: 'Missing',
 *           counter: 1,
 *           marker: 'objectID1',
 *         }
 *         String: {
 *           type: 'String',
 *           counter: 1,
 *           marker: 'objectID2',
 *         }
 *       }
 *     }
 *   }
 * }
 */
```

The `UnionType` in this model will therefore have a different marker for each type it encounters, giving you a means of investigating what caused the divergence, if you selected your marker carefully.

#### `asList`

Once you have a model, it is generally easier to process it if it is the form of a list of JSON paths, with some statistics associated with each path. This conversion removes "dumb paths" that have a simple type, and focuses on `ArrayType`, `ObjectType` and `UnionType`.

To convert a model into a list of PathStatistics, just call `model.asList()`.

**Note:** In the case where an attribute can have multiple types, there is a difference between a traditional JSON path and the paths that are generated here. Indeed, `asList()` will be very explicit in its pathing, and will include the type it is considering inside the path. This is done so that you can accurately traverse the model down to the sub-model using that path.

For instance, if you have an optional object called `city`, that has a `geoloc` object, you may find the following JSON path `[ 'city', '(Object)', 'geoloc' ]` in your list of PathStatistics.

**Example:**

```js
const { convertToSchema } = require('@algolia/json-stream-analyzer/inference');

const jsons = [
  {
    title: 'some title',
    pageviews: 132,
  },
  {
    title: 'some title',
    pageviews: 132,
    description: 'some optional description',
  },
];

const model = jsons.map(convertToSchema).reduce((partial, recordModel) => {
  if (!partial) return recordModel;
  return partial.combine(recordModel);
}, null);
/**
 * model:
 * {
 *   type: 'Object',
 *   counter: 2,
 *   schema: {
 *     title: {
 *       type: 'String',
 *       counter: 2
 *     },
 *     pageviews: {
 *       type: 'Number',
 *       counter: 2
 *     },
 *     description: {
 *       type: 'Union',
 *       counter: 2,
 *       types: {
 *         Missing: {
 *           type: 'Missing',
 *           counter: 1,
 *         }
 *         String: {
 *           type: 'String',
 *           counter: 1,
 *         }
 *       }
 *     }
 *   }
 * }
 */

const list = model.asList();
/**
 * list:
 * [
 *   {
 *     path: [],
 *     type: 'Object'
 *     total: 2,
 *     stats: {
 *       title: { counter: 2 },
 *       pageviews: { counter: 2 },
 *       description: { counter: 2 }
 *     },
 *   },
 *   {
 *     path: ['description'],
 *     type: 'Union',
 *     total: 2,
 *     stats: {
 *       Missing: { counter: 1 },
 *       String: { counter: 1 }
 *     }
 *   },
 * ]
 */
```

### diagnostics

The diagnostics sub-library exposes a core function called `diagnose` which converts a list of `PathStatistics` into a list of `Diagnostic`.

A Diagnostic is an identified issue within the model, and we currently detect the following range of issues:

- **Missing Data**: the JSON element this data represents was not present in all the records that have been analyzed into the model.
- **Empty Array**: the model includes a JSON array that was empty for at least some of the records.
- **Inconsistent Type**: the JSON element this data represents can have multiple non-missing types. We consider that the `mode` of the types is the norm and return an issue for all the other types found.
- **Polymorphic Array**: we found at least one JSON array that had multiple types within itself, or multiple arrays of different single types. This usually means that an incorrect data structure is being used that may lack some semantics, or that there is an implementation bug.
- **Numerical key on Object**: We found a representation of a JSON Object that included numbers as keys. This can be perfectly valid (a map of ids), but can also be due to an implementation bug (like spreading of a string into an object).

**Example:**

```js
/* setup */
const { convertToSchema } = require('@algolia/json-stream-analyzer/inference');

const jsons = [
  { id: 12, opt: 13 },
  { id: 1, opt: '42' },
  { id: 12, opt: 64 },
  { id: 16 },
];

const model = jsons.map(convertToSchema).reduce((partial, recordModel) => {
  if (!partial) return recordModel;
  return partial.combine(recordModel);
}, null);

/* diagnostics */
const { diagnose } = require('@algolia/json-stream-analyzer/diagnostics');
const diagnostics = diagnose(model.asList());
/**
 * diagnostics:
 * [
 *   {
 *     id: 'missing',
 *     title: 'Missing Data',
 *     type: 'Union',
 *     path: ['opt'],
 *     affected: 1,
 *   },
 *   {
 *     id: 'inconsistentType',
 *     title: 'Inconsistent Type (String instead of Number)',
 *     type: 'Union',
 *     path: ['opt'],
 *     affected: 1,
 *   },
 * ]
 */
```

### aggregation

The aggregation sub-library exposes a list of functions to group diagnostics by certain attributes, like path, or id, as it often makes sense to understand all the issues associated with a single JSON path, or inversely, to find all the paths that are affected by an issue.

This library currently only support grouping by path, with the function `aggregateByPath`.

**Note:** as explained above, the paths generated by `model.asList()` are not pure JSON paths and may include type information. This is not something that is wanted when grouping by path as we want to be as close to the standard JSON path as possible. Therefore, reusing the city Object example, this JSON path `[ 'city', '(Object)', 'geolocation' ]` is converted into `[ 'city', 'geolocation' ]` for grouping purposes.

**Example:**

```js
/* setup: inference */
const { convertToSchema } = require('@algolia/json-stream-analyzer/inference');

const jsons = [
  { id: 1, optDesc: 'some optional description' },
  {
    id: 2,
    optArray: [
      {
        description:
          'an array that can be empty or missing, and so can this description',
        value: 12,
      },
    ],
  },
  { id: 3, optArray: [] },
  { id: 4, optArray: [{ value: 42 }] },
];

const model = jsons.map(convertToSchema).reduce((partial, recordModel) => {
  if (!partial) return recordModel;
  return partial.combine(recordModel);
}, null);

/* setup: diagnostics */
const { diagnose } = require('@algolia/json-stream-analyzer/diagnostics');
const diagnostics = diagnose(model.asList());

/* aggregation */
const {
  aggregateByPath,
} = require('@algolia/json-stream-analyzer/aggregation');
const aggregates = aggregateByPath(diagnostics, model);
/**
 * [
 *   {
 *     path: ['optArray'],
 *     issues: [
 *       {
 *         id: 'missing',
 *         title: 'Missing Data',
 *         type: 'Union',
 *         path: ['optArray'],
 *         affected: 1,
 *       },
 *       {
 *         id: 'emptyArray',
 *         title: 'Empty Array',
 *         type: 'Array',
 *         path: ['optArray', '(Array)'],
 *         affected: 1,
 *       },
 *     ],
 *     nbIssues: 2,
 *     totalAffected: 2,
 *     total: 4,
 *   },
 *   {
 *     path: ['optArray', '[]', 'description'],
 *     issues: [
 *       {
 *         id: 'missing',
 *         title: 'Missing Data',
 *         type: 'Union',
 *         path: ['optArray', '(Array)', '[Object]', 'description'],
 *         affected: 1,
 *       },
 *     ],
 *     nbIssues: 1,
 *     totalAffected: 1,
 *     total: 2,
 *   },
 *   {
 *     path: ['optDesc'],
 *     issues: [
 *       {
 *         id: 'missing',
 *         title: 'Missing Data',
 *         type: 'Union',
 *         path: ['optDesc'],
 *         affected: 3,
 *       },
 *     ],
 *     nbIssues: 1,
 *     totalAffected: 3,
 *     total: 4,
 *   },
 * ]
 */
```

### analyzers

The analyzers sub-library exposes a list of helpers that can process streams or batches of JSON elements, extracts diagnostics and groups them by paths.

We currently offer two helpers:

- **SyncAnalyzer**: A simple analyzer that processes batches of JSON elements in a synchronous fashion
- **AsyncIterator**: A asynchronous analyzer that can process JSON elements as they arrive, relying on AsyncIterators, also known as async generators.

**Example:**

```js
const { SyncAnalyzer } = require('@algolia/json-stream-analyzer/analyzers');

const analyzer = new SyncAnalyzer({
  tag: input => input.id,
});
analyzer.pushToModel([
  { id: 1, optDesc: 'some optional description' },
  {
    id: 2,
    optArray: [
      {
        description:
          'an array that can be empty or missing, and so can this description',
        value: 12,
      },
    ],
  },
  { id: 3, optArray: [] },
  { id: 4, optArray: [{ value: 42 }] },
]);

const analysis = analyzer.diagnose();
/**
 * {
 *   processed: { count: 4 },
 *   issues: [
 *     {
 *       path: ['optDesc'],
 *       issues: [
 *         {
 *           id: 'missing',
 *           title: 'Missing Data',
 *           type: 'Union',
 *           path: ['optDesc'],
 *           affected: 3,
 *           marker: '2',
 *         },
 *       ],
 *       nbIssues: 1,
 *       totalAffected: 3,
 *       total: 4,
 *     },
 *     {
 *       path: ['optArray'],
 *       issues: [
 *         {
 *           id: 'missing',
 *           title: 'Missing Data',
 *           type: 'Union',
 *           path: ['optArray'],
 *           affected: 1,
 *           marker: '1',
 *         },
 *         {
 *           id: 'emptyArray',
 *           title: 'Empty Array',
 *           type: 'Array',
 *           path: ['optArray', '(Array)'],
 *           affected: 1,
 *           marker: '3',
 *         },
 *       ],
 *       nbIssues: 2,
 *       totalAffected: 2,
 *       total: 4,
 *     },
 *     {
 *       path: ['optArray', '[]', 'description'],
 *       issues: [
 *         {
 *           id: 'missing',
 *           title: 'Missing Data',
 *           type: 'Union',
 *           path: ['optArray', '(Array)', '[Object]', 'description'],
 *           affected: 1,
 *           marker: '4',
 *         },
 *       ],
 *       nbIssues: 1,
 *       totalAffected: 1,
 *       total: 2,
 *     },
 *   ],
 *   model: {...}
 * }
 */
```
