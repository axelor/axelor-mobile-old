import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...inventoryLine} = props;
  const api = inventoryLine;
  return { inventoryLine, api };
}

export const model = {
  name: 'InventoryLine',
  refs: [{
    model: 'User', field: 'user',

  },
  {model: 'Product'},
  {model: 'Inventory'},
  {model: 'StockLocation'},
  {model: 'AppBase'},
  {model: 'Company'},
  {model: 'Unit', field: 'unit'},
  {model: 'TrackingNumber', field: 'trackingNumber'}
],
};

export default (StockAvailablityComponent) => connect(mapConnectToProps)(StockAvailablityComponent, model);
