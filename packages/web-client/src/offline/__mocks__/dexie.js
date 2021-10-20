
class Dexie {
  constructor() {
    this.ver = 1;
    this.row_id = 1;
    this.store = {

    };
    this.schema = {};
  };

  version(ver) {
    this.ver = ver;
    return this;
  }

  open() {
    return Promise.resolve();
  }

  check(tableName) {
    if (!this.store[tableName]) {
      this.store[tableName] = {
        key: tableName,
        row_id: 0,
        data: [],
      };
    }
  }

  put(tableName, record) {
    if (record.row_id) {
      const ind = this.store[tableName].data.findIndex(e => e.row_id == record.row_id);
      if (ind > -1) {
        this.store[tableName].data[ind] = Object.assign({}, this.store[tableName].data[ind], record);
        this.store[tableName].data = [...this.store[tableName].data];
        return Promise.resolve(record);
      }
      return Promise.reject();
    } else {
      let row_id = this.store[tableName].row_id;
      row_id++;
      this.store[tableName].data.push(Object.assign({}, record, { row_id } ));
      this.store[tableName].row_id = row_id;
      return Promise.resolve(row_id);
    }
  }

  get(tableName, id) {
    return Promise.resolve(this.store[tableName].data.find(e => e.row_id == id));
  }

  setAll(tableName, data) {
    this.store[tableName].data = data;
  }

  getAll(tableName) {
    return this.store[tableName].data;
  }

  stores(tables) {
    this.schema = tables;

    /* eslint-disable */

    for(let table in tables) {
      this.check(table);
      const obj = (data = this.getAll(table), key = '') => ({
        get: (id) => this.get(table, id),
        put: (record) => this.put(table, record),
        reverse: () => obj(data.reverse()),
        anyOf: (vals) => obj(data.filter(e => vals.indexOf(e[key]) > -1 )),
        equals: (val) => obj(data.filter(e => e[key] == val)),
        sortBy: (k) => Promise.resolve(
          data.sort((a, b) => {
            if (a[k] < b[k]) return -1;
            if (a[k] > b[k]) return 1;
            return 0;
          })
        ),
        delete: (id = null) => {
          const ids = id ? [id] : data.map(e => e.row_id);
          const cloneData = this.getAll(table);
          const allData = [];
          for(let i = 0; i < cloneData.length; i++) {
            if (ids.indexOf(cloneData[i].row_id) === -1) {
              allData.push(cloneData[i]);
            }
          }
          this.setAll(table, allData);
          return Promise.resolve(allData);
        },
        filter: (func) => obj(data.filter(func)),
        where: (k) => obj(this.getAll(table), k),
        toArray: () => Promise.resolve(this.getAll(table)),
        clear: () => Promise.resolve(this.setAll(table, [])),
      });
      this[table] = obj();
    }
  }

}

export default Dexie;
