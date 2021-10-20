import { connect } from "@axelor/web-client";

const mapConnectToProps = props => {
  const {
    ...task
  } = props;
  const api = task;
  return { task, api };
};

export const model = {
  name: "Task",
  refs: [
    {
      model: "Attachment",
      field: "attachment"
    },
    {
      model: "Project",
      field: "project"
    },
    {
      model: "User",
      field: "assignTo"
    },
    {
      model: "ProjectPlanningTime",
      field: "planning"
    }, {
      model: 'SaleCustomer', field: 'client_partner',
    }, {
      model: 'SaleContact', field: 'contact_partner',
    },
    {
      model: "MetaFile",
      field: "metafile"
    }
  ]
};


export default TaskComponent =>
  connect(mapConnectToProps)(TaskComponent, model);
