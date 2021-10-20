/**
 * Object contains database related configuration
 * name : name of offline database name
 * version: latest version of database
 * lru_size: least recently used records size
 */
let dbConfig = {
  name: 'web_connect_store',
  version: 1,
  lru_size: 100,
};

/**
 * used to set database related settings
 * @param {Object} options - database settings ({ name, version, lru_size }) to be override
 */
export function setConfig(options = {}) {
  dbConfig = Object.assign({}, dbConfig, options);
  localStorage.setItem(`dexie.config`, JSON.stringify(dbConfig));
}

/**
 * used to get database settings ({ name, version, lru_size })
 */
export function getConfig() {
  const config = localStorage.getItem(`dexie.config`);
  return config ? JSON.parse(config) : dbConfig;
}

export default dbConfig;
