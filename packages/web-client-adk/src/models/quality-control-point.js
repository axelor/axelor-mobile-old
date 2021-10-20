
const model = "com.axelor.apps.quality.db.ControlPoint";

const fields = [
"name",
"team",
"controlPointDate",
"measuringPointList",
"statusSelect",
"notes",
"controlPointType"
];

const mapFields = {
  name: "name",
  team: "team",
  controlPointDate: "control_point_date",
  measuringPointList: "measuring_point_list",
  statusSelect: "status_select",
  notes: "notes",
  controlPointType: "control_point_type"
};

const mapLabels = {
  name: "quality.controlPoint.name",
  team: "quality.controlPoint.team",
  controlPointDate: "quality.controlPoint.controlPointDate",
  controlPointType: "quality.controlPoint.controlPointType"
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
