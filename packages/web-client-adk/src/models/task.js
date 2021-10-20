const model = "com.axelor.apps.project.db.ProjectTask";

const fields = [
  "taskEndDate",
  "taskDate",
  "name",
  "priority",
  "description",
  "status",
  "parentTask",
  "project",
  "team",
  "assignedTo",
  "fullName",
  "description",
  "currency",
  "taskDeadline",
  "metaFile"
];

const mapFields = {
  taskEndDate: "task_end_date",
  taskDate: "task_date",
  name: "name",
  priority: "priority",
  description:"description",
  status: "status",
  parentTask: "parent_task",
  project: "project",
  team: "team",
  assignedTo: "assigned_to",
  fullName: "fullName",
  currency: "currency",
  taskDeadline:"task_deadline",
  metaFile: "metaFile",
};

const mapLabels = {
  taskEndDate: "Task.taskEndEate",
  taskDate: "Task.taskDate",
  name: "Task.name",
  priority: "Task.priority",
  status: "Task.status",
  description:"Task.description",
  name: "Task.name",
  parentTask: "Task.parentTask",
  project: "Task.project",
  team: "Task.team",
  assignedTo: "Task.assignedTo",
  fullName: "Task.fullName",
  currency: "Task.currency",
  taskDeadline:"Task.taskDeadline"
};

const responseMapper = (data, rest) => {
  if (!data.metaFile) return data;
  return Object.assign({}, data, {
    signURL: `${rest.baseURL}ws/rest/com.axelor.meta.db.MetaFile/${
      data.metaFile.id
    }/content/download?image=true&v=${data.version}`
  });
};

export default {
  model,
  fields,
  mapFields,
  mapLabels,
  responseMapper
};
