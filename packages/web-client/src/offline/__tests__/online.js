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
        mode: 'online',
      },
    };
  },
  dispatch: jest.fn(),
}));

window.fetch = (options) => {
  console.log('mock fetch', options);
  return Promise.resolve(new window.Response('{}', {
    status: 200,
    statusText: 'ok',
    headers: {
      'Content-Type': 'application/json',
    },
  }));
}

let autoId = 1;

const ClientAPIMocks = {
  add: jest.fn().mockImplementation((record) => {
    return Promise.resolve({ data: [{ ...record, id: autoId++, version: 0 }], status: 0 });
  }),
  update: jest.fn().mockImplementation((record) => {
    return Promise.resolve({ data: [{ ...record, version: (record.version||0) + 1 }], status: 0 });
  }),
  remove: jest.fn().mockImplementation((record) => {
    return Promise.resolve({ data: [{ ...record }], status: 0 });
  }),
  fetch: jest.fn().mockImplementation((record) => {
    return Promise.resolve({ data: [{ ...record }], status: 0 });
  }),
}

class ClientAPI {
  constructor() {
    this.add = this.add.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.fetch = this.fetch.bind(this);
  }
  add(record) { return ClientAPIMocks.add(record);  }
  update(record) { return ClientAPIMocks.update(record); }
  remove(record) { return ClientAPIMocks.remove(record); }
  fetch(record) { return ClientAPIMocks.fetch(record); }
}

describe('Test Client Methods in Online Mode', () => {
  let client = null;

  beforeAll(() => {
    client = new (getOfflineClient(ClientAPI, {
      name: 'customer',
      refs: [
        { field: 'address_list', model: 'address'  }
      ],
      props: {
        refs: {
          address: new (getOfflineClient(ClientAPI, { name: 'address' }, { mode: 'web' }, store))(),
        },
      }
    }, { mode: 'web' }, store))();
  });

  beforeEach(() => {
    ClientAPIMocks.add.mockClear();
    ClientAPIMocks.update.mockClear();
    ClientAPIMocks.remove.mockClear();
    ClientAPIMocks.fetch.mockClear();
  });

  test('should add new record', () => {
    return client.add({ name: 'Abc' })
    .then(res => {
      expect(ClientAPIMocks.add.mock.calls.length).toBe(1);
    });
  });

  test('should update new record', () => {
    return client.add({ name: 'Abc' })
    .then(({ data: [insertedRecord] }) => client.update({ ...insertedRecord, age: 23 }))
    .then(({ data: [updatedRecord]}) => {
      expect(ClientAPIMocks.update.mock.calls.length).toBe(1);
      return client.fetch(updatedRecord)
      .then(({ data: [fetchedRecord]}) => {
        expect(ClientAPIMocks.fetch.mock.calls.length).toBe(1);
        expect(fetchedRecord.age).toBe(23);
      });
    });
  });

  test('should remove record', () => {
    return client.add({ name: 'Abc' })
    .then(({ data: [insertedRecord] }) => client.remove({ ...insertedRecord }))
    .then(res => {
      expect(ClientAPIMocks.remove.mock.calls.length).toBe(1);
    });
  });

  // test.only('should sync nested records', () => {
  //   const { init, adds, select } = getWebCRUD('address');
  //   init()
  //   .then(() => adds([
  //     { location: 'France' },
  //     { location: 'India' },
  //   ]))
  //   .then(() => select())
  //   .then((address_list) => {
  //     const record = {
  //       name: 'John Smith',
  //       address_list,
  //     };
  //     client.add(record)
  //     .then(() => {
  //         console.log(ClientAPIMocks.add.mock.calls);
  //     })
  //   });


  // });
});
