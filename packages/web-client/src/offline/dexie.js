import Dexie from 'dexie';
import dbConfig, { getConfig } from './config';

/**
 * check wheather table/model is exist or not, if not exist then create new one.
 * @param {String} newModel - indexDB(offline) database table name
 * @returns {Object} schema - return new schema after model modification
 */
const checkDatabaseVersion = (newModel) => {
  // retrieve existing exist database model and version from localStorage
  let webappTypeModels = JSON.parse(localStorage.getItem(`${dbConfig.name}.models`) || '[]');
  let webappVersion = localStorage.getItem(`${dbConfig.name}.version`) || 1;

  // check newModel is exist or not, if not add it to schema for table creation
  if (webappTypeModels.indexOf(newModel) === -1) {
    webappTypeModels.push(newModel);
    webappVersion++;
  }

  // reset schema after changes
  localStorage.setItem(`${dbConfig.name}.models`, JSON.stringify(webappTypeModels));
  localStorage.setItem(`${dbConfig.name}.version`, webappVersion);

  dbConfig.version = webappVersion;

  const schema = {};
  // prepare new schema from models
  webappTypeModels.forEach(m => {
    // add default fields for indexing, which allows us to do search/filter on it
    schema[m] = ['row_id++', 'id', 'is_offline', 'last_access'].join(',');
  });
  return schema;
}

/**
 * A Wrapper Class, allows us to communicate with indexDB database using DexieJS Library
 * @class
 */
export class DexieClient {
  constructor() {
    /** @member {Boolean} isOpen - database connection is opened or not */
    this.isOpen = false;
    /** @member {Object} db - database instance */
    this.db = null;
    /** @member {Object} tables - database schema object */
    this.tables = {};
  }

  /**
   * used to initialize database table
   * @param {String} model - table name
   * @param {Array} fields - list of table fields
   * @returns {Promise} - resolve when database is ready to use
   */
  init(model, fields = []) {
    /** if database connection is opened and model already exist then resolve promise directly */
    if (this.isOpen && this.tables[model]) {
      return Promise.resolve();
    }

    this.tables = checkDatabaseVersion(model);

    // initialize Dexie Client instance
    const db = new Dexie(dbConfig.name);

    for (var i = 1; i <= dbConfig.version; i++) {
      db.version(i).stores(this.tables);
    }
    this.db = db;
    this.isOpen = true;

    return this.db.open();
  }

  /**
   * fetch record from table
   * @param {String} tableName - name of database table
   * @param {Number} id - unique id of record i.e. row_id
   * @returns {Promise} - resolve when record is fetched
   */
  fetch(tableName, id) {
    return this.db[tableName].get(id);
  }

  /**
   * add record in table
   * @param {String} tableName - name of database table
   * @param {Object} data - record to be insert
   * @returns {Promise} - resolve when record is inserted
   */
  add(tableName, data) {
    data['last_access'] = Date.now();
    data['is_offline'] = data.is_offline === undefined ? 0 : data.is_offline;
    return this.db[tableName].put(data);
  }

  /**
   * add multiple records in table
   * @param {String} tableName - name of database table
   * @param {Array} data - List of records
   * @param {Number} customCacheSize - cache size of LRU cache
   * @returns {Promise} - resolve when all record are inserted
   */
  adds(tableName, data, customCacheSize = null) {
    const { lru_size } = getConfig();
    const cacheSize = customCacheSize || lru_size;
    return Promise.all(data.map(rec => this.add(tableName, { ...rec })))
    .then(rowIds => {
      return this.store(tableName).where('is_offline').equals(0).sortBy('last_access')
      .then((results) => {
        const records = results.reverse();
        if (records.length > cacheSize) {
          const removeRecordIds = records.slice(cacheSize).map(e => e.row_id);
          return this.store(tableName).where('row_id').anyOf(removeRecordIds).delete()
          .then(() => rowIds.map(id => removeRecordIds.indexOf(id) > -1 ? null : id).filter(id => id));
        }
        return rowIds;
      });
    });
  }

  /**
   * update the record in table
   * @param {String} tableName - name of database table
   * @param {Object} data - record to be update
   * @returns {Promise} - resolve when update operation is completed
   */
  update(tableName, data) {
    return this.add(tableName, data);
  }

  /**
   * remove the record from table
   * @param {String} tableName - name of database table
   * @param {Object} data - record to be remove
   * @returns {Promise} - resolve when remove operation is completed
   */
  remove(tableName, data) {
    return this.db[tableName].delete(data.row_id);
  }

  /**
   * remove all records from table
   * @param {String} tableName - name of database table
   * @returns {Promise} - resolve when table is empty
   */
  removeAll(tableName) {
    const store = this.db[tableName];
    return store.clear();
  }

  /**
   * used to retrieve collection object of particular table
   * @param {String} tableName - name of database table
   * @returns {Object} - Model Collection object
   */
  store(tableName) {
    return this.db[tableName];
  }

  /**
   * retrieve records from table
   * @param {String} tableName - name of database table
   * @param {Object} options - select options
   * @returns {Promise} - resolve promise which contains records in form of Array
   */
  select(tableName, options = {}) {
    return this.store(tableName).toArray();
  }

  /**
   * retrieve dirty records(which is not sync with server) from table
   * @param {String} tableName - name of database table
   * @param {Object} options - select options
   * @returns {Promise} - resolve promise which contains records in form of Array
   */
  selectDirty(tableName, options = {}) {
    return this.store(tableName).filter(e => e.id == 0).toArray();
  }
}

/**
 * Singleton instance variable for DexieClient
 */
let instance = null;

/**
 * Initialize DexieClient Instance variable
 * @returns {DexieClient} - DexieClient instance
 */
export const getClient = () => {
  if (instance === null) {
    instance = new DexieClient();
  }
  return instance;
};

/**
 * wrapper, used as Object Relation Mapping
 * @param {String} entity - name of table/model
 * @param {Array} fields - fields/columns of table
 * @returns {Object} - contains ORM methods to perform CRUD with table
 */
export const getWebCRUD = (entity, fields) => {
  const dexieObj = getClient();
  return {
    init: () => dexieObj.init(entity, fields),
    store: () => dexieObj.store(entity),
    fetch: (id) => dexieObj.fetch(entity, id),
    add: (data) => dexieObj.add(entity, data),
    adds: (data, size) => dexieObj.adds(entity, data, size),
    update: (data) => dexieObj.update(entity, data),
    remove: (data) => dexieObj.remove(entity, data),
    removeAll: () => dexieObj.removeAll(entity),
    select: (data) => dexieObj.select(entity, data),
    selectDirty: (data) => dexieObj.selectDirty(entity, data),
  };
}

export default getClient;
