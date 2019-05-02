interface SchemaObject { [key: string]: SchemaType };

export class SchemaType {
  type: string;
  marker?: string;
  counter: number;

  constructor(counter = 1, marker?: string) {
    this.counter = counter;
    this.marker = marker;
    this.type = 'unknownType';
  }

  combine = (other: SchemaType, counter?: number) => {
    if (other.type == this.type) {
      // @ts-ignore
      const result = new other.constructor(counter || (this.counter + other.counter), this.marker);
      return result;
    }

    const union = new UnionType();
    return union.combine(this, counter).combine(other, counter);
  }

  convert = (content: any, marker?: string): SchemaType => {
    if (typeof content === 'number') {
      return new NumberType(1, marker);
    }

    if (typeof content === 'boolean') {
      return new BooleanType(1, marker);
    }

    if (typeof content === 'string') {
      return new StringType(1, marker);
    }

    if (content === null) {
      return new NullType(1, marker);
    }

    if (Array.isArray(content)) {
      let types;
      
      if (!content.length) {
        types = { Missing: new MissingType(1, marker) }
      }
      else {
        types = content
          .reduce((partial, item) => {
            const schema = this.convert(item, marker);
            if (partial[schema.type]) {
              partial[schema.type] = partial[schema.type].combine(schema, 1)
            }
            else {
              partial[schema.type] = schema
            }
  
            return partial;
          }, {});
      }
      return new ArrayType(1, marker, types);
    }

    const schema: SchemaObject = Object.entries(content)
      .reduce((schemas: SchemaObject, [key, subContent]) => {
        schemas[key] = this.convert(subContent, marker);
        return schemas;
      }, {});    
    return new ObjectType(1, marker, schema);
  }

  copy = () => {
    // @ts-ignore
    return new this.constructor(this.counter, this.marker);
  }
}

export class StringType extends SchemaType {
  constructor(counter = 1, marker?: string) {
    super(counter, marker);
    this.type = 'String';
  }
}

export class BooleanType extends SchemaType {
  constructor(counter = 1, marker?: string) {
    super(counter, marker);
    this.type = 'Boolean';
  }
}

export class NumberType extends SchemaType {
  constructor(counter = 1, marker?: string) {
    super(counter, marker);
    this.type = 'Number';
  }
}

export class NullType extends SchemaType {
  constructor(counter = 1, marker?: string) {
    super(counter, marker);
    this.type = 'Null';
  }
}

export class MissingType extends SchemaType {
  constructor(counter = 1, marker?: string) {
    super(counter, marker);
    this.type = 'Missing';
  }
}

export class ObjectType extends SchemaType {
  schema: SchemaObject;

  constructor(counter = 1, marker?: string, schema: { [key: string]: SchemaType } = {}) {
    super(counter, marker);
    this.type = 'Object';
    this.schema = schema;
  }

  copy = () => {
    const result = new ObjectType(this.counter, this.marker);
    result.schema = Object.entries(this.schema)
      .reduce((partial: SchemaObject, [key, schema]) => {
        partial[key] = schema.copy();
        return partial;
      }, {});
    
    return result;
  }

  combine = (other: SchemaType, counter?: number): UnionType | ObjectType => {
    if (other.type !== 'Object') {
      return (new UnionType()).combine(this, counter).combine(other, counter);
    }

    let combinedSchema = Object.entries((other as ObjectType).schema)
      .reduce((partial: SchemaObject, [key, schema]) => {
        if (!this.schema[key]) {
          const missing = new MissingType(this.counter, this.marker);
          partial[key] = (new UnionType()).combine(missing, counter).combine(schema, counter)
        }
        else {
          partial[key] = this.schema[key].combine(schema, counter)
        }

        return partial;
      }, {});

    combinedSchema = Object.entries(this.schema)
      .reduce((partial: SchemaObject, [key, schema]) => {
        if (!(other as ObjectType).schema[key]) {
          const missing = new MissingType(other.counter, other.marker);
          partial[key] = (new UnionType()).combine(missing, counter).combine(schema, counter)
        }

        return partial;
      }, combinedSchema)

    const combinedCounter = counter || (this.counter + other.counter);
    // @ts-ignore
    return new this.constructor(combinedCounter, this.marker, combinedSchema);
  }
}

export class ArrayType extends SchemaType {
  types: SchemaObject;

  constructor(counter = 1, marker?: string, types: { [type: string]: SchemaType } = {}) {
    super(counter, marker);
    this.type = 'Array';
    this.types = types;
  }

  copy = () => {
    const result = new ArrayType(this.counter, this.marker);
    result.types = Object.entries(this.types)
      .reduce((partial: SchemaObject, [key, schema]) => {
        partial[key] = schema.copy();
        return partial;
      }, {});
    
    return result;
  }

  combine = (other: SchemaType, counter?: number): UnionType | ArrayType => {
    if (other.type !== 'Array') {
      return (new UnionType()).combine(this, counter).combine(other, counter);
    }

    let combinedTypes = Object.entries(this.types)
      .reduce((partial: SchemaObject, [type, schema]) => {
        partial[type] = schema.copy();
        return partial;
      }, {});

    combinedTypes = Object.entries((other as ArrayType).types)
      .reduce((partial: SchemaObject, [type, schema]) => {
        if (partial[type]) {
          partial[type] = partial[type].combine(schema, counter);
        }
        else {
          partial[type] = schema;
        }

        return partial;
      }, combinedTypes);

    const combinedCounter = counter || (this.counter + other.counter);
    // @ts-ignore
    return new this.constructor(combinedCounter, this.marker, combinedTypes);
  }
}

export class UnionType extends SchemaType {
  types: SchemaObject;

  constructor(counter = 0, types = {}) {
    super(counter);
    this.type = 'Union';
    this.types = types;
  }

  copy = () => {
    const result = new UnionType();

    result.counter = this.counter;
    result.types = Object.entries(this.types)
      .reduce((partial: SchemaObject, [key, schema]) => {
        partial[key] = schema.copy();
        return partial;
      }, {});
    
    return result;
  }

  combine = (other: SchemaType, counter?: number): UnionType => {
    let combinedTypes: SchemaObject = Object.entries(this.types).reduce((copy: SchemaObject, [type, schema]) => {
      copy[type] = schema.copy();
      return copy;
    },{});

    if (other.type == 'Union') {
      combinedTypes = Object.entries((other as UnionType).types).reduce((types: SchemaObject, [type, schema]) => {
        if (types[type]) {
          types[type] = types[type].combine(schema, counter);
        }
        else {
          types[type] = schema.copy();
        }
        return types;
      }, combinedTypes);
    }
    else if (this.types[other.type]) {
      combinedTypes[other.type] = this.types[other.type].combine(other, counter);
    }
    else {
      combinedTypes[other.type] = other.copy();
    }

    const combinedCounter = counter || (this.counter + other.counter);
    // @ts-ignore
    return new this.constructor(combinedCounter, combinedTypes);
  }
}

const convertToSchema = (new SchemaType()).convert;

export default convertToSchema;
