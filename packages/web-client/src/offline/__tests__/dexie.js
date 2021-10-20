// Require the mock.
import getClient, { getWebCRUD } from '../dexie';
// import getOfflineClient from '@axelor/web-client/offline';

jest.mock('dexie');
jest.useRealTimers();

global.localStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
};

// let tt = 0;

// global.Date = {
//   now: jest.fn(() => tt++),
// };

const LRU_SIZE = 100;
let db = null;

beforeEach(() => {
  db = getClient();
});

describe('Test Indexedb based Dexie.js Client', () => {
  const { init, add, adds, fetch, update, remove, removeAll, select } = getWebCRUD('customer');

  test('should init store', () => {
    return init()
    .then(() => expect(db.isOpen).toBeTruthy());
  });

  test('should insert record into table', () => {
    return init()
    .then(() => add({ id: 1 }))
    .then((result) => {
      expect(result).toBeGreaterThan(0);
    });
  });

  test('should update record into table', () => {
    return init()
    .then(() => add({ id: 2 }))
    .then((insertId) => {
      return update({
        id: 2,
        name: 'Test',
        row_id: insertId,
      })
      .then(() => fetch(insertId));
    })
    .then((record) => expect(record.name).toBe('Test'));
  });


  test('should remove record from table', () => {
    return init()
    .then(() => add({ id: 3 }))
    .then((row_id) => {
      return remove({ row_id })
      .then(() => select())
      .then((records) => expect(records.find(e => e.row_id === row_id)).toBeFalsy())
    });
  });

  test('should maintain cache using LRU', () => {
    const customers = (no) => Array(20).fill(0).map((e, i) => ({ id: i + no, name: `Customer${i + no}` }));
    return init()
    .then(() => adds(customers(0)))
    .then(() => adds(customers(20)))
    .then(() => adds(customers(40)))
    .then(() => adds(customers(60)))
    .then(() => adds(customers(80)))
    .then(() => adds(customers(100)))
    .then(() => adds(customers(120)))
    .then(() => select())
    .then((records) => {
      expect(records.length).toBe(LRU_SIZE);
    });
  });

  test('should clear all records from table', () => {
    return init()
    .then(() => removeAll())
    .then(() => select())
    .then((records) => {
      expect(records.length).toBe(0);
    });
  });
});
