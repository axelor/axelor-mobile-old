
const model = "com.axelor.apps.quality.db.QualityProcess";

const fields = [
  "code",
  "name",
  "controlPointModelList",
  "optionalControlPointModelList",
  "qualityCorrectiveActionList"
];

const mapFields = {
  name: "name",
  code:"code",
  controlPointModelList:"controlPointModelList",
  optionalControlPointModelList:"optionalControlPointModelList",
  qualityCorrectiveActionList:"qualityCorrectiveActionList"

};

const mapLabels = {
  name: "quality.qualityProcess.name",
  code:"quality.qualityProcess.code",
  controlPointModelList:"quality.qualityProcess.control_point_model_list",
  optionalControlPointModelList:"quality.qualityProcess.optional_control_point_model_list",
  qualityCorrectiveActionList:"quality.qualityProcess.quality_corrective_action_list",

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
