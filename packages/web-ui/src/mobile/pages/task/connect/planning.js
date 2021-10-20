import { connect } from "@axelor/web-client";

const mapConnectToProps = props => {
  const {
    ...projectPlanningTime
  } = props;
  const api = projectPlanningTime;
  return { projectPlanningTime, api };
};

export const model = {
  name: "ProjectPlanningTime",
  refs: [
    {
      model: "Project",
      field: "project"
    },
    {
      model: "Task",
      field: "task"
    }
  ]
};

export default (PlanningComponent) =>
  connect(mapConnectToProps)(PlanningComponent, model);
