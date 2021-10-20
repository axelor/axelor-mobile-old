import searchFilter from '../filter';
import moment from 'moment';

moment.createFromInputFallback = function(config) {
  config._d = new Date(config._i);
};

describe('Test Offline Search Criteria', () => {

  test('should return true if search options are undefined', () => {
    expect(searchFilter(undefined, {})).toBeTruthy();
  });

  test('should return true if fields are empty', () => {
    expect(searchFilter({ fields: [] }, {})).toBeTruthy();
  });

  describe('Test Operators', () => {

    test('should filter using operator like', () => {
      const Criteria = { fields: ['name'], operator: 'like', value: 'abc' };

      let record = { name: 'Abc' };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'xxaBcdef' };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'qwert' };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter using operator in', () => {
      const Criteria = { fields: ['id'], operator: 'in', value: [1, 2] };
      let records = [
        { id: 1, name: 'Abc', age: 10 },
        { id: 2, name: 'Mno', age: 20 },
        { id: 3, name: 'Pqr', age: 15 },
        { id: 4, name: 'Xyz', age: 10 },
      ];
      expect(
        records
        .filter(record => searchFilter(Criteria, record))
        .map(e => e.id)
      ).toEqual([1, 2]);
    });

    test('should filter using operator notIn', () => {
      const Criteria = { fields: ['id'], operator: 'notIn', value: [1, 2] };
      let records = [
        { id: 1, name: 'Abc', age: 10 },
        { id: 2, name: 'Mno', age: 20 },
        { id: 3, name: 'Pqr', age: 15 },
        { id: 4, name: 'Xyz', age: 10 },
      ];
      expect(
        records
        .filter(record => searchFilter(Criteria, record))
        .map(e => e.id)
      ).toEqual([3, 4]);
    });

    test('should filter using operator =', () => {
      const Criteria = { fields: ['name'], operator: '=', value: 'abc' };

      let record = { name: 'abc' };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'xxaBcdef' };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter using operator !=', () => {
      const Criteria = { fields: ['name'], operator: '!=', value: 'abc' };

      let record = { name: 'abc' };
      expect(searchFilter(Criteria, record)).toBeFalsy();

      record = { name: 'xxaBcdef' };
      expect(searchFilter(Criteria, record)).toBeTruthy();
    });

    test('should filter using operator <=', () => {
      const Criteria = { fields: ['age'], operator: '<=', value: 30 };

      let record = { name: 'abc', age: 20 };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'abc', age: 31 };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter using operator <', () => {
      const Criteria = { fields: ['age'], operator: '<', value: 30 };

      let record = { name: 'abc', age: 20 };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'abc', age: 30 };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter using operator >=', () => {
      const Criteria = { fields: ['age'], operator: '>=', value: 30 };

      let record = { name: 'abc', age: 20 };
      expect(searchFilter(Criteria, record)).toBeFalsy();

      record = { name: 'abc', age: 30 };
      expect(searchFilter(Criteria, record)).toBeTruthy();
    });

    test('should filter using operator >', () => {
      const Criteria = { fields: ['age'], operator: '>', value: 30 };

      let record = { name: 'abc', age: 20 };
      expect(searchFilter(Criteria, record)).toBeFalsy();

      record = { name: 'abc', age: 31 };
      expect(searchFilter(Criteria, record)).toBeTruthy();
    });
  });

  describe('Test Operators with date fields', () => {

    test('should filter using operator =', () => {
      const Criteria = {
        fields: [{
          fieldName: 'dob',
          fieldType: 'date',
          operator: '=',
          value: '12 December 1999',
        }],
        operator: 'or',
      };
      const records = [
        { name: 'abc', dob: '1999-12-12T00:00:00Z' },
        { name: 'mno', dob: '1999-12-11T00:00:00Z' },
        { name: 'pqr', dob: '1999-11-12T00:00:00Z' },
        { name: 'xyz', dob: '1999-12-12T00:00:00Z' },
      ];
      expect(
        records.filter(record => searchFilter(Criteria, record)).length
      ).toBe(2);
    });

    test('should filter using operator > and >=', () => {
      const Criteria = {
        fields: [{
          fieldName: 'dob',
          fieldType: 'date',
          operator: '>=',
          value: '01 Jan 2000',
        }],
        operator: 'or',
      };
      const records = [
        { name: 'abc', dob: '1999-12-12' },
        { name: 'mno', dob: '2000-01-01' }, // true
        { name: 'pqr', dob: '2000-12-12T00:00:00Z' }, // true
        { name: 'xyz', dob: '2005-01-01T00:00:00Z' }, // true
        { name: 'pqr', dob: '1990-12-12T00:00:00Z' },
      ];
      expect(
        records.filter(record => searchFilter(Criteria, record)).length
      ).toBe(3);

      Criteria.fields[0].operator = '>';

      expect(
        records.filter(record => searchFilter(Criteria, record)).length
      ).toBe(2);
    });

    test('should filter using operator < and <=', () => {
      const Criteria = {
        fields: [{
          fieldName: 'dob',
          fieldType: 'date',
          operator: '<=',
          value: '01 Jan 2000',
        }],
        operator: 'or',
      };
      const records = [
        { name: 'abc', dob: '1999-12-12' }, // true
        { name: 'mno', dob: '2000-01-01' },
        { name: 'pqr', dob: '2000-12-12T00:00:00Z' },
        { name: 'xyz', dob: '2005-01-01T00:00:00Z' },
        { name: 'pqr', dob: '1990-12-12T00:00:00Z' }, // true
      ];
      expect(
        records.filter(record => searchFilter(Criteria, record)).length
      ).toBe(3);

      Criteria.fields[0].operator = '<';

      expect(
        records.filter(record => searchFilter(Criteria, record)).length
      ).toBe(2);
    });
  });

  describe('Test Fields String/Objects', () => {
    test('should filter single field criteria', () => {
      const Criteria = { fields: ['name'], operator: 'like', value: 'abc' };

      let record = { name: 'Abc' };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'Xyz' };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter multiple fields criteria', () => {
      const Criteria = { fields: ['name', 'age'], operator: '=', value: '10' };

      let record = { name: 'Abc', age: 10 };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'Xyz', age: 11 };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter single object field criteria', () => {
      const Criteria = { fields: [{ fieldName: 'name', operator: 'like', value: 'abc' }], operator: 'or' };

      let record = { name: 'Abc' };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'Xyz' };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });

    test('should filter multiple object field criteria', () => {
      const Criteria = {
        fields: [
          { fieldName: 'name', operator: 'like', value: 'abc' },
          { fieldName: 'age', operator: '=', value: 10 },
        ],
        operator: 'or',
      };

      let records = [
        { name: 'Abc', age: 10 }, // true, name like abc
        { name: 'abcdefgh', age: 20 }, // true, name like abc
        { name: 'Pqr', age: 15 },
        { name: 'Xyz', age: 10 }, // true, age = 10
      ];

      expect(records.filter(record => searchFilter(Criteria, record)).length).toBe(3);
    });

    test('should filter nested field property', () => {
      const Criteria = { fields: ['project.name'], operator: 'like', value: 'react' };

      let record = { name: 'Abc', project: { name: 'React Js'} };
      expect(searchFilter(Criteria, record)).toBeTruthy();

      record = { name: 'Xyz', project: { name: 'Angular Js'} };
      expect(searchFilter(Criteria, record)).toBeFalsy();
    });
  });

  describe('Test Nested Criteria', () => {

    test('should filter using logical OR condition', () => {
      const Criteria = {
        fields: [
          {
            fields: [
              { fieldName: 'name', operator: 'like', value: 'abc' },
              { fieldName: 'age', operator: '=', value: '10' }
            ],
            operator: 'or'
          },
          {
            fields: [
              { fieldName: 'name', operator: 'like', value: 'pqr' },
              { fieldName: 'age', operator: '=', value: '10' }
            ],
            operator: 'or'
          },
        ],
        operator: 'or'
      };

      const records = [
        { name: 'abc', age: 12 }, // match first criteria name like abc
        { name: 'pqr', age: 12 }, // match second criteria name like pqr
        { name: 'mno', age: 10 }, // match first/second criteria with age = 10
        { name: 'xyz', age: 15 },
      ];

      expect(records.filter(record => searchFilter(Criteria, record)).length).toBe(3);

      Criteria.operator = 'and';

      expect(records.filter(record => searchFilter(Criteria, record)).length).toBe(1);
    });

    test('should filter using logical AND condition', () => {
      const Criteria = {
        fields: [
          {
            fields: [
              { fieldName: 'name', operator: 'like', value: 'abc' },
              { fieldName: 'age', operator: '=', value: '10' }
            ],
            operator: 'and'
          },
          {
            fields: [
              { fieldName: 'name', operator: 'like', value: 'pqr' },
              { fieldName: 'age', operator: '=', value: '10' }
            ],
            operator: 'and'
          },
        ],
        operator: 'or'
      };

      const records = [
        { name: 'abc', age: 10 }, // match first criteria name like abc and age = 10
        { name: 'pqr', age: 10 }, // match second criteria name like pqr and age = 10
        { name: 'abc', age: 12 },
        { name: 'xyz', age: 15 },
      ];

      expect(records.filter(record => searchFilter(Criteria, record)).length).toBe(2);
    });

  });

});
