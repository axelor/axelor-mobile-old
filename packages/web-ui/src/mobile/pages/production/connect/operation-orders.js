import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...operationorder} = props;
  const api = operationorder;
  return { operationorder, api };
}

export const model = {
  name: 'OperationOrder',
  refs: [{
    model: 'User', field: 'user',

  },
  {model: 'Company', field: 'company'},
  {model: 'ProdProcessLine', field: 'prodProcessLine'},
  {model: 'WorkCenter', field: 'workCenter'},
  {model: 'Machine', field: 'machine'},
  {model: 'Product', field: 'product'},
  {model: 'ProdHumanResource', field: 'prodHumanResourceList'},
  {model: 'ProdProduct', field: 'toConsumeProdProductList'},
  {model: 'StockMove', field: 'inStockMoveList'},
  {model: 'ObjectDescription', field: 'prodProcessLine.objectDescriptionList'},
  {model: 'ManufOrder', field: 'manufOrder'},
  { model: "AppBase" },
  { model: "App" },
  { model: "AppProduction"}
],
};

export default (OperationOrdersComponent) => connect(mapConnectToProps)(OperationOrdersComponent, model);
