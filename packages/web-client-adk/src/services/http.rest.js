import { Http } from "@axelor/web-client";

const joinPath = (baseURL = "", subURL = "") => {
  let sep = `${baseURL}`.lastIndexOf("/") === baseURL.length - 1 ? "" : "/";
  return `${baseURL}${sep}${subURL}`;
};

export class RestService {
  constructor(configs, getStore, interceptor = null) {
    this.http = new Http();
    this.entity = "";
    this.entityModel = "";
    this.baseURL = configs.baseURL;
    this.settings = getStore();
    this.data = {};
    this.callbackInterceptor = interceptor;
  }

  setEntity(newEntity) {
    this.entityModel = newEntity;
    this.entity = `${this.baseURL}ws/rest/${newEntity}`;
  }

  getEntity() {
    return this.entity;
  }

  init() {
    return this.settings.init().then(data => {
      if(!this.http.headers.get('X-CSRF-Token') && data.csrfToken) {
        this.http.headers.append('X-CSRF-Token', data.csrfToken);
      }
      this.data = data;
      this.baseURL = joinPath(data.url || "");
    });
  }

  login(
    url = this.baseURL,
    data = {
      username: this.data.username,
      password: this.data.password
    }
  ) {
    return this.http.request(joinPath(url, "callback"), data);
  }

  logout(url) {
    return new Promise(resolve => {
      this.http
        .request(joinPath(url || this.baseURL, "logout"), {
          method: "GET"
        })
        .then(resolve, resolve);
    });
  }

  relogin(baseUrl, data) {
    return this.logout(baseUrl).then(() =>this.login(baseUrl, data));
  }

  intercept(doRequest) {
    return doRequest().then(res => {
      if (res.status === 404 || res.status === 500) {
        throw new Error("No Internet");
      } else if (res.status === 401 || res.status === 403) {
        if (this.callbackInterceptor) {
          this.callbackInterceptor();
          throw new Error("Unauthorized");
        } else {
          return this.login().then(res => {
            if (res.status === 401) throw new Error("Unauthorized");
            const csrfToken = res.headers.get('X-CSRF-Token') || res.headers.get('x-csrf-token');
            this.settings.save({...this.settings.data, csrfToken});
            return doRequest();
          });
        }
      }
      return res;
    });
  }

  search({
    fields = null,
    sortBy = null,
    limit = 40,
    offset = 0,
    data = {},
    ...others
  }) {
    const url = joinPath(this.entity, "search");
    const options = {
      fields,
      sortBy,
      data: {
        _domain: null,
        _domainContext: {},
        operator: "and",
        criteria: [],
        ...data
      },
      limit,
      offset,
      ...others
    };
    return this.intercept(() => this.http.post(url, options));
  }

  request(requestURL, method = "get", data = {}) {
    method = method.toLowerCase();
    const url = joinPath(this.baseURL, requestURL);
    return this.intercept(() => this.http[method](url, data));
  }

  get(id) {
    const url = joinPath(this.entity, id);
    return this.intercept(() => this.http.get(url));
  }

  getAll(offset = 0, limit = 40) {
    const url = `${this.entity}?offset=${offset}&limit=${limit}`;
    return this.intercept(() => this.http.get(url));
  }

  fetch(id, fields = [], related = {}) {
    const url = joinPath(this.entity, joinPath(id, "fetch"));
    return this.intercept(() => this.http.post(url, { fields, related }));
  }

  copy(id) {
    const url = joinPath(this.entity, joinPath(id, "copy"));
    return this.intercept(() => this.http.get(url));
  }

  post(data) {
    const url = this.entity;
    return this.intercept(() => this.http.post(url, { data }));
  }

  put(data) {
    const url = this.entity;
    return this.intercept(() => this.http.put(url, { data }));
  }

  delete(id) {
    const url = joinPath(this.entity, id);
    return this.intercept(() => this.http.delete(url));
  }

  deleteAll(records) {
    const url = joinPath(this.entity, "removeAll");
    return this.intercept(() => this.http.post(url, { records }));
  }

  action(actionName = "", data = {}) {
    let url = `${this.baseURL}ws/action${
      actionName === "" ? "" : `/${actionName}`
    }`;
    url = url.replace("/rest", "/action");
    const payload = data.data ? data : { data, action: data.action, model: data.model };
    if (this.entityModel) {
      payload.model = this.entityModel;
    }
    return this.intercept(() => this.http.post(url, payload));
  }

  fields(modelName) {
    const model = modelName || this.entityModel;
    const url = `${this.baseURL}ws/meta/fields/${model}`;
    return this.intercept(() => this.http.get(url));
  }

  models() {
    const url = joinPath(this.baseURL, "ws/meta/models");
    return this.intercept(() => this.http.get(url));
  }

  view(data) {
    const url = joinPath(this.baseURL, "ws/meta/view");
    return this.intercept(() => this.http.post(url, data));
  }

  info(baseUrl = "", doIntercept = true, infoURL = "ws/app/info") {
    const base = baseUrl || this.baseURL;
    const url = joinPath(base, infoURL);
    return doIntercept
      ? this.intercept(() => this.http.get(url))
      : this.http.get(url);
  }

