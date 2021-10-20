import { connect } from '@axelor/web-client';

const mapConnectToProps = (props) => {
  const {...event} = props;
  const api = event;
  return { event, api };
}

export const model = {
  name: 'Event',
  refs: [{
    model: 'User', field: 'user'
  },{
    model: 'CRMCustomer', field: 'client_partner'
  }, {
    model: 'MeetingType', field: 'meeting_type'
  }, {
    model: 'Lead', field: 'lead'
  }, {
    model: 'CRMContact', field: 'contact_partner'
  }],
};

export default (CRMComponent) => connect(mapConnectToProps)(CRMComponent, model);
