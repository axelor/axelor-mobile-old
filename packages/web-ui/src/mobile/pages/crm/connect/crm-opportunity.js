import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...opportunity} = props;
  const api = opportunity;
  return { opportunity, api };
}

export const model = {
  name: 'Opportunity',
  refs: [{
    model: 'Source', field: 'source'
  },{
    model: 'User', field: 'user'
  },{
    model: 'Company', field: 'company'
  },{
    model: 'Customer', field: 'partner'
  },{
    model: 'Currency', field: 'currency'
  }, {
    model: 'Lead', field: 'lead'
  }, {
    model: 'OpportunityType', field: 'opportunity_type'
  }],
};

export default (CRMComponent) => connect(mapConnectToProps)(CRMComponent, model);