  auth(baseUrl = "", sessionId) {
    const base = baseUrl || this.baseURL;
    const url = joinPath(base, "auth?sid=" + sessionId);
    return this.http.get(url);
  }

  server(baseUrl = "") {
    const base = baseUrl || this.baseURL;
    const url = joinPath(base, "server");
    return this.http.get(url);
  }

  upload(data = null, headers = {}, callback = () => true, info = {}) {
    return new Promise((resolve, reject) => {
      const baseURL = this.baseURL;
      const xhr = new XMLHttpRequest(),
        method = "POST",
        url = joinPath(this.baseURL, "ws/files/upload");

      const doClean = () =>
        headers["X-File-Id"]
          ? this.intercept(() =>
              this.http.delete(
                joinPath(
                  this.baseURL,
                  "ws/files/upload/" + headers["X-File-Id"]
                )
              )
            )
          : Promise.resolve(true);

      const formatSize = (done, total) => {
        const format = size => {
          if (size > 1000000000)
            return parseFloat(size / 1000000000).toFixed(2) + " GB";
          if (size > 1000000)
            return parseFloat(size / 1000000).toFixed(2) + " MB";
          if (size >= 1000) return parseFloat(size / 1000).toFixed(2) + " KB";
          return size + " B";
        };
        return format(done || 0) + "/" + format(total);
      };

      xhr.open(method, url, true);

      Object.keys(headers).forEach(k => {
        xhr.setRequestHeader(k, headers[k]);
      });

      xhr.withCredentials = true;
      xhr.overrideMimeType("application/octet-stream");
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

      xhr.onload = () => {
        callback(100);
      };

      info.abort = () => {
        xhr.abort();
        return doClean();
      };

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 401:
              this.callbackInterceptor();
              throw new Error("Unauthorized");
            case 200:
              try {
                const result = JSON.parse(xhr.responseText);
                resolve({
                  result,
                  url: `${baseURL}ws/rest/com.axelor.meta.db.MetaFile/${result.id}/content/download?v=0`
                });
              } catch (e) {
                resolve(xhr.responseText);
              }
              break;
            default:
              doClean();
              reject({ status: xhr.status });
              break;
          }
        }
      };

      xhr.upload.onprogress = e => {
        const fileSize = headers["X-File-Size"];
        const total = parseFloat(headers["X-File-Offset"]) + e.loaded;
        const done = Math.round((total / fileSize) * 100);

        info.progress = done > 95 ? "95%" : done + "%";
        info.transfer = formatSize(total, fileSize);
        info.loaded = total === fileSize;

        if (e.lengthComputable) {
          callback((e.loaded / e.total) * 100, info);
        }
      };

      xhr.send(data);
    });
  }

  uploadFile({ values, field, file }, callback = () => true, info = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(),
        method = "POST",
        url = joinPath(this.baseURL, "ws/rest/" + this.entity + "/upload"),
        data = new FormData();

      xhr.open(method, url, true);

      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "multipart/form-data");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

      xhr.onload = () => {
        callback(100);
      };

      info.abort = () => {
        xhr.abort();
      };

      data.append("file", file);
      data.append("field", field);
      data.append("request", JSON.stringify({ data: values }));

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 401:
              this.callbackInterceptor();
              throw new Error("Unauthorized");
            case 200:
              try {
                const result = JSON.parse(xhr.responseText);
                resolve(result);
              } catch (e) {
                resolve(xhr.responseText);
              }
              break;
            default:
              reject({ status: xhr.status });
              break;
          }
        }
      };

      xhr.upload.onprogress = e => {
        callback(Math.round((e.loaded * 100) / e.total));
      };

      xhr.send(data);
    });
  }

  downloadFile(id) {
    const url = joinPath(this.baseURL, "ws/dms/download/" + id);
    return this.intercept(() => this.http.get(url));
  }

  downloadMetaFile(id, version) {
    const url = joinPath(this.baseURL, `ws/rest/com.axelor.meta.db.MetaFile/${id}/content/download?v=0`);
    return this.intercept(() => this.http.get(url));
  }

  wsFilesURL(data) {
    const url = joinPath(this.baseURL, data);
    // return this.intercept(() => this.http.get(url));
    return Promise.resolve(url);
  }

  messages({ id, offset = 0, limit = 4 } = {}) {
    return this.request(
      `ws/rest/com.axelor.mail.db.MailMessage/messages?limit=${limit}&offset=${offset}&relatedId=${id}&relatedModel=${this.entityModel}`
    );
  }

  removeMessage(data) {
    return this.request(
      `ws/rest/com.axelor.mail.db.MailMessage/${data.id}/remove`,
      "post",
      { data }
    );
  }

  comment({ id, body = "", files = [] } = {}) {
    return this.request(`ws/rest/${this.entityModel}/${id}/message`, "post", {
      data: {
        body,
        files,
        type: "comment"
      }
    });
  }
}

export default RestService;
