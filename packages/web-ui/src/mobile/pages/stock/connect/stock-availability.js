import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...product} = props;
  const api = product;
  return { product, api };
}

export const model = {
  name: 'Product',
  refs: [{
    model: 'User', field: 'user',

  },
  {model: 'StockLocationLine'},
  {model: 'StockLocation'},
  {model: 'AppBase'},
  {model: 'Company'}
],
};

export default (StockAvailablityComponent) => connect(mapConnectToProps)(StockAvailablityComponent, model);
