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
import OptionalControlList from "./AddOptionControlPoint";
import { CardView } from "./../../../../components";
import { translate } from "../../../../locale";
import Page from "../../../page";

export class ControlPointTypes extends React.Component {
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

  removeDuplicates = (controlPointTypes = [], prop) => {
    return controlPointTypes.filter((obj, pos, arr) => {
      return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
  };

  getControlPointTypes = () => {
    const { data } = this.props.route;
    let { optional_control_point_list = [] } = data;
    let controlPointTypes = [];

    optional_control_point_list &&
      optional_control_point_list.forEach(point => {
        if (point.controlPointType) {
          controlPointTypes.push(point.controlPointType);
        }
      });
    return this.removeDuplicates(controlPointTypes, "id");
  };

  selectControlPoint(e, cp, data) {
    e.stopPropagation();
    const {
      onSave,
      getRecordsByIndex,
      recordIndex,
      updateControl,
      recordList
    } = this.props.route;
    let { optional_control_point_list } = data;
    let optionalControlPoints = [];
    this.setState({ isSelect: cp.id });

    if (cp && cp.id) {
      optionalControlPoints = optional_control_point_list.filter(
        p => p.controlPointType && p.controlPointType.id === cp.id
      );
    }

    this.props.navigator.pushPage({
      key: "optionalControlList" + Date.now(),
      component: OptionalControlList,
      optional_control_point_list: optionalControlPoints,
      data: data,
      onSave,
      getRecordsByIndex,
      recordIndex,
      updateControl,
      recordList,
      navigator
    });
  }

  render() {
    let { isLoading, isSelect } = this.state;
    const { data } = this.props.route;
    let controlPointTypes = this.getControlPointTypes() || [];

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
          <h3>{translate("app.quality.selectControlPointType")}</h3>
        </div>
        {controlPointTypes && controlPointTypes.length > 0 ? (
          controlPointTypes.map(cp => (
            <CardView
              key={cp.id}
              style={{
                padding: 17,
                border: isSelect === cp.id ? "1px solid rgb(47, 132, 208)" : ""
              }}
              onClick={e => {
                this.selectControlPoint(e, cp, data);
              }}
            >
              {cp.name}
            </CardView>
          ))
        ) : (
          <div style={{ textAlign: "center", fontSize: "9pt", padding: 10 }}>
            <span>{translate("app.quality.noControlPointType")}</span>
          </div>
        )}
      </Page>
    );
  }
}

ControlPointTypes.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
ControlPointTypes = reduxConnect(mapPropsToState)(ControlPointTypes);

export const ProcessListComponent = ControlPointTypes;

export default connect(ControlPointTypes);
