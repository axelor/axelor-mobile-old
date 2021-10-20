import ADKConnector, { ADKConnector as ADKAPI } from '@axelor/web-client-adk';
import { MODULES } from './modules';

// extending ADK Connector
export default (configs = {}) => (store) => (options) => {
  const Contract = (options['name'] && MODULES[options['name']]) ? MODULES[options['name']] : ADKAPI;
  return ADKConnector(configs)(store)(
    options,
    Contract,
  );
};


