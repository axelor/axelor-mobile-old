import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const { app_state, ...product } = props;
  return { product, isOffline: app_state && app_state.mode === 'offline' };
}

export const model = {
  name: 'Product',
};

export default (SaleComponent) => connect(mapConnectToProps)(SaleComponent, model);
