import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...lead} = props;
  const api = lead;
  return { lead, api };
}

export const model = {
  name: 'Lead',
  refs: [{
    model: 'User', field: 'user'
  }, {
    model: 'Source', field: 'source'
  }, {
    model: 'Industry', field: 'industry_sector'
  }, {
    model: 'Team', field: 'team'
  }, {
    model: 'Event', field: 'event_list'
  }, {
    model: 'Country', field: 'primary_country'
  }],
};

export default (CRMComponent) => connect(mapConnectToProps)(CRMComponent, model);
