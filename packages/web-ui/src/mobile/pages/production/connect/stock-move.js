import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...stockmove} = props;
  const api = stockmove;
  return { stockmove, api };
}

export const model = {
  name: 'StockMove',
  refs: [{
    model: 'User', field: 'user',

  },
  {model: 'Company', field: 'company'},
  {model: 'StockMoveLine', field: 'stockMoveLineList'},
  { model: "AppBase" },
  { model: "App" },
  { model: "AppProduction"}
],
};

export default (OperationOrdersComponent) => connect(mapConnectToProps)(OperationOrdersComponent, model);
