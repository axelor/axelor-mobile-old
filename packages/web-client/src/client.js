/**
 * Abstract WebClient Class
 */
class WebClient {
  // bind connector and methods
  constructor(connector) {
    this.connector = connector;
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.info = this.info.bind(this);
    this.search = this.search.bind(this);
    this.add = this.add.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.fetch = this.fetch.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.jsonFields = this.jsonFields.bind(this);
    this.message = this.message.bind(this);
    this.action = this.action.bind(this);
    this.app = this.app.bind(this);
    this.fields = this.fields ? this.fields.bind(this) : [];
    this.offline = this.offline ? this.offline.bind(this) : {};
    this.copy = this.copy.bind(this);
  }

  login(url, user, pass) {
    return this.connector.login(url, user, pass);
  }

  logout() {
    return this.connector.logout();
  }

  info() {
    return this.connector.info();
  }

  search(...opts) {
    return this.connector.search(...opts)
  }

  add(...opts) {
    return this.connector.add(...opts);
  }

  update(...opts) {
    return this.connector.update(...opts);
  }

  remove(...opts) {
    return this.connector.remove(...opts);
  }

  fetch(...opts) {
    return this.connector.fetch(...opts);
  }

  jsonFields(...opts) {
    return this.connector.jsonFields(...opts);
  }

  uploadFile(...opts) {
    return this.connector.uploadFile(...opts);
  }

  downloadFile(...opts) {
    return this.connector.downloadFile(...opts);
  }
  downloadMetaFile(...opts) {
    return this.connector.downloadMetaFile(...opts);
  }

  wsFilesURL(...opts) {
    return this.connector.wsFilesURL(...opts);
  }

  fields(...opts) {
    return this.connector.fields(...opts);
  }

  offline(...opts) {
    return this.connector.offline(...opts);
  }

  action(...opts) {
    return this.connector.action(...opts);
  }

  message(data) {
    return this.connector.message(data);
  }

  copy(...opts) {
    return this.connector.copy(...opts);
  }

  app() {
    return this.connector.app();
  }
}

export default WebClient;
