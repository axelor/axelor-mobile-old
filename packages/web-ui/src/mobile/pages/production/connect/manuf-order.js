import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...manuforder} = props;
  const api = manuforder;
  return { manuforder, api };
}

export const model = {
  name: 'ManufOrder',
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
  {model: 'ObjectDescription', field: 'prodProcessLine.objectDescriptionList'},
  {model: 'OperationOrder', field: 'operationOrderList'},
  { model: "AppBase" },
  { model: "App" },
  { model: "AppProduction"}
],
};

export default (OperationOrdersComponent) => connect(mapConnectToProps)(OperationOrdersComponent, model);
