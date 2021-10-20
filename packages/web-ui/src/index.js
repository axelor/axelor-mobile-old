import React from 'react';
import ReactDOM from 'react-dom';
import { configure } from '@axelor/web-client';
import getADKConnector from '@axelor/web-client-adk-module';
import App from './mobile';

const ADKConnector = getADKConnector({});

configure(
  // connector
  ADKConnector,
  // connect configuration
  {
    offline: true,
  },
);

ReactDOM.render(<App />, document.getElementById('root'));
