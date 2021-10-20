import {IConnector} from '@axelor/web-client';
import RestService from './services/http.rest';
import mappers from './helpers/mappers';
import MODELS from './models';

const SERVER = {};

export class NodeConnector extends IConnector {
  constructor(rest, options) {
    super();
    this._options = options;
    this._entity = MODELS[options.name];
    this.rest = rest;
    const { requestMapper, responseMapper, optionsMapper } = mappers(this._entity, options);
    this.optionsMapper = optionsMapper;
    this.requestMapper = requestMapper;
    this.responseMapper = responseMapper;
  }

  // internal use
  interceptor(api) {
    return this.init()
    .then(() => api())
    .then(res => res.json())
    .then(res => {
      let status = 0;
      if (res.error) {
        status = -1;
      }
      return ({ ...res, status, data: res.data.map(this.responseMapper) })
    });
  }

  init() {
    return this.rest.init().then(() => this.rest.setEntity(this._entity.model));
  }

  login(username, password) {
    return this.rest.login(username, password);
  }

  logout() {
    return this.rest.logout();
  }

  search(options = {}) {
    return this.interceptor(() => this.rest.getAll(this.optionsMapper(options)));
  }

  add(data) {
    return this.interceptor(() => this.rest.post(this.requestMapper(data)));
  }

  update(data) {
    return this.interceptor(() => this.rest.put(this.requestMapper(data)));
  }

  remove(data) {
    return this.interceptor(() => this.rest.delete(this.requestMapper(data).id));
  }

  fetch(data) {
    return this.interceptor(() => this.rest.get(this.requestMapper(data).id));
  }

}

export default (configs = {}) => (store) => (options, Contract = NodeConnector) => {
  const rest = new RestService({ ...SERVER, ...configs }, store);
  return class extends Contract {
    constructor() {
      super(rest, options);
    }
  };
};
