import { IConnector } from '@axelor/web-client';
import RestService from './services/http.rest';
import mappers from './helpers/mappers';
import MODELS from './models';
import Locale from './locale';

const cacheJSONFields = {};
const SERVER = {};

export class ADKConnector extends IConnector {
  constructor(rest, options) {
    super();
    this.rest = rest;
    this.configure(options);
  }

  configure(options) {
    this._options = options;
    if (!MODELS[options.name]) {
      return console.error(`Model ${options.name} is not defined in web-client-adk/src/models/index.js`);
    }
    this._entity = MODELS[options.name];
    const { searchMapper, requestMapper, relatedFieldMapper, responseMapper, optionsMapper, fieldsMapper } = mappers(this._entity, options);
    this.optionsMapper = optionsMapper;
    this.searchMapper = searchMapper;
    this.requestMapper = requestMapper;
    this.responseMapper = responseMapper;
    this.fieldsMapper = fieldsMapper;
    this.relatedFieldMapper = relatedFieldMapper;

    if (this._entity.responseMapper) {
      this.responseMapper = (e) => {
        e = this._entity.responseMapper(e, this.rest);
        return responseMapper(e);
      }
    }
    if (this._entity.requestMapper) {
      this.requestMapper = (e) => {
        e = requestMapper(e);
        return this._entity.requestMapper(e, this.rest);
      }
    }
  }

  // internal use
  interceptor(api, mapResult = true) {
    return this.init()
    .then(() => api())
    .then(res => res.json())
    .then(res => {
      if (`${res.status}` !== '0' || !mapResult) return res;
      return this.searchMapper({ ...res, data: (res.data || []).map(this.responseMapper) })
    })
    .catch((error) => {
      console.log('catch error', error);
      if (error.toString() === new Error('Unauthorized').toString()) {
        throw error;
      }
      return ({ status: 0, data: [] })
    });
  }

  init(model = this._entity.selection ? 'com.axelor.meta.db.MetaSelectItem' : this._entity.model) {
    return this.rest.init().then(() => this.rest.setEntity(model));
  }

  login(url, username, password) {
    return this.rest.logout(url)
    .then(() => this.rest.login(url, { username, password }));
  }

  logout() {
    return this.rest.logout();
  }

  info() {
    return this.init().then(() => this.rest.info());
  }

  search(options = {}) {
    if (options.customModel) {
      const { optionsMapper } = mappers({}, {});
      const { customModel } = options;
      delete options.customModel;
      return this.init(customModel)
      .then(() => this.rest.search(optionsMapper(options)))
      .then(res => res.json())
    }
    if (!options['fields']) {
      options['fields'] = this._entity.fields;
    }
    return this.interceptor(() => this.rest.search(this.optionsMapper(options)));
  }

  add(data) {
    if (data.id == '0') {
      data = Object.assign({}, data);
      delete data.id;
      delete data.is_offline;
      delete data.row_id;
      delete data.last_access;
    }
    return this.interceptor(() => this.rest.put(this.requestMapper(data)));
  }

  update(data) {
    return this.interceptor(() => this.rest.post(this.requestMapper(data)));
  }

  remove(data) {
    return this.interceptor(() => this.rest.delete(this.requestMapper(data).id));
  }

  fetch(data, related = {}) {
    return this.interceptor(() => this.rest.fetch(this.requestMapper(data).id, this._entity.fields, this.relatedFieldMapper(related)));
  }

  copy(data) {
    return this.interceptor(() => this.rest.copy(this.requestMapper(data).id));
  }

  downloadFile(data) {
    return this.interceptor(() => this.rest.downloadFile(this.requestMapper(data).id));
  }

  downloadMetaFile(data) {
    const record = this.requestMapper(data);
    return this.interceptor(() => this.rest.downloadMetaFile(record.id, record.version));
  }

  uploadFile(data, headers) {
    return this.init()
    .then(() => this.rest.upload(data, headers));
  }

  wsFilesURL(data) {
    return this.init()
    .then(() => this.rest.wsFilesURL(data));
  }

  fields() {
    return this.fieldsMapper();
  }

  jsonFields(options = {}) {
    const fieldModel = MODELS['MetaJsonField'];
    const { optionsMapper } = mappers(fieldModel, {});
    if (cacheJSONFields[this._entity.model]) {
      return Promise.resolve(cacheJSONFields[this._entity.model]);
    }
    return this.rest.init()
      .then(() => this.rest.setEntity('com.axelor.meta.db.MetaJsonField'))
      .then(() => this.rest.search(optionsMapper({
        fields: fieldModel.fields,
        data: {
          _domain: "self.jsonModel is null",
        },
        ...options,
        limit: -1,
      })))
      .then(res => res.json())
      .then((result) => {
        if (!result.data) {
          result.data = [];
        }
        return this.rest.fields(this._entity.model)
        .then(res => res.json())
        .then((res) => {
          const { jsonFields = {} } = res.data || {};
          for(let i = 0; i < (result.data || []).length; i++) {
            const field = result.data[i];
            if (jsonFields[field.modelField] && jsonFields[field.modelField][field.name]) {
              result.data[i] = Object.assign({}, jsonFields[field.modelField][field.name], result.data[i]);
            }
          }
          cacheJSONFields[this._entity.model] = result;
          return result;
        });
      });
  }

  action(actionName, data) {
    const actionData = data;
    if (actionData.context) {
      actionData.context = this.requestMapper(data.context);
    }
    return this.interceptor(() => this.rest.action(actionName, actionData))
    .then((result) => {
      if (result.status == 0) {
        return {
          ...result, data: result.data.map(e => {
            if (!e.values) return e;
            return { ...e, values: this.responseMapper(e.values) };
          }),
        };
      }
      return result;
    });
  }

  message(data) {
    const handler = apiCall => this.rest.init()
    .then(apiCall)
    .then((res) => res.json())
    .catch((error) => {
      if (error.toString() === new Error('Unauthorized').toString()) {
        throw error;
      }
      console.log('error', error);
      return ({ status: 0, data: [] })
    });
    const getAll = ({ limit, offset = 0 } = {}) => handler(
      () => this.rest.messages({ offset, limit, id: data.id })
    );
    const add = (body = '', files = []) => handler(
      () => this.rest.comment({ id: data.id, body, files })
    );
    const remove = (data) => handler(
      () => this.rest.removeMessage(data)
    )
    return {
      getAll,
      add,
      remove,
      markAsUnread: () => Promise.reject(),
      markAsImportant: () => Promise.reject(),
    };
  }

  app() {
    return this.init().then(
      () => this.rest.action('com.axelor.apps.mobile.web.AppMobileController:getAppMobile', {})
      .then((res) => res.json())
      .then(({ data = {} } = {}) => {
        const apps = {};
        const sets = {};
        Object.keys(data)
        .forEach((k) => {
          if (`${k}`.indexOf('Enable') > -1) {
            apps[k] = data[k];
          }
          if (`${k}`.indexOf('Set') > -1) {
            sets[k] = data[k];
          }
        });
        return {
          apps,
          sets,
          mOFilterOnStockDetailStatusSelect: data.mOFilterOnStockDetailStatusSelect ? data.mOFilterOnStockDetailStatusSelect.split(",").map(e => Number(e.trim())) || [] : [],
          offlineLimit: data.offlineRecordLimit || 100,
        };
      })
    );
  }
}

export { Locale };

export default (configs = {}) => (store) => (options, Contract = ADKConnector) => {
  const rest = new RestService({ ...SERVER, ...configs }, store);
  return class extends Contract {
    constructor() {
      super(rest, options);
    }
  };
};
