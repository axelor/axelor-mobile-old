import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import reducers from './reducers';
import * as ACTIONS from './actions';
let store = null;

export { ACTIONS };

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/**
 * enhance app reducers
 * @param {Object} - reducers objects
 * @returns {Object} - redux store
 */
export default (appReducers = {}) => {
  if (store === null) {
    store = createStore(
      reducers(appReducers),
      composeEnhancers(applyMiddleware(thunk))
    );
  }
  return store;
};
