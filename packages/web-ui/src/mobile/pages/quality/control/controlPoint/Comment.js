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
import ons from "onsenui";
import connect from "../../connect/qualitycontrol";
import { CardView } from "../../../../components";
import Translate, { translate } from "../../../../locale";
import Page from "../../../page";
import ControlForm from "../add/ControlForm";

import "./index.css";

export class Comment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      controlPoint: {},
      recordControlPoint: {},
      isLoading: false
    };
  }

  componentDidMount() {
    const { data } = this.props.route;
    this.setState({
      controlPoint: { ...data },
      recordControlPoint: { ...data }
    });
  }

  closeLoading() {
    this.setState({ isLoading: false });
  }

  startLoading() {
    this.setState({ isLoading: true });
  }

  async onSave() {
    const { controlPoint } = this.state;
    if (controlPoint && controlPoint.id !== undefined) {
      this.startLoading();
      await this.onUpdate({ ...controlPoint, status_select: 2 });
    }
  }

  checkOptionalData = () => {
    ons.notification
      .alert(translate("app.quality.errorOnOptionalControlPoint"), {
        id: "optional-data-alert"
      })
      .then(res => {
        this.onBackButtonClick();
      });
  };

  async onUpdate(controlPoint) {
    const { update } = this.props.qualitycontrol.refs.controlpoint;
    const {
      onUpdate,
      onSave,
      recordIndex,
      updateControl,
      getRecordsByIndex,
      control,
      recordList
    } = this.props.route;
    try {
      let res = await update(controlPoint);
      this.closeLoading();
      if (`${res.status}` === "0") {
        const { data } = res;
        if (data && data.length > 0) {
          const newRecord = data[0];
          if (onSave) {
            await onSave(newRecord, recordList, control);
            this.props.navigator.resetPage(
              {
                component: ControlForm,
                key: "controlform" + Date.now(),
                getRecordsByIndex,
                data: control,
                recordIndex,
                updateControl
              },
              { animation: "none" }
            );
          } else if (onUpdate) {
            this.props.navigator.popPage().then(res => {
              onUpdate(newRecord);
            });
          } else {
            this.setState({
              alert: {
                title: <Translate text={"app.quality.error"} />,
                content: res.error.message || (
                  <Translate text={"app.quality.errorOthers"} />
                )
              }
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordControlPoint, controlPoint } = this.state;
      if (
        JSON.stringify(recordControlPoint) !== JSON.stringify(controlPoint) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "control-point-comment",
            buttonLabels: [
              translate("Alert.cancelButton"),
              translate("Alert.yesButton")
            ]
          })
          .then(res => {
            if (res === 1) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
      } else {
        resolve(true);
      }
    });
  }

  onBackButtonClick() {
    this.isRecordChanged(true).then(ok => {
      if (ok) {
        this.props.navigator.popPage();
      }
    });
  }

  renderToolbar() {
    const { control } = this.props.route;
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
            {control && (control.name || control.full_name)}
          </span>
        </div>
      </Toolbar>
    );
  }

  changeField(name, value) {
    const { controlPoint } = this.state;
    this.setState({
      controlPoint: {
        ...controlPoint,
        [name]: value
      }
    });
  }

  goBackToControl = async e => {
    e.stopPropagation();
    await this.onSave();
  };

  renderBottomBar() {
    return (
      <div
        className="camera-container"
        style={{
          backgroundColor: "#2F84D0",
          display: "flex",
          justifyContent: "flex-end",
          color: "white"
        }}
        onClick={e => this.goBackToControl(e)}
      >
        <span style={{ marginRight: "4%" }}>
          {translate("app.quality.commentBottomBarLabel")}
        </span>
      </div>
    );
  }

  render() {
    const { isLoading, controlPoint } = this.state;
    const { notes } = controlPoint;

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
        renderBottomBar={this.renderBottomBar()}
        isRecordChanged={() => this.isRecordChanged(true)}
      >
        <div style={{ display: "flex", justifyContent: "center", margin: 20 }}>
          <h3>{translate("app.quality.controlPoint.comment")}</h3>
        </div>
        <CardView>
          <CardView.TextArea
            edit={true}
            title={translate("app.quality.measurePoint.comment")}
            value={notes}
            onChange={e => this.changeField("notes", e.target.value)}
          />
        </CardView>
      </Page>
    );
  }
}

Comment.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app, user_data: state.user });
Comment = reduxConnect(mapPropsToState)(Comment);

export const CommentComponent = Comment;

export default connect(Comment);
