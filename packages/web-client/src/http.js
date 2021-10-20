/**
 * Http Client Library to perform requests on server
 */
export class Http {
  constructor() {
    // common http headers
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('X-Requested-With', 'XMLHttpRequest');
    this.headers = headers;
  }

  /**
   * perform window fetch request in browser
   * @param {String} url - URL to perform request
   * @param {Object} options - options for fetch api
   * @returns {Promise} - resolve when fetch request is completed
   */
  fetch(url, options = {}) {
    return fetch(url, options);
  }

  /**
   * add headers and configure request
   * @param {String} url - URL to perform request
   * @param {Object} data - data for the request
   * @param {Object} config - override options for fetch
   * @returns {Promise} - resolve when request is completed
   */
  request(url, data = {}, config = {}) {
    const options = Object.assign({
      method: 'POST',
      mode: 'cors',
      headers: this.headers,
      credentials: 'include',
      body: JSON.stringify(data),
    }, config);

    // delete body part for GET request
    if (options.method === 'GET') {
      delete options.body;
    }
    return this.fetch(url, options);
  }

  // interceptor for all request
  intercept(url, method = 'GET', data = {}) {
    const config = {
      method,
      credentials: 'include',
    };
    return this.request(url, data, config);
  }

  /**
   * execute get request on server
   * @param {String} url - string url to perform get request
   * @returns {Promise} - resolve when get request is completed
   */
  get(url) {
    return this.intercept(url, 'GET');
  }

  /**
   * execute post request on server
   * @param {String} url - string url to perform post request
   * @param {Object} data - record to be create
   * @returns {Promise} - resolve when post request is completed
   */
  post(url, data) {
    return this.intercept(url, 'POST', data);
  }

  /**
   * execute put request on server
   * @param {String} url - string url to perform put request
   * @param {Object} data - record to be update
   * @returns {Promise} - resolve when put request is completed
   */
  put(url, data) {
    return this.intercept(url, 'PUT', data);
  }

  /**
   * execute delete request on server
   * @param {String} url - string url to perform delete request
   * @returns {Promise} - resolve when delete request is completed
   */
  delete(url) {
    return this.intercept(url, 'DELETE');
  }
}

export default Http;
