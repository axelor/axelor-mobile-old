/**
 * Abstract WebConnector Interface
 */
export default class IWebConnector {
  login(user, pass) {
    return Promise.reject();
  }

  logout() {
    return Promise.reject();
  }

  search(filter) {
    return Promise.reject();
  }

  add(data) {
    return Promise.reject();
  }

  update(data) {
    return Promise.reject();
  }

  remove(data) {
    return Promise.reject();
  }

  fetch(id) {
    return Promise.reject();
  }

  downloadFile(data) {
    return Promise.reject();
  }

  downloadMetaFile(data) {
    return Promise.reject();
  }

  uploadFile(data) {
    return Promise.reject();
  }

  fields() {
    return Promise.reject();
  }

  offline() {
    return {
      save: Promise.reject(),
    }
  }

  action() {
    return Promise.reject();
  }

  jsonFields() {
    return Promise.reject();
  }

  copy() {
    return Promise.reject();
  }

  message() {
    return {
      getAll: () => Promise.reject(),
      add: () => Promise.reject(),
      remove: () => Promise.reject(),
      markAsUnread: () => Promise.reject(),
      markAsImportant: () => Promise.reject(),
    };
  }

  app() {
    return Promise.reject();
  }
}
