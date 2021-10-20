import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {  ...order } = props;
  return { order };
}

export const model = {
  name: 'SaleQuotation',
  refs: [{
    model: 'User', field: 'user'
  }, {
    model: 'Currency', field: 'currency'
  }, {
    model: 'OrderLine', field: 'sale_order_line_list'
  }, {
    model: 'SaleCustomer', field: 'client_partner',
  }, {
    model: 'SaleContact', field: 'contact_partner',
  }, {
    model: 'Duration', field: 'duration',
  }, {
    model: 'PaymentCondition', field: 'payment_condition',
  }, {
    model: 'PaymentMode', field: 'payment_mode',
  }, {
    model: 'Company', field: 'company'
  }, {
    model: 'OrderLineTax', field: 'sale_order_line_tax_list'
  }],
};

export default (SaleComponent) => connect(mapConnectToProps)(SaleComponent, model);
