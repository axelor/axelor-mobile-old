/**
 * Local Storage wrapper class to store/retrieve data from localStorage
 * it accept name of store during object construction,
 * provide helper methods to manipulate that store.
 */
export class LocalStore {
  constructor(name) {
    this.datastore = null;
    this.name = name;
  }

  // get data from storage
  get() {
    return new Promise((resolve, reject) => {
      try {
        const result = localStorage.getItem(this.name);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }

  // save data in storage
  set(item) {
    return new Promise((resolve, reject) => {
      this.datastore = item;
      try {
        localStorage.setItem(this.name, JSON.stringify(this.datastore));
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  // remove data from storage
  clear() {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem(this.name);
        this.datastore = null;
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }

  // initialize store
  init() {
    return this.get(this.name).then((data) => {
      this.datastore = JSON.parse(data);
      return this.datastore;
    });
  }
}

/**
 * Default settings for user
 * @constant
 */
const DEFAULT_SETTINGS = {
  url: '',
  username: '',
  password: '',
  lang: 'en',
  info: {}, // user personalized information like lang, company etc
  apps: {}, // user personalized apps like crm, sale etc
}

export class SettingsService {
  constructor(store) {
    this.store = store;
    this.data = DEFAULT_SETTINGS;
    this.auth = false;
  }

  // initialize store
  init() {
    return this.store.init()
      .then((settings) => {
        this.data = Object.assign(this.data, settings || {});
        this.auth = this.data.password ? true : false;
        return this.data;
    });
  }

  // save settings into store
  save(data) {
    this.data = Object.assign({}, this.data, data);
    return this.store.set(data);
  }

  // remove settings from store
  clear() {
    this.data = DEFAULT_SETTINGS;
    return this.store.clear();
  }
}

// singleton setting instance
let instance = null;

export default (name = 'web.connect.store.user') => {
  if (instance === null) {
    instance = new SettingsService(new LocalStore(name));
  }
  return instance;
};
