import React, { Component } from 'react';
import ons from 'onsenui';
import { Navigator } from 'react-onsenui';
import { createStore } from '@axelor/web-client';
import { REDUX_ACTIONS as ACTIONS, getSettings } from '@axelor/web-client';
import * as MOBILE_ACTIONS from "./redux/actions";

import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

import {translate} from "./locale"

class App extends Component {
  constructor(props) {
    super(props);
    this._navigator = null;
    this.showConfirmation = false;
  }

  getAlertElements(list) {
    const elementList = [];
    for (var element of list) {
      if(element.id) {
        elementList.push(element);
      }
    }
    return elementList;
  }

  componentDidMount() {
    ons.ready(() => {
      ons.disableDeviceBackButtonHandler();
      document.addEventListener('backbutton', (e) => {
        const lastRoute = this._navigator.routes[this._navigator.routes.length-1];
        const { backListener = true } = lastRoute;
        const state = store.getState();
        if (this._navigator && backListener && state.apps.backListener !== false) {
          const elements = document.getElementsByTagName("ons-alert-dialog");
          const list = this.getAlertElements(elements);
          if(list.length) {
            for (var element of list) {
              element.id && element.remove();
            }
          } else if (this._navigator.routes.length > 1) {
            this._navigator.popPage();
          } else {
            if (!this.showConfirmation) {
              this.showConfirmation = true;
              ons.notification.confirm(translate('app.appClose'), {title: translate('Alert.confirm')})
              .then((index) => {
                this.showConfirmation = false;
                if (index === 1) {
                  navigator.app.exitApp();
                }
              });
            }
          }
        }
        if(state.apps.backListener === false) {
          store.dispatch(MOBILE_ACTIONS.enableBackButton());
        }
      }, false);
    });

    const store = createStore();
    store.subscribe(() => {
      const settings = getSettings()();
      if(store.getState().app.error === 'Error: Unauthorized') {
        store.dispatch(ACTIONS.setAppError(null));
        store.dispatch(ACTIONS.setAppMode('online'));
        settings.init()
        .then((data) => {
          settings.save({ ...data, password: '' });
          this._navigator.resetPageStack([{
            name: 'Login',
            payload: {...data, password: '' },
          }]);
        });
      }
    });
  }

  render() {
    const { routes } = this.props;
    return (
      <Navigator
        onDeviceBackButton={(e) => {}}
        renderPage={(route, navigator) => {
          this._navigator = navigator;
          let Route = route.component ? { component: route.component, path: route.path || false } : routes.find(r => r.path === route.name);
          if (!Route || !Route.component) {
            Route = routes.find(r => r.path === 'NotFound');
          };
          const RenderPage = Route.component;
          const key = route.key || Route.path;
          const mainProps = route.mainProps || {};
          const Page = <RenderPage {...mainProps} {...{ navigator, route, key }} />;
          return Page;
        }}
        onPrePush={({ routes : { pushingRoute : { name, path }}}) => {
          const store = createStore();
          store.dispatch(ACTIONS.setRoute(name || path || 'Unknown'));
        }}
        onPrePop={({ routes : { routes }}) => {
          const lastPage = routes[routes.length-2];
          const { name, path } = lastPage;
          const store = createStore();
          store.dispatch(ACTIONS.setRoute(name || path || 'Unknown'));
        }}
        initialRoute={{
          name: 'Home',
          main: true,
          splash: true,
        }}
        />
      );
  }
}

export default App;
