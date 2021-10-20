
const model = "com.axelor.apps.quality.db.QualityControl";

const fields = [
  "name",
  "fullName",
  "project",
  "startDate",
  "endDate",
  "deadLineDate",
  "statusSelect",
  "qualityProcess",
  "responsible",
  "team",
  "product",
  "controlPointList",
  "optionalControlPointList",
  "qualityCorrectiveActionList",
  "inspectorSignature",
  "customerSignature",
  "metaFile",
  "printingSettings"
];

const mapFields = {
  name: "name",
  fullName:"full_name",
  project:"project",
  startDate:"start_date",
  endDate:"end_date",
  deadLineDate:"dead_line_date",
  statusSelect:"status_select",
  qualityProcess:"quality_process",
  responsible:"responsible",
  team:"team",
  product:"product",
  controlPointList:"control_point_list",
  optionalControlPointList:"optional_control_point_list",
  qualityCorrectiveActionList:"quality_corrective_action_list",
  inspectorSignature:"inspector_signature",
  customerSignature:"customer_signature",
  metaFile:"metaFile",
  printingSettings: "printing_settings"
};

const mapLabels = {
  name: "quality.name",
  fullName:"quality.fullName",
  project:"quality.project",
  startDate:"quality.startDate",
  endDate:"quality.endDate",
  deadLineDate:"quality.deadLineDate",
  statusSelect:"quality.statusSelect",
  qualityProcess:"quality.qualityProcess",
  responsible:"quality.responsible",
  team:"quality.team",
  product:"quality.product",
  controlPointList:"quality.controlPointList",
  optionalControlPointList:"quality.optionalControlPointList",
  qualityCorrectiveActionList:"quality.qualityCorrectiveActionList",
  inspectorSignature:"quality.inspectorSignature",
  customerSignature:"quality.customerSignature"

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
