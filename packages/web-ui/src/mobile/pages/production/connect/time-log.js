import { connect } from '@axelor/web-client';

const model = {
  name: 'TimeLogLine',
  refs: [
    { model: 'TimesheetActivity', field: 'product' },
    { model: 'TaskProject', field: 'project' },
    { model: 'ManufOrder'},
    { model: 'OperationOrder'},
    { model: 'Timesheet'},
  ],
}

const mapConnectToProps = (props) => {
  const {...timesheetline} = props;
  const api = timesheetline;
  return { timesheetline, api };
}

export const models = [model];

export default (TimeLogComponent) => connect(mapConnectToProps)(TimeLogComponent, model);
