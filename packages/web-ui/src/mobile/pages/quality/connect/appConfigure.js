import { connect } from "@axelor/web-client";

const mapConnectToProps = props => {
  const {
    ...appConfig
  } = props;
  return { appConfig };
};

export const model = {
  name: "AppProject",
  refs: [],
};


export default AppConfigComponent =>
  connect(mapConnectToProps)(AppConfigComponent, model);
