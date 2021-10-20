import React from "react";
import PropTypes from "prop-types";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  Modal,
  ProgressCircular
} from "react-onsenui";
import { connect as reduxConnect } from "react-redux";
import connect from "../../connect/qualitycontrol";
import { CardView } from "./../../../../components";
import ControlPoint from "../controlPoint/index";
import { translate } from "../../../../locale";
import Page from "../../../page";

export class OptionalControlPointList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSelect: "",
      isLoading: false
    };
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

  async addOptionalControlPoint(cp, data) {
    this.setState({ isSelect: cp.id });
    const {
      onSave,
      getRecordsByIndex,
      recordIndex,
      updateControl,
      recordList
    } = this.props.route;
    const { copy, add } = this.props.qualitycontrol.refs.controlpoint;
    try {
      this.setState({
        isLoading: true
      });
      let res = await copy(cp);
      if (res && res.data && res.data.length > 0) {
        const copyOptionalControl = res.data[0];
        if (copyOptionalControl) {
          let newOptionalControlPoint = await add({
            ...copyOptionalControl,
            optionalQualityControl: null
          });
          this.setState({
            isLoading: false
          });
          if (
            newOptionalControlPoint &&
            newOptionalControlPoint.data &&
            newOptionalControlPoint.data.length > 0
          ) {
            const optionalControl = newOptionalControlPoint.data[0];
            this.props.navigator.pushPage({
              component: ControlPoint,
              key: "ControlPoint" + Date.now(),
              data: optionalControl,
              selectOption: optionalControl,
              control: data,
              onSave,
              getRecordsByIndex,
              recordIndex,
              updateControl,
              recordList,
              navigator
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    let { isLoading, isSelect } = this.state;
    let { data, optional_control_point_list = [] } = this.props.route;
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
      >
        <div style={{ textAlign: "center", padding: 10 }}>
          <h3>{translate("app.quality.addControlPoint")}</h3>
        </div>
        {optional_control_point_list &&
        optional_control_point_list.length > 0 ? (
          optional_control_point_list.map(cp => (
            <CardView
              key={cp.id}
              style={{
                padding: 17,
                border: isSelect === cp.id ? "1px solid rgb(47, 132, 208)" : ""
              }}
              onClick={e => {
                this.addOptionalControlPoint(cp, data);
              }}
            >
              {cp.name}
            </CardView>
          ))
        ) : (
          <div style={{ textAlign: "center", fontSize: "9pt", padding: 10 }}>
            <span>{translate("app.quality.alreadyAdded")}</span>
          </div>
        )}
      </Page>
    );
  }
}

OptionalControlPointList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
OptionalControlPointList = reduxConnect(mapPropsToState)(
  OptionalControlPointList
);

export const ProcessListComponent = OptionalControlPointList;

export default connect(OptionalControlPointList);
