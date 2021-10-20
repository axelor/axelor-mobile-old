import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const { refs: { unit, taxline }, ...orderline } = props;
  return { unit, orderline, taxline };
}

export const model = {
  name: 'OrderLine',
  refs: [{
    model: 'Unit', field: 'unit'
  }, {
    model: 'TaxLine', field: 'tax'
  }],
};

export default (SaleComponent) => connect(mapConnectToProps)(SaleComponent, model);
