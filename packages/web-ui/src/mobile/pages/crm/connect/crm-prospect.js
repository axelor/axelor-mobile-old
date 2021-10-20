import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...customer} = props;
  const api = customer;
  return { customer, api };
}

export const model = {
  name: 'CRMCustomerProspect',
  refs: [{
    model: 'Source', field: 'source'
  }, {
    model: 'User', field: 'user'
  }, {
    model: 'Company', field: 'company'
  }, {
    model: 'Currency', field: 'currency'
  }, {
    model: 'MetaSelect', field: '',
  }, {
    model: 'Industry', field: 'industry_sector',
  }, {
    model: 'Category', field: 'partner_category',
  }, {
    model: 'SaleContact', field: 'contact_partner_set',
  }, {
    model: 'MetaSelect'
  }, {
    model: 'PartnerAddress', field: 'partner_address_list'
  }, {
    model: 'ParentPartner', field: 'parent_partner'
  }, {
    model: 'Event', field: ''
  }],
};

export default (CRMComponent) => connect(mapConnectToProps)(CRMComponent, model);
