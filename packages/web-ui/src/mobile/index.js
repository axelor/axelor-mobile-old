import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from '@axelor/web-client';
import { Locale } from '@axelor/web-client-adk';
import dotize from './locale/dotize';
import App from './app';
import ROUTES from './pages';
import reducers from './redux/reducers';
import * as ACTIONS from './redux/actions';

const store = createStore(reducers);

for(let key in Locale) {
  const data = Locale[key];
  store.dispatch(ACTIONS.setLocaleStore(key, dotize.convert(data)));
}

export default (props = {}) => (
  <Provider store={store}>
    <App routes={ROUTES} />
  </Provider>
);
