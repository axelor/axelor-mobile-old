import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  Modal,
  ProgressCircular,
  Switch
} from "react-onsenui";

import connect from "../../connect/qualitycontrol";
import { CardView } from "./../../../../components";
import SignatureInspector from "./Signature-inspector";
import { translate } from "../../../../locale";
import Page from "../../../page";
import "../controlPoint/index.css";

export class CorrectiveActionsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      edit: true,
      keyboard: false,
      quality_corrective_action_list: []
    };
  }

  addEventListener() {
    window.addEventListener("native.keyboardshow", () =>
      this.setState({ keyboard: true })
    );
    window.addEventListener("native.keyboardhide", () =>
      this.setState({ keyboard: false })
    );
  }

  componentDidMount() {
    const { data } = this.props.route;
    const { quality_corrective_action_list = [] } = data;
    this.setState({ quality_corrective_action_list });
    this.addEventListener();
  }

  onBackButtonClick() {
    this.props.navigator.popPage();
  }

  renderToolbar() {
    const { data } = this.props.route;
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: "#fff" }}>
        <div className="left left-icon-width">
          <ToolbarButton
            onClick={() => this.onBackButtonClick()}
            style={{ color: "gray" }}
          >
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div
          className="center ellipse-toolbar left-align-title"
          style={{ color: "#000" }}
        >
          <span
            onClick={() => this.onBackButtonClick()}
            style={{ display: "inline-block" }}
          >
            {data.name || ""}
          </span>
        </div>
      </Toolbar>
    );
  }

  onNext(data) {
    const { setCustomerSign } = this.props.route;
    this.props.navigator.pushPage(
      {
        component: SignatureInspector,
        path: "SignatureInspector_" + Date.now(),
        data: data,
        navigator: this.props.navigator,
        setSign: this.props.route.setSign,
        setCustomerSign: setCustomerSign
      },
      { animation: "none" }
    );
  }

  onChange(name, value, index) {
    const { onChange } = this.props.route;
    const { quality_corrective_action_list } = this.state;
    const recordIndex = quality_corrective_action_list.findIndex(
      q => q.id === index
    );
    const record = quality_corrective_action_list[recordIndex];
    quality_corrective_action_list[recordIndex] = { ...record, [name]: value };
    onChange(quality_corrective_action_list);
    this.setState({ quality_corrective_action_list });
  }

  renderBottomBar(data) {
    const { keyboard } = this.state;
    return (
      !keyboard && (
        <div
          className="camera-container"
          style={{
            backgroundColor: "#2F84D0",
            display: "flex",
            justifyContent: "flex-end",
            color: "white"
          }}
          onClick={e => this.onNext(data)}
        >
          <span style={{ marginRight: 10 }}>
            {translate("app.quality.bottomBarLabelNext")}
          </span>
        </div>
      )
    );
  }

  render() {
    const { isLoading, quality_corrective_action_list, keyboard } = this.state;
    const { data } = this.props.route;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
        renderModal={
          isLoading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={isLoading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
        renderBottomBar={this.renderBottomBar(data)}
        isMenuVisible={!keyboard}
      >
        <div style={{ margin: 20 }}>
          <h3>{translate("app.quality.correctiveActions")}</h3>
        </div>
        {quality_corrective_action_list &&
          quality_corrective_action_list.map((cp, index) => (
            <CardView key={cp.id} style={{ padding: 17 }}>
              <div key={index}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <CardView.InputField
                      edit={false}
                      value={cp && cp.name}
                      onChange={e =>
                        this.onChange("name", e.target.value, cp.id)
                      }
                    />
                  </div>
                  <div>
                    <span className="compliant-switch">
                      <Switch
                        checked={cp.isApplicable}
                        onChange={e =>
                          this.onChange("isApplicable", e.value, cp.id)
                        }
                      />
                    </span>
                  </div>
                </div>
                {cp.isApplicable && (
                  <div>
                    <CardView.InputField
                      edit={this.state.edit}
                      title={translate("app.quality.details")}
                      value={cp && cp.details}
                      onChange={e =>
                        this.onChange("details", e.target.value, cp.id)
                      }
                    />
                  </div>
                )}
              </div>
            </CardView>
          ))}
      </Page>
    );
  }
}

CorrectiveActionsList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
CorrectiveActionsList = reduxConnect(mapPropsToState)(CorrectiveActionsList);

export const CorrectiveActionsListComponent = CorrectiveActionsList;

export default connect(CorrectiveActionsList);
