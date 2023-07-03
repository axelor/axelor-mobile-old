import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import { Toolbar, ToolbarButton, Icon } from "react-onsenui";
import connect from "../../connect/qualitycontrol";
import ProjectList from "./ProjectList";
import { CardView } from "./../../../../components";
import { translate } from "../../../../locale";
import PageListComponent from "../../../page-list";

export class ProcessList extends PageListComponent {
  getAPI() {
    return this.props.qualitycontrol.refs.qualityprocess;
  }

  getFetchOptions(searchOptions) {
    return super.getFetchOptions(searchOptions, {
      fields: ["name"]
    });
  }

  renderListSearch() {
    return super.renderListSearch({ placeholder: translate("app.quality.searchByProcess") });
  }

  onBackButtonClick() {
    this.props.navigator.popPage();
  }

  renderList(props = {}) {
    const { data: controlProcess, isSelect } = this.state;
    const { getRecordsByIndex, updateControl, addControl } = this.props.route;
    return (
      <div style={{ marginTop: 50 }}>
        {controlProcess.map(cp => (
          <CardView
            key={cp.id}
            style={{
              padding: 17,
              border: isSelect === cp.id ? "1px solid rgb(47, 132, 208)" : ""
            }}
            onClick={e => {
              this.setState({ isSelect: cp.id });
              this.props.navigator.pushPage({
                key: "ProjectList" + Date.now(),
                component: ProjectList,
                process: cp,
                getRecordsByIndex,
                updateControl,
                addControl
              });
            }}
          >
            {cp.name}
          </CardView>
        ))}
      </div>
    );
  }

  renderToolbar() {
    return (
      <React.Fragment>
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
              {translate("app.quality.chooseQualityProcess")}
            </span>
          </div>
        </Toolbar>
      </React.Fragment>
    );
  }
}

ProcessList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
ProcessList = reduxConnect(mapPropsToState)(ProcessList);

export const ProcessListComponent = ProcessList;
export default connect(ProcessList);
