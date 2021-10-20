import { getWebCRUD } from './dexie';
import { setConfig } from './config';
import searchFilter from './filter';
import MergeObject from 'lodash.merge';

/**
 * cache variable to check wheather particular model records ids are synchronized or not
 * if some records are not exist on server then it will remove from database
 */
const idChecks = {};

/**
 * Object contains different Database Wrapper
 * web: db wrapper used for web version e.g. indexedDB or webSQL
 * mobile : db wrapper used for mobile version e.g. sqlite database
 * desktop : db wrapper used fro desktop version
 */
const TYPES = {
  web: getWebCRUD,
};

/**
 * Offline Wrapper,which Extends ClientAPI Class and overide its methods to provide different
 * implementation for online and offline
 * @param {WebClient} - Web Client Library
 * @param {Object} - offline options
 * @param {Object} - connection options
 * @param {Function} - offline store creator
 * @returns {Class} - offline wrapped class contains methods to CRUD with database
 */
export default (ClientAPI, options, connectorOptions, createStore) => {
  const { mode: type } = connectorOptions;

  if (!TYPES[type]) return ClientAPI;

  // common error catch handler
  const catchHandler = (handler) => (err) => {
    switch(err.toString()) {
      case 'Error: Unauthorized':
        {
          const store = createStore();
          store.dispatch({ type: 'SET_APP_ERROR', error: err.toString() });
          return { data: [], total: 0 };
        }
      case 'Error: No Internet':
        return handler();
      default:
        throw err;
    }
  }
  const { refs = [], props = {} } = options;
  const orm = TYPES[type](options.name, options.fields);

  // synchronize nested object of particular record
  const syncAll = (data) => {
    return Promise.all(
      refs
      .filter(r => data[r.field])
      .map(r => {
        const isArr = Array.isArray(data[r.field]);
        const refORM = TYPES[type](r.model);
        return (isArr ? Promise.all(data[r.field].map(drf => drf.row_id ? refORM.fetch(drf.row_id) : Promise.resolve(drf))) : (data[r.field].row_id ? refORM.fetch(data[r.field].row_id) : Promise.resolve(data[r.field])))
        .then((ress) => {
          data[r.field] = ress;
          // check nested object is already sync or not
          const checkOff = (rc) => rc && `${rc.id}` === '0' && `${rc.is_offline}` === '1';
          const isOff = isArr ? data[r.field].map(e => checkOff(e)).some(v => v === true) : checkOff(data[r.field]);
          const ormModel = props.refs ? props.refs[r.model.toLowerCase()] : null;
          const isSync = r.field && data[r.field] && ormModel && isOff;
          if (!isSync) return Promise.resolve();
          // check if its o2m/m2m field then sync all object of array otherwise simply sync single object
          return isArr ? (
            Promise.all(
              data[r.field].map(e => checkOff(e) ? ormModel.add(e) : Promise.resolve({ data: [e] }))
            )
            .then((ress) => data[r.field] = ress.map(res => res.data[0]))
          ) : ormModel.add(data[r.field]).then((res) => data[r.field] = res.data[0]);
        })
      })
    ).then(() => ({...data}) );
  };

  /**
   * dynamic class extends given ClientAPI
   */
  return class extends ClientAPI {
    constructor(opts) {
      super(opts);
      this.store = createStore();
    }

    /**
     * used to check device is online
     * @returns {Boolean} - is online or not
     */
    isOnline() {
      return this.store.getState().app.mode === 'online';
    }

    /**
     * used to check device is offline
     * @returns {Boolean} - is offline or not
     */
    isOffline() {
      return this.store.getState().app.mode === 'offline';
    }

    /**
     * fetch record from server
     * @param {Object} data - record object for e.g { id: 1 }
     * @param {Object} related - record object related fields
     * @returns {Promise} - resolve when record is fetched
     */
    fetch(data, related = {}) {
      const raw = data;
      // fetch record from offline database
      if (this.isOffline() || (!data.id && data.is_offline == 1)) {
        return orm.init()
        .then(() => {
          // if primary key (row_id) is missing then search record with id field if exist
          if (!data.row_id && data.id) {
            return orm.store().where('id').equals(data.id).toArray()
            .then((results) => results.length ? results[0] : raw);
          }
          return orm.fetch(data.row_id || 0);
        })
        .then((record) => ({ data: [record || raw] }));
      }

      // fetch record from server, update record in offline database
      return orm.init()
      .then(() => super.fetch(data, related))
      .then(({ data = [{}] }) => {
        return orm.store().where('id').equals(raw.id).toArray()
        .then((results) => {
          let record = data[0];
          if (results && results.length) {
            record = Object.assign({}, results[0], record, { is_fetch: true });
            return orm.update(record)
            .then(() => ({ data: [record] }));
          } else {
            return orm.add(record).then(() => ({ data: [record]}));
          }
        })
      });
    }

    /**
     * get/filter records
     * @param {Object} options - search options
     * @param {Boolean} all - search for all records which includes offline records(is_offline=1)
     * @returns {Promise} - resolve when records are fetched and stored in offline database
     */
    search(options = {}, all = false) {
      // offline implementation
      if (this.isOffline()) {
        // no search for json based custom model in offline mode
        if (options.customModel) {
          return Promise.resolve({ status: 0, data: [], total: 0 });
        }

        // serve records from offline store
        return orm.init()
        .then(() => {
          let store = orm.store();
          if (!all) {
            store = store.where('is_offline').equals(1);
          }
          // filter records if id exist
          let resolveData = null;
          if (options.id) {
            resolveData = orm.store().where('id').anyOf(options.id).toArray();
          } else {
            resolveData = store.toArray();
          }

          resolveData = resolveData
          .then((results) => {
            // if offset is 0 then only includes offline record
            const offrecords = orm.store().where('is_offline').equals(1).filter((e) => `${e.id}` === '0').toArray();
            return offrecords.then((offdata) => {
              const offIds = offdata.map(e => e.row_id || 0);
              return [...(options.offset === 0 ? offdata : []), ...(
                results.filter(e => offIds.indexOf(e.row_id) === -1)
              )];
            });
          });

          // for search options, apply search filters on records
          if (options.search) {
            resolveData = resolveData.then((results) => results.filter(rec => {
              return searchFilter(options.search, rec);
            }));
          }
          return resolveData;
        })
        .then((data) => {
          let filterData = data;
          const total = data.length;
          // pagination for offline records
          if (options.limit) {
            const { offset = 0, limit } = options;
            filterData = data.splice(offset, limit);
          }
          return ({ data: [...filterData], total });
        });
      }

      // online mode implementation
      // no offline cache, directly serve from server
      if (options.customModel) {
        return super.search(options);
      }

      //
      return orm.init()
      .then(() => super.search({ ...options }))
      .then((res) => {
        if (res.status.toString() !== '0') return { data: [], error: res.data, status: res.status };

        //
        const ids = res.data.map(e => e.id);
        const offStoreRecords = options.offset === 0 ?
          (orm.store().where('is_offline').equals(1).filter((e) => `${e.id}` === '0').toArray()) :
          (Promise.resolve([]));

        // find cached records with ids(online searched records)
        return orm.store().where('id').anyOf(ids).toArray()
        .then((records) => {
          records.forEach(r => {
            // concat object online and offline object
            const recIndex = res.data.findIndex(e => e.id === r.id);
            if (recIndex > -1) {
              res.data[recIndex] = MergeObject(r, res.data[recIndex]);
            }
          });
          // store records in offline database
          return orm.adds(res.data)
          .then((rowIds) => res.data.map((rec, i) => {
            if (rowIds[i]) {
              rec['row_id'] = rowIds[i];
            } else {
              delete rec.row_id;
            }
            return { ...rec };
          }));
        })
        .then((data) => {
          // check ids of exist records
          if (!idChecks[options.name]) {
            idChecks[options.name] = true;
            // get all offline sync records
            orm.store()
            .where('is_offline').equals(0).toArray()
            .then((records) => {
              const recordIds = records.map(x => x.id);
              const syncIds = data.map(x => x.id);
              const checkIds = recordIds.filter(x => x && syncIds.indexOf(x) === -1);
              if (checkIds.length > 0) {
                // check all sync records on server
                super.search({
                  id: checkIds,
                  limit: -1,
                  fields: ['id'],
                })
                .then(({ data = [] }) => {
                  // remove offline sync record if its not exist on server
                  if (Array.isArray(data)) {
                    const existIds = data.map(x => x.id);
                    const removeIds = checkIds.filter(x => existIds.indexOf(x) === -1);
                    records.filter(x => removeIds.indexOf(x.id) > -1)
                    .forEach((rec) => {
                      orm.remove(rec);
                    });
                  }
                });
              }
            });
          }
          // apply filter on offline records only
          return offStoreRecords
          .then((records) => options.search ? records.filter(rec => searchFilter(options.search, rec)) : records)
          .then((e = []) => ({ ...res, data: [...e, ...data] }))
        });
      })
      .catch(catchHandler(() => orm.store().reverse().sortBy('last_access').then((data) => ({ data, total: data.length }))));
    }

    /**
     * add record in offline database and save record on server if mode is online
     * @param {Object} record - record to be insert
     * @param {Boolean} isOnline - mode is online or offline
     * @returns {Promise} - resolve when record is saved
     */
    handleAdd(record, isOnline) {
      const data = { id: 0, ...record, is_offline: 0 };
      return orm.init()
      .then(() => orm.add(data))
      .then((row_id) => {
        // different implementation for online and offline mode
        return (
          this.isOnline() || isOnline ?
            syncAll(record).then((syncRecord) => super.add(syncRecord)) :
            Promise.resolve({ data: [{ ...data, is_offline: 1 }], status: 0 })
        )
        .then((res) => {
          // check for error
          if (res.status.toString() !== '0') {
            return (
              record.is_offline == '1' ? orm.update(record) : orm.remove({ ...record, row_id })
            ).
            then(() => ({ data: [record], error: res.data, status: res.status }));
          }
          // set is_offline attribute
          res.data[0].row_id = row_id;
          if (this.isOnline() || isOnline) {
            res.data[0].is_offline = 0;
          } else {
            res.data[0].is_offline = 1;
          }
          // update server return record in offline database
          return orm.update(res.data[0])
          .then(() => res);
        })
        .catch(catchHandler(() => {
          return Promise.resolve({ data: [{ ...data, row_id }]})
        }));
      });
    }

    /**
     * add record in offline database
     * @param {Object} record - record to be insert
     * @param {Boolean} isOnline - device is online or offline
     * @returns {Promise} - resolve when record is added
     */
    add(record, isOnline = false) {
      return this.handleAdd(record, isOnline);
    }

    /**
     * update record in offline database
     * @param {Object} data - record to be update
     * @returns {Promise} - resolve when record is updated
     */
    update(data) {
      // for offline mode, save record directly in database
      if (this.isOffline() || (data.is_offline == 1 && `${data.id}` === '0')) return this.offline().save(data);

      // update record on live server
      return orm.init()
      .then(() => orm.update(data))
      .then(() => {
        return syncAll(data)
        .then((syncData) => super.update(syncData))
        .then((res) => {
          // if any error
          if (res.status.toString() !== '0') return { data: [data], error: res.data, status: res.status };
          res.data[0].row_id = data.row_id;
          return res;
        })
        .catch(catchHandler(() => Promise.resolve({ status: -1, error: 'No Internet', data: [{ ...data }]}) ));
      });
    }

    /**
     * remove record from offline database
     * @param {Object} data - record to be remove
     * @returns {Promise} - resolve when record is removed
     */
    remove(data) {
      // check mode, if record is offline one and remove
      if (this.isOffline() || (data.is_offline == 1 && `${data.id}` === '0')) {
        return orm.init()
        .then(() => orm.remove(data))
        .then(() => ({ status: 0 }));
      }
      // remove record from server
      return orm.init()
      .then(() => {
        return super.remove(data)
        .then((res) => {
          // if any error
          if (res.status.toString() !== '0') return { data: [data], error: res.data, status: res.status };
          // remove from orm
          return orm.remove(data).then(() => res);
        })
        .catch(catchHandler(() => Promise.resolve({ status: -1, error: 'No Internet', data: [{ ...data }]}) ));
      });
    }

    /**
     * perform offline related actions
     * @returns {Object} - contains methods {
     *  search: search for offline data,
     *  save: save directly in offline,
     *  sync: live synchronization with server,
     * }
     */
    offline() {
      return {
        search: () => {
          // search for records which contains is_offline=1 and id=0
          return orm.init()
          .then(
            () => orm.store()
              .where('is_offline')
              .equals(1)
              .filter((e) => `${e.id}` === '0')
              .toArray()
            )
        },
        searchAll: () => {
          // search for cached records
          return orm.init()
          .then(() => orm.store().toArray())
        },
        remove: (data) => {
          return orm.init()
          .then(() => orm.remove(data));
        },
        save: (data, status = 1) => orm.init().then(() => {
          // update last_access and overide is_offline value
          const record = {
            ...data,
            is_offline: status,
            last_access: new Date().getTime(),
          };
          return orm.update(record)
          .then(() => ({ data: [record], status: 0 }));
        }),
        sync: (data) => this.handleAdd(data, true).then(res => res.data[0]),
      };
    }

    /**
     * find json fields for model on live server and store fields in offline table named MetaJsonField
     */
    jsonFields() {
      // init orm with model name MetaJsonField
      const orm = TYPES[type]('MetaJsonField', []);
      return orm.init()
      .then(() => {
        // options/criteria to find json field on server
        const options = {
          search: {
            fields: [{ fieldName: 'model', operator: '=', value: this._entity.model }],
            operator: 'and',
          },
        };
        // if offline, serve data from offline table
        if (this.isOffline()) {
          return orm.store().toArray()
          .then((results) => results.filter(rec => {
              // apply filters on record
              return searchFilter(options.search, rec);
          }))
          .then((data) => ({ data, status: 0, total: data.length}));
        };
        // fetch json fields
        return super.jsonFields(options)
        .then(res => {
          const ids = (res.data || []).map(e => e.id);
          // store data in offline and merge existing offline records with live records
          return orm.store().where('id').anyOf(ids).toArray()
          .then((records) => {
            records.forEach(r => {
              const recIndex = res.data.findIndex(e => e.id === r.id);
              if (recIndex > -1) {
                res.data[recIndex] = {...res.data[recIndex], is_offline: r.is_offline, row_id: r.row_id };
              }
            });
          })
          .then(() => orm.adds(res.data || []).then(() => res));
        })
        .catch(catchHandler(() => Promise.resolve({ status: -1, error: 'No Internet', data: []}) ));
      });
    }

    /**
     * perform actions on live server
     * @param {Object} options
     * @returns {Promise} - resolve when action is completed
     */
    action(...options) {
      // skip to perform action in offline mode
      if (this.isOffline()) {
        return Promise.resolve({ data: [{ values: {} }] });
      }
      return super.action(...options);
    }

    /**
     * prepare message/comment api for particular record
     * @param {Object} data - record to be consider as parent which holds all the comments
     * @returns {Object} - {
     *  getAll(searchOptions): get all comments of that record support pagination i.e. offset, limit in searchOptions,
     *  add(body, files = []): add new message/comment of record or attach files if any
     *  remove(commentObject): remove particular comment of that record
     * }
     */
    message(data) {
      // assign default id
      data.id = data.id || 0;

      // initialize MetaMessage offline ORM Model
      const orm = TYPES[type]('MetaMessage', []);

      // offline implementation
      if (this.isOffline()) {
        const options = {
          search: {
            fields: [
              { fieldName: 'relatedId', operator: '=', value: data.id },
              { fieldName: 'relatedModel', operator: '=', value: this._entity.model },
            ],
            operator: 'and',
          },
        };
        // find comments from offline database
        const getAll = (opts) => orm.init()
        .then(() => orm.store().toArray())
        .then((results) => {
          return results.filter(rec => {
            // apply search filter
            return searchFilter(options.search, rec);
          })
        })
        .then((data) => {
          // apply pagination if any
          let filterData = data;
          const total = data.length;
          if (opts.limit) {
            const { offset = 0, limit } = opts;
            filterData = data.splice(offset, limit);
          }
          return ({ data: [...filterData], total });
        });
        // skip add, remove operation in offline mode
        return {
          getAll,
          remove: () => Promise.resolve({ status: -1, data: [{}], error: 'Comment can be delete in online mode only' }),
          add: () => Promise.resolve({ status: -1, data: [{}], error: 'Comment must be in online mode' }),
        };
      };

      const methods = super.message(data);
      // get comments from live server and stored in offline database
      const getAll = (opts) => {
        return orm.init()
        .then(() => methods.getAll(opts))
        .then((res) => {
          if (!Array.isArray(res.data)) {
            res.data = [];
          }
          const ids = (res.data || []).map(e => e.id);
          return orm.store().where('id').anyOf(ids).toArray()
          .then((records) => {
            // merge offline record with live record
            records.forEach(r => {
              const recIndex = res.data.findIndex(e => e.id === r.id);
              if (recIndex > -1) {
                res.data[recIndex] = {...res.data[recIndex], is_offline: r.is_offline, row_id: r.row_id };
              }
            });
          })
          .then(() => orm.adds(res.data || [], 1000))  // override LRU cache size for comments to 1000
          .then((rowIds) => (res.data || []).map((rec, i) => {
            // map row_id field
            if (rowIds[i]) {
              rec['row_id'] = rowIds[i];
            }
            return { ...rec };
          }))
          .then((mapData) => ({ ...res, data: [...mapData] }));
        })
        .catch(catchHandler(() => Promise.resolve({ status: -1, error: 'No Internet', data: []}) ))
      }

      /**
       * add new comment for particular record
       * @param {String} body - string message
       * @param {Array} files - list of files
       * @returns {Promise} - resolve when comment is posted
       */
      const add = (body = '', files = []) => {
        const data = { body, files };
        // add comment in local database and post comment on live server
        return orm.init()
        .then(() => orm.add(data))
        .then((row_id) => {
          // add on server
          return methods.add(body, files)
          .then((res) => {
            // check for any error, if found then remove local comment instance
            if (res.status.toString() !== '0') {
              return orm.remove({ ...record, row_id })
              .then(() => ({ data: [record], error: res.data, status: res.status }));
            }
            res.data[0].row_id = row_id;
            res.data[0].is_offline = 0;
            // update comment object, to store inserted id
            return orm.update(res.data[0])
            .then(() => res);
          })
          .catch(catchHandler(() => {
            return Promise.resolve({ data: [{ ...data, row_id }]})
          }));
        });
      }

      /**
       * used to remove comment from that record
       * @param {Object} data - comment object to be remove
       * @returns {Promise} - resolve when comment is deleted
       */
      const remove = (data) => {
        return orm.init()
        .then(() => {
          // remove from live server
          return methods.remove(data)
          .then((res) => {
            // check for error
            if (res.status.toString() !== '0') return { data: [data], error: res.data, status: res.status };
            // remove from local database
            return orm.remove(data).then(() => res);
          })
          .catch(catchHandler(() => Promise.resolve({ status: -1, error: 'No Internet', data: [{ ...data }]}) ));
        });
      }
      return {
        getAll,
        add,
        remove,
      };
    }

    /**
     * to get app settings/configuration
     * @returns {Promise} - resolve when settings are available
     */
    app() {
      return super.app()
      .then((res) => {
        // check for offlineLimit field
        if (res.offlineLimit && Number(res.offlineLimit)) {
          // override LRU cache size
          setConfig({
            lru_size: Number(res.offlineLimit),
          });
        }
        return res;
      });
    }
  };
}
