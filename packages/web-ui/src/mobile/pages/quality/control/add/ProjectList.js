import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import { Toolbar, ToolbarButton, Icon } from "react-onsenui";
import connect from "../../connect/qualitycontrol";
import ControlForm from "./ControlForm";
import { CardView } from "./../../../../components";
import { translate } from "../../../../locale";
import PageListComponent from "../../../page-list";

export class ProjectList extends PageListComponent {
  getAPI() {
    return this.props.qualitycontrol.refs.project;
  }

  getFetchOptions(searchOptions) {
    return super.getFetchOptions(searchOptions, {
      fields: ["name"]
    });
  }

  renderListSearch() {
    return super.renderListSearch({ placeholder: "Search by Projects" });
  }

  onBackButtonClick() {
    this.props.navigator.popPage();
  }

  renderList(props = {}) {
    const { data: projects, isSelect } = this.state;
    const {
      getRecordsByIndex,
      updateControl,
      addControl,
      process
    } = this.props.route;
    return (
      <div style={{ marginTop: 50 }}>
        {projects.map(project => (
          <CardView
            key={project.id}
            style={{
              padding: 17,
              border:
                isSelect === project.id ? "1px solid rgb(47, 132, 208)" : ""
            }}
            onClick={e => {
              this.setState({ isSelect: project.id });
              this.props.navigator.pushPage({
                key: "Controlform" + Date.now(),
                component: ControlForm,
                process,
                getRecordsByIndex,
                updateControl,
                addControl,
                project
              });
            }}
          >
            {project.name}
          </CardView>
        ))}
      </div>
    );
  }

  renderToolbar() {
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
            {translate("app.quality.chooseProject")}
          </span>
        </div>
      </Toolbar>
    );
  }
}

ProjectList.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
ProjectList = reduxConnect(mapPropsToState)(ProjectList);

export const ProjectListComponent = ProjectList;
export default connect(ProjectList);
