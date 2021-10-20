import React from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import {
  Toolbar,
  ToolbarButton,
  Icon,
  AlertDialog,
  Modal,
  ProgressCircular,
  Switch,
  Dialog
} from "react-onsenui";
import ons from "onsenui";
import moment from "moment";
import connect from "../../connect/qualitycontrol";
import { CardView } from "../../../../components";
import PageCommentList from "../../../page-comment-list";
import StarRating from "../components/StarRating";
import Comment from "./Comment";
import Translate, { translate } from "../../../../locale";
import { openCamera, URLToBlob } from "../../../../cordova";
import Page from "../../../page";
import { uploadInChunk } from "../components/Utils";

import "./index.css";

class ControlPoint extends PageCommentList {
  constructor(props) {
    super(props);
    this.state = {
      controlPoint: {},
      recordControlPoint: {},
      edit: true,
      alert: null,
      isLoading: false,
      visibility: true,
      keyboard: false,
      showImage: false
    };
    this.activeTeamId =
      this.props.user_data &&
      this.props.user_data.info.active_team &&
      this.props.user_data.info.active_team.id;
  }

  fetchNewData(data) {
    const { fetch } = this.props.qualitycontrol.refs.controlpoint;
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        const related = {
          measuringPointList: [
            "name",
            "measuringNote",
            "picturesList",
            "observations",
            "measuringTypeSelect",
            "compliant"
          ]
        };
        fetch(data, related).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const controlPoint = Object.assign({}, data[0]);
            this.setState({
              controlPoint,
              recordControlPoint: controlPoint,
              isLoading: false
            });
          }
        });
      }, 300);
    });
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
    const { route } = this.props;
    const { data } = route;
    this.addEventListener();
    if (data && data.id !== undefined) {
      this.fetchNewData(data);
    }
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

  measurePointChangeField(name, value, measurePointId) {
    const { controlPoint } = this.state;
    const { measuring_point_list } = controlPoint;
    const target = measuring_point_list.findIndex(d => d.id === measurePointId);
    let record = measuring_point_list[target];
    if (name === "compliant") {
      if (value === true) {
        measuring_point_list[target] = {
          ...record,
          [name]: value,
          measuringNote: 5
        };
      } else {
        measuring_point_list[target] = {
          ...record,
          [name]: value,
          measuringNote: 0
        };
      }
    } else {
      measuring_point_list[target] = { ...record, [name]: value };
    }
    this.setState({
      measuring_point_list,
      controlPoint: { ...controlPoint, measuring_point_list }
    });
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
            id: "control-point",
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
    const { edit } = this.state;
    if (!edit) {
      this.props.navigator.popPage();
      return;
    }

    this.isRecordChanged(true).then(ok => {
      if (ok) {
        this.props.navigator.popPage();
      }
    });
  }

  addComment = controlPoint => {
    const {
      control,
      onUpdate,
      selectOption,
      onSave,
      recordIndex,
      updateControl,
      getRecordsByIndex,
      recordList
    } = this.props.route;
    this.props.navigator.pushPage(
      {
        component: Comment,
        key: "Comment" + Date.now(),
        data: controlPoint,
        control: control,
        onSave,
        recordIndex,
        updateControl,
        selectOption: selectOption,
        getRecordsByIndex,
        recordList,
        onUpdate: record => {
          if (onUpdate) {
            this.props.navigator.popPage().then(res => {
              onUpdate(record);
            });
          }
        }
      },
      { animation: "none" }
    );
  };

  renderBottomBar(controlPoint) {
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
          onClick={() => this.addComment(controlPoint)}
        >
          <span style={{ marginRight: "4%" }}>
            {translate("app.quality.bottomBarLabelNext")}
          </span>
        </div>
      )
    );
  }

  renderAlertBox() {
    const { alert } = this.state;
    const {
      title = "",
      content = "",
      onOk = () => this.setState({ alert: null })
    } = alert || {};
    return (
      <AlertDialog isOpen={!!alert} isCancelable={false}>
        <div className="alert-dialog-title">{title}</div>
        <div className="alert-dialog-content">{content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="common.dialog.ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  renderToolbar() {
    const { control } = this.props.route;

    return (
      <Toolbar noshadow modifier="transparent">
        <div className="left left-icon-width">
          <ToolbarButton onClick={() => this.onBackButtonClick()}>
            <Icon icon="chevron-left" />
          </ToolbarButton>
        </div>
        <div className="center left-align-title ellipse-toolbar">
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

  takePicture = (id, picturesList) => {
    this.setState({ visibility: false, flag: true });
    openCamera(true).then(res => {
      if (res.status === 1) {
        const pictureURL = res.image;
        this.setState({ isLoading: true });
        URLToBlob(pictureURL).then(res => {
          if (res.status === 1) {
            const { uploadFile } = this.props.qualitycontrol.refs.metafile;
            uploadInChunk(res.blob, uploadFile, "photo").then(res => {
              this.setState({ visibility: true, isLoading: false }, () => {
                const picRecord = {
                  createDate: moment().format("YYYY-MM-DD"),
                  metaFile: { ...res },
                  name: res.fileName
                };
                picturesList.push(picRecord);
                this.measurePointChangeField("picturesList", picturesList, id);
              });
            });
          }
        });
      }
    });
  };

  showPicture = (picture, measurePoint) => {
    const { fetch } = this.props.qualitycontrol.refs.measurepoint;
    let selectedPhoto = {};
    this.setState({ isLoading: true }, () => {
      const related = {
        picturesList: ["metaFile", "name", "createDate"]
      };
      fetch(measurePoint, related).then(res => {
        const { data = [] } = res;
        if (data && data.length > 0) {
          const { picturesList = [] } = data[0];
          selectedPhoto =
            picturesList && picturesList.find(pic => pic.id === picture.id);
          let isSelectedPhoto = selectedPhoto && selectedPhoto.metaFile;
          this.setState({
            showImage: isSelectedPhoto ? true : false,
            selectedPhoto: isSelectedPhoto ? selectedPhoto : {},
            isLoading: false
          });
        }
      });
    });
  };

  removeImage(id, picturesList, photoId) {
    ons.notification
      .confirm("Are you sure want to Remove it?", {
        title: translate("Alert.confirm"),
        id: "remove-image",
        buttonLabels: [translate("Alert.cancelButton"), "yes"]
      })
      .then(res => {
        if (res === 1) {
          this.setState({ visibility: true }, () => {
            let photoIndex = picturesList.findIndex(
              photo => photo.id === photoId
            );
            if (photoIndex !== -1) {
              picturesList.splice(photoIndex, 1);
            }
            this.measurePointChangeField("picturesList", picturesList, id);
          });
        }
      });
  }

  getPictureList = (picturesList = []) => {
    let result = picturesList.filter(picture => {
      return picture.name !== null;
    });
    return result.length;
  };

  renderMeasurePoint = measurePoint => {
    const {
      name,
      measuringNote,
      observations,
      picturesList,
      id,
      measuringTypeSelect,
      compliant
    } = measurePoint || {};
    const { selectedPhoto = {} } = this.state;
    return (
      <React.Fragment key={id}>
        <CardView className="measure-parent">
          <CardView.InputField
            className="measure-child"
            edit={false}
            value={name}
            textClassName="measure-point-title"
          />
          {measuringTypeSelect && measuringTypeSelect === 1 ? (
            <div className="start-rating">
              <StarRating
                value={measuringNote}
                onChange={value =>
                  this.measurePointChangeField("measuringNote", value, id)
                }
              />
            </div>
          ) : (
            <div className="switch-group">
              <span>
                <Translate text="app.quality.measurePoint.compliant" />
              </span>
              <span className="compliant-switch">
                <Switch
                  checked={compliant}
                  onChange={e =>
                    this.measurePointChangeField("compliant", e.value, id)
                  }
                />
              </span>
            </div>
          )}
          <CardView.InputField
            className="measure-child"
            edit={this.state.edit}
            title={translate("app.quality.measurePoint.observations")}
            value={observations}
            onChange={e =>
              this.measurePointChangeField("observations", e.target.value, id)
            }
          />
          {this.getPictureList(picturesList) > 0 && (
            <CardView className="attachments">
              {picturesList.map(photo => (
                photo && photo.name &&
                <div className="attachments-child" key={photo.id}>
                  <div
                    style={{ width: "96%" }}
                    onClick={() => this.showPicture(photo, measurePoint)}
                  >
                    <span style={{ backgroundColor: "#E8EDF0", padding: 5 }}>
                      <Icon icon="fa-image" />
                    </span>
                    <span style={{ marginLeft: 10 }}>{photo.name}</span>
                  </div>
                  <Icon
                    icon="fa-times"
                    style={{
                      color: "#D3D3D3",
                      fontSize: "16pt",
                      width: "4%"
                    }}
                    onClick={() => this.removeImage(id, picturesList, photo.id)}
                  />
                </div>
              ))}
            </CardView>
          )}
          <CardView
            onClick={() => this.takePicture(id, picturesList)}
            className="add-photo"
          >
            <div style={{ display: "flex" }}>
              <Icon icon="fa-camera" />
              <div style={{ marginLeft: 10 }}>
                {translate("app.quality.measurePoint.addAPhoto")}
              </div>
            </div>
          </CardView>
        </CardView>
        <Dialog
          onCancel={this.onCancel}
          isOpen={this.state.showImage}
          cancelable
        >
          <div>
            {selectedPhoto.pictureURL && (
              <div>
                <div className="dialog-title">{selectedPhoto.name}</div>
                <div className="image">
                  <div
                    className="show-image"
                    style={{
                      backgroundImage: `url(${selectedPhoto.pictureURL || ""})`
                    }}
                  />
                </div>
                <div className="alert-dialog-footer">
                  <button
                    onClick={() => this.setState({ showImage: false })}
                    className="alert-dialog-button"
                  >
                    <Translate text="common.dialog.ok" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      </React.Fragment>
    );
  };

  renderItem(controlPoint) {
    const { name, measuring_point_list } = controlPoint;
    const { control } = this.props.route;
    const { dead_line_date } = control;

    return (
      <div style={{ marginBottom: "80px" }}>
        {this.renderAlertBox()}
        <CardView principalView>
          <div style={{ padding: "10px 10px 10px 10px" }}>
            <CardView.InputField
              edit={this.state.edit}
              title={translate("app.quality.controlPoint.name")}
              value={name}
              onChange={e => this.changeField("name", e.target.value)}
            />
            <CardView.DateField
              name="dead_line_date"
              edit={false}
              title={translate("app.quality.deadLineDate")}
              value={dead_line_date}
            />
          </div>
        </CardView>
        {measuring_point_list &&
          measuring_point_list.map(point => {
            return this.renderMeasurePoint(point);
          })}
      </div>
    );
  }

  render() {
    const { controlPoint, isLoading, keyboard } = this.state;
    return (
      <Page
        {...this.props}
        isRecordChanged={() => this.isRecordChanged(true)}
        renderToolbar={() => this.renderToolbar()}
        renderModal={
          isLoading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={isLoading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
        renderBottomBar={this.renderBottomBar(controlPoint)}
        isMenuVisible={!keyboard}
      >
        {this.renderAlertBox()}
        {this.renderItem(controlPoint)}
      </Page>
    );
  }
}

ControlPoint.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

ControlPoint = reduxConnect(state => ({
  app: state.app,
  user_data: state.user.data
}))(ControlPoint);

export default connect(ControlPoint);
