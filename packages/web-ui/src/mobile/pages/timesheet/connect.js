import { connect } from '@axelor/web-client';

const model = {
  name: 'TimesheetLine',
  refs: [
    { model: 'TimesheetActivity', field: 'product' },
    { model: 'TaskProject', field: 'project' },
    { model: 'ProjectTask', field: 'task'},
  ],
}

const mapConnectToProps = (props) => {
  const { refs: { timesheetactivity: timesheetActivity, taskproject: taskProject, projecttask: projectTask }, ...api } = props;
  return { api, timesheetActivity, taskProject, projectTask };
}

export const models = [model];

export default (TimesheetComponent) => connect(mapConnectToProps)(TimesheetComponent, model);
