import { getWebCRUD } from '../dexie';
import getOfflineClient from '../index';

jest.mock('dexie');

global.localStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
};

const store = jest.fn().mockImplementation(() => ({
  getState: () => {
    return {
      app: {
        mode: 'offline',
      },
    };
  },
  dispatch: jest.fn(),
}));

class ClientAPI {
  constructor() {
    this.add = this.add.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.fetch = this.fetch.bind(this);
  }
  add() { return jest.fn(); }
  update() { return jest.fn(); }
  remove() { return jest.fn(); }
  fetch() { return jest.fn(); }
}

describe('Test Client Methods in Offline Mode', () => {
  let client = null;

  beforeAll(() => {
    client = new (getOfflineClient(ClientAPI, {
      name: 'customer',
      fields: ['id', 'name'],
    }, { mode: 'web' }, store))();

    const { init, adds } = getWebCRUD('customer');
    return init()
    .then(() => adds([
      { id: 1, name: 'John Smith' },
      { id: 2, name: 'Aiden Markram' },
      { id: 3, name: 'Faf Markram' },
    ]));
  });

  test('should fetch particular record', () => {
    return client.fetch({
      row_id: 1,
    })
    .then(res => {
      expect(res.data).toBeDefined();
      expect(res.data[0]).toBeDefined();
      expect(res.data[0].id).toBe(1);
    });
  });

  test('should search all records with fields, limit, offset', () => {
    const searchPromises = [];
    let searchOptions = {
      search: {
        fields: ['name'],
        operator: 'like',
        value: 'Markram'
      },
    };

    searchPromises.push(
      client.search(searchOptions)
      .then(res => {
        expect(res.data).toBeDefined();
        expect(res.total).toBeDefined();
        expect(res.data.length).toBe(2);
        expect(res.total).toBe(2);
      })
    );

    const searchOptions2 = Object.assign({}, searchOptions, {
      offset: 1,
      limit: 1,
    });

    searchPromises.push(
      client.search(searchOptions2)
      .then(res => {
        expect(res.data.length).toBe(1);
        expect(res.total).toBe(2);
      })
    );

    return Promise.all(searchPromises);
  });

  test('should add record in offline store', () => {
    return client.search()
    .then(({ data: records }) => {
      const oldRecords = [...records];
      return client
      .add({ id: 4, name: 'JP Duminy' })
      .then(() => client.search())
      .then(({ data: newRecords }) => {
        expect(newRecords.length).toBeGreaterThan(oldRecords.length);
        const lastRecord = newRecords[newRecords.length-1];
        expect(lastRecord.is_offline).toBeDefined();
        expect(lastRecord.is_offline).toBe(1);
      })
    });
  });

  test('should update record in offline store', () => {
    return client
    .add({ id: 5, name: 'David John' })
    .then(({ data: [record] = [{}] }) => {
      return client.update({...record, name: 'John Smith'})
      .then(() => client.fetch(record))
      .then(({ data: [updatedRecord] = [{}] }) => {
        expect(updatedRecord.name).toBe('John Smith');
      });
    });
  });

  test('should delete record in offline store', () => {
    return client
    .add({ id: 6, name: 'Andrew Tye' })
    .then(({ data: [record] = [{}] }) => {
      const names = ['Andrew Tye'];
      return client.search()
      .then(({ data: records }) => {
        expect(records.map(e => e.name)).toEqual(expect.arrayContaining(names));
      })
      .then(() => client.remove({ ...record }))
      .then(() => client.search())
      .then(({ data: records }) => {
        expect(records.map(e => e.name)).not.toEqual(expect.arrayContaining(names));
      });
    });
  });

});
