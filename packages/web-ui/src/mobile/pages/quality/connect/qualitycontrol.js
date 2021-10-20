import { connect } from "@axelor/web-client";

const mapConnectToProps = props => {
  const { ...qualitycontrol } = props;
  const api = qualitycontrol;
  return { qualitycontrol, api };
};

export const model = {
  name: "QualityControl",
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
      model: "Product",
      field: "product"
    },
    {
      model: "Team",
      field: "team"
    },
    {
      model: "MetaFile",
      field: "metafile"
    },
    {
      model: "Responsible",
      field: "responsible"
    },
    {
      model: "QualityProcess",
      field: "qualityProcess"
    },
    {
      model: "ControlPoint",
      field: "controlPointList"
    },
    {
      model: "MeasurePoint",
      field: "measurePointList"
    },
    {
      model: "Wizard",
      field: "wizard"
    },
    {
      model: "Company",
      field: "company"
    },
  ]
};

export default QualityControlComponent =>
  connect(mapConnectToProps)(QualityControlComponent, model);
