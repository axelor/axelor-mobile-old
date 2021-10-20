import { connect } from "@axelor/web-client";

const mapConnectToProps = props => {
  const { ...leaveline } = props;
  const api = leaveline;
  return { leaveline, api };
};

const model = {
  name: "LeaveLine",
  refs: [
    { model: "LeaveReason", field: "leaveLine" },
    {
      model: "Responsible",
      field: "responsible"
    }
  ]
};

export const models = [model];

export default LeaveComponent =>
  connect(mapConnectToProps)(LeaveComponent, model);
