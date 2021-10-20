import React from 'react';
import { connect as reduxConnect } from 'react-redux';
import WebConnector from './iconnector';
import Http from './http';
import WebClient from './client';
import Stores from './store';
import getOfflineClient from './offline';
import createStore, { ACTIONS as REDUX_ACTIONS } from './redux';

// singleton connector instance
let connector = () => WebConnector;
// connector options
let connectorOptions = {
  offline: false,
  schema: {},
  mode: 'web',
};

// get configure connector
const getWebClient = (options = {}) => {
  const { offline, mode } = connectorOptions;
  let connectorAPI = (connector()(Stores[mode])(options));

  if (offline) {
    connectorAPI = getOfflineClient(connectorAPI, options, connectorOptions, createStore);
  }

  const connectorInstance = new connectorAPI();
  return new WebClient(connectorInstance);
}

// provide props to connect web client interface
const connectWebClient = ({ name, fields = [], ...rest }, isRef = false) => {
  const webClient = getWebClient({ name, fields, ...rest });
  const baseActions = {
    login: (...params) => {
      return webClient.login(...params);
    },
    logout: () => webClient.logout(),
    info: () => webClient.info(),
    app: () => webClient.app(),
  };
  // return main methods for base model
  if (name === 'BASE') {
    return baseActions;
  }
  // skip fields, offline for reference models
  if (!isRef) {
    baseActions['fields'] = webClient.fields();
    baseActions['offline'] = webClient.offline();
  }
  return {
    ...baseActions,
    search: (options) => webClient.search(options, isRef),
    searchAll: (options) => webClient.search(options, true),
    add: (data) => webClient.add(data),
    update: (data) => webClient.update(data),
    remove: (data) => webClient.remove(data),
    fetch: (data, options) => webClient.fetch(data, options),
    jsonFields: () => webClient.jsonFields(),
    message: (data) => webClient.message(data),
    downloadMetaFile: (data) => webClient.downloadMetaFile(data),
    downloadFile: (data) => webClient.downloadFile(data),
    wsFilesURL: (data) => webClient.wsFilesURL(data),
    action: (...params) => webClient.action(...params),
    uploadFile: (...params) => webClient.uploadFile(...params),
    copy: (data) => webClient.copy(data),
  };
}

// configure connector
export const configure = (newConnector, options) => {
  connector = () => newConnector;
  connectorOptions = Object.assign({}, connectorOptions, options);
};

// get common store settings
export const getSettings = () => {
  return Stores[connectorOptions.mode];
}

/**
 * connect web client props to react component
 * @param {Function} mapState - function that map props object
 * @param {Boolean} isComponent -  is react component or not
 * @returns {Function} - that returns newly wrapped react component
 */
export const connect = (mapState = (e) => e, isComponent = true) => (Component, config = {}) => {
  return (mainProps) => {
    const store = createStore();
    const { refs = null } = config;
    let props = {};
    if (refs) {
      props['refs'] = {};
      refs.forEach(({ model }) => {
        props['refs'][model.toLowerCase()] = connectWebClient({ name: model }, true);
      });
    }
    props['app_state'] = store.getState().app;
    props = Object.assign({}, props, connectWebClient({...config, props }));
    if (isComponent === false) return props;
    return <Component {...mapState(props)} {...mainProps} />;
  };
}

export { Http, createStore, REDUX_ACTIONS, connectWebClient };

export const IConnector = WebConnector;

export default connect;
