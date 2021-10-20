const model = "com.axelor.apps.quality.db.QualityMeasuringPoint";

const fields = [
  "name",
  "measuringNote",
  "compliant",
  "photosList",
  "observations",
  "measuringTypeSelect"
];

const mapFields = {
  name: "name",
  measuringNote: "measuring_note",
  compliant: "compliant",
  picturesList: "picturesList",
  observations: "observations",
  measuringTypeSelect: "measuringTypeSelect"
};

const mapLabels = {
  name: "quality.measurePoint.name",
  measuringNote: "quality.measurePoint.measuringNote",
  compliant: "quality.measurePoint.compliant",
  picturesList: "quality.measurePoint.picturesList",
  observations: "quality.measurePoint.observations"
};

const responseMapper = (data, rest) => {
  const { picturesList = [] } = data;
  if (!picturesList.length) return data;
  picturesList &&
    picturesList.forEach(element => {
      if(element.metaFile){
        element.pictureURL = `${
          rest.baseURL
        }ws/rest/com.axelor.meta.db.MetaFile/${
          element.metaFile.id
        }/content/download?image=true&v=${element.version}`;
      }
    });
  return Object.assign({}, data, { ...data, picturesList });
};

export default {
  model,
  fields,
  mapFields,
  mapLabels,
  responseMapper
};
