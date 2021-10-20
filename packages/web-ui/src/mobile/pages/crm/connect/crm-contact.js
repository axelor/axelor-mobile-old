import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...contact} = props;
  const api = contact;
  return { contact,api}
}

export const model = {
  name: 'CRMContact',
  refs: [{
    model: 'User', field: 'user'
  }, {
    model: 'MetaSelect', field: '',
  }, {
    model: 'SaleCustomer', field: 'main_partner',
  }, {
    model: 'Team', field: 'team',
  }, {
    model: 'Company', field: 'company'
  }, {
    model: 'SaleContact', field: 'contact'
  }, {
    model: 'Event', field: ''
  }],
};

export default (CRMComponent) => connect(mapConnectToProps)(CRMComponent, model);
