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
import { SignatureCanvas, CardView } from "../../../../components";
import { translate } from "../../../../locale";
import Page from "../../../page";
import ControlList from "../list";
import "../../../styles.css";

export class SignatureCustomer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
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

  renderBottomBar(data) {
    return (
      <div
        className="camera-container"
        style={{
          backgroundColor: "#E1AA46",
          display: "flex",
          justifyContent: "flex-end",
          color: "white"
        }}
        onClick={async e => {
          const { setCustomerSign } = this.props.route;
          this.setState({ isLoading: true });
          if (setCustomerSign && this.signaturePad) {
            await setCustomerSign(this.signaturePad.toDataURL());
          }
          this.setState({ isLoading: false });
          this.props.navigator.resetPage(
            {
              component: ControlList,
              path: "SignatureCustomer_" + Date.now(),
              navigator: this.props.navigator
            },
            { animation: "none" }
          );
        }}
      >
        <span style={{ marginRight: 10 }}>
          {translate("app.quality.bottomBarLabelEndControl")}
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
          <h3>{translate("app.quality.AddaSignatureCustomer")}</h3>
        </div>
        <SignatureCanvas onInit={e => (this.signaturePad = e)} />
      </Page>
    );
  }
}

SignatureCustomer.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
SignatureCustomer = reduxConnect(mapPropsToState)(SignatureCustomer);

export const SignatureCustomerListComponent = SignatureCustomer;

export default connect(SignatureCustomer);
