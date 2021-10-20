import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  Modal,
  ProgressCircular
} from "react-onsenui";
import connect from "../../connect/qualitycontrol";
import { CardView, SignatureCanvas } from "../../../../components";
import { translate } from "../../../../locale";
import SignatureCustomer from "./Signature-customer";
import Page from "../../../page";
import "../../../styles.css";

export class SignatureInspector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      edit: true,
      signature: null
    };
    this.signaturePad = null;
  }

  onBackButtonClick() {
    this.props.navigator.popPage();
  }

  getSignature(signURL) {
    const { signature } = this.state;
    const src = signature || signURL;
    return (
      <CardView title={translate("app.quality.signature")}>
        {src && <img src={src} alt="" />}
      </CardView>
    );
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
    const { setSign, setCustomerSign } = this.props.route;
    if (setSign && this.signaturePad) {
      setSign(this.signaturePad.toDataURL(), "inspector");
    }
    this.props.navigator.pushPage(
      {
        component: SignatureCustomer,
        path: "SignatureCustomer_" + Date.now(),
        data: data,
        setSign: this.props.route.setSign,
        setCustomerSign: setCustomerSign,
        navigator: this.props.navigator
      },
      { animation: "none" }
    );
  }

  renderBottomBar(data) {
    return (
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
    );
  }

  render() {
    const { isLoading } = this.state;
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
      >
        <div style={{ margin: 20 }}>
          <h3>{translate("app.quality.AddaSignatureInspector")}</h3>
        </div>
        <SignatureCanvas onInit={e => (this.signaturePad = e)} />
      </Page>
    );
  }
}

SignatureInspector.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
SignatureInspector = reduxConnect(mapPropsToState)(SignatureInspector);

export const SignatureListComponent = SignatureInspector;

export default connect(SignatureInspector);
