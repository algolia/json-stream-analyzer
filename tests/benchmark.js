/* eslint-disable import/no-commonjs */

const benchmark = require('benchmark');
const library = require('../dist');

const suite = new benchmark.Suite();

const ADD = 5;

// add tests
suite
  .add('Simple Tag Model', function () {
    const model = new library.models.SimpleTagModel({
      tag: (record) => record.objectID,
    });
    for (let index = 0; index < ADD; index++) {
      model.addToModel({
        objectID: 1,
        title: 'How to build a performant library?',
        prices: {
          hardcover: 52,
          ebook: 10,
        },
        tags: ['foo', 'bar'],
        visible: true,
      });
    }
  })
  .add('Array Tag Model', function () {
    const model = new library.models.ArrayTagModel({
      tag: (record) => record.objectID,
    });
    for (let index = 0; index < ADD; index++) {
      model.addToModel({
        objectID: 1,
        title: 'How to build a performant library?',
        prices: {
          hardcover: 52,
          ebook: 10,
        },
        tags: ['foo', 'bar'],
        visible: true,
      });
    }
  })
  .on('cycle', function (event) {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log(`Fastest is ${this.filter('fastest').map('name')}`);
  })
  // run async
  .run({ async: true });
