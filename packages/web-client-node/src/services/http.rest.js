import { Http } from '@axelor/web-client';

const joinPath = (baseURL, subURL = '') => {
  let sep = `${baseURL}`.lastIndexOf('/') === baseURL.length - 1 ? '' : '/';
  return `${baseURL}${sep}${subURL}`;
};

export class RestService {
  constructor(configs, getStore, interceptor = null) {
    this.http = new Http();
    this.entity = '';
    this.baseURL = configs.baseURL;
    this.settings = getStore();
    this.data = { };
    this.callbackInterceptor = interceptor;
  }

  setEntity(newEntity) {
    this.entity = joinPath(this.baseURL, newEntity);
  }

  getEntity() {
    return this.entity;
  }

  init() {
    return this.settings.init()
    .then((data) => {
      this.data = data;
      // this.baseURL = joinPath(data.url);
    });
  }

  login(url = this.baseURL, data = {
      username: this.data.username,
      password: this.data.password,
    }) {
    this.data = data;
    return this.http.request(joinPath(url, 'login'), data);
  }

  logout(url = this.baseURL) {
    return this.http.fetch(joinPath(url, 'logout'));
  }

  relogin(baseUrl, data) {
    return this.logout(baseUrl).then(() => this.login(baseUrl, data));
  }

  intercept(doRequest) {
    return doRequest().then((res) => {
      if (res.status === 404 || res.status === 500) {
        throw new Error('No Internet');
      } else if (res.status === 401) {
        if (this.callbackInterceptor) {
          this.callbackInterceptor();
          throw new Error('Unauthorized !!');
        } else {
          return this.login().then(doRequest)
        }
      }
      return res;
    });
  }

  getAll(options) {
    const filters = {};
    if (options.sortBy) {
      filters['sort'] = options.sortBy.map(s => {
        if (s.indexOf('-') === 0) {
          return { [s.substring(1)]: -1 };
        }
        return { [s]: 1 };
      });
    }
    const url = joinPath(this.entity, 'all');
    return this.intercept(() => this.http.post(url, filters));
  }

  get(id) {
    const url = joinPath(this.entity, id);
    return this.intercept(() => this.http.get(url));
  }

  post(data) {
    const url = this.entity;
    return this.intercept(() => this.http.post(url, data));
  }

  put(data) {
    const url = this.entity;
    return this.intercept(() => this.http.put(url, data));
  }

  delete(id) {
    const url = joinPath(this.entity, id);
    return this.intercept(() => this.http.delete(url));
  }

  info(baseUrl = '', doIntercept = true) {
    const base = baseUrl || this.baseURL;
    const url = joinPath(base, 'auth');
    return doIntercept ? this.intercept(() => this.http.get(url)) : this.http.get(url);
  }
}

export default RestService;
