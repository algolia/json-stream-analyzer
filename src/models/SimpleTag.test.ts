import { SimpleTagModel } from './SimpleTag';

describe('SimpleTag', () => {
  it('should aggregate multiple json', () => {
    const model = new SimpleTagModel({
      tag: (rec) => {
        return rec.objectID;
      },
    });

    model.addToModel({
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
    model.addToModel({
      objectID: 2,
      title: 'Lorem ipsum',
      prices: {
        ebook: 10,
        mixed: 9,
      },
      tags: ['foobar'],
      visible: false,
      foo: null,
    });

    expect(model.schema).toStrictEqual({});
  });

  it('should aggregate json and primite', () => {
    const model = new SimpleTagModel({
      tag: (rec) => {
        return rec && rec.objectID ? rec.objectID : '';
      },
    });

    model.addToModel(true);
    model.addToModel({
      objectID: 2,
      title: 'Lorem ipsum',
      prices: {
        ebook: 10,
        mixed: 9,
      },
      tags: ['foobar'],
      visible: false,
      foo: null,
      users: [{ id: 1, name: 'Foo' }],
    });
    model.addToModel(true);
    model.addToModel([{ id: 1, name: 'Foo' }]);
    model.addToModel(null);

    expect(model.schema).toStrictEqual({});
  });
});
