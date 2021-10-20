import React from "react";
import PropTypes from "prop-types";
import connect from "../../connect/task";
import Page, { PageElement } from "../../../page";
import {
  AlertDialog,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Modal,
  Dialog,
  PullHook
} from "react-onsenui";
import ons from "onsenui";
import { connect as reduxConnect } from "react-redux";
import moment from "moment";
import AttachmentList from "./AttachmentList";
import "./style.css";

import Translate, { translate } from "../../../../locale";
import { CardView, SwiperView, SignatureView } from "./../../../../components";
import { debounceCallback } from "./../../../debounce";
import PageCommentList, { Tabs } from "../../../page-comment-list";
import connectAppProject from "../../connect/appConfigure";
import { openCamera, URLToBlob } from "../../../../cordova";
class TaskView extends PageCommentList {
  constructor(props) {
    super(props);
    this.userId =
      (this.props.user_data.data && this.props.user_data.data.info["user.id"]);
    this.state = {
      task: {},
      taskForm: {
        name: "",
        task_date: moment(new Date()).format("YYYY-MM-DD"),
        status: "new",
        priority: "normal",
        project: null
      },
      recordList: [],
      attachments: [],
      hookState: "initial",
      fields: this.props.task.fields || [],
      clientPartner: {},
      contactPartner: {},
      secondTabber: 1,
      overviewPanel: 1,
      submitError: {
        content: null,
        title: null
      },
      showErrorDialog: false,
      isLoading: false,
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0,
      signature: null,
      plannings: [],
      isEnableSignature: false,
      attachmentView: "",
      showImageDialog: false
    };
    this.recordId = null;
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex, record } = route;
    this.fetchConfig();
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: [...records], activeIndex: targetIndex });
        this.fetchNewData(data);
        // this.fetchProject(data);
        // this.fetchAttachment(data);
      }
    } else {
      if (record) {
        this.fetchNewData(record);
      }
    }
  }

  getApi() {
    return this.props.task;
  }

  getCurrentRecord() {
    return this.state.task;
  }

  fetchConfig() {
    const { appConfig } = this.props;
    const { search } = appConfig;
    const criteria = {
      _domain: `self.code = :code`,
      _domainContext: {
        code: "project"
      }
    };
    search({ data: criteria }).then(res => {
      const { data = [] } = res;
      if (data[0]) {
        this.setState({ isEnableSignature: data[0].isEnableSignature });
      }
    });
  }

  fetchProject(data) {
    const { project } = data;
    const { client_partner = {}, contact_partner = {} } = project;

    const { fetch } = this.props.task.refs.salecontact;
    const { fetch: fetchCustomer } = this.props.task.refs.salecustomer;
    const relatedClient = {
      partnerAddressList: ["address"]
    };

    if (client_partner && client_partner.id) {
      fetch(client_partner, relatedClient).then(res =>
        this.setState({ clientPartner: res.data[0] })
      );
    }
    if (contact_partner && contact_partner.id) {
      fetchCustomer(contact_partner).then(res =>
        this.setState({ contactPartner: res.data[0] })
      );
    }
  }

  fetchNewData(data, fromSwipe = false) {
    const {screen} = this.props.route;
    const { fetch, fields } = this.props.task;
    const { search } = this.props.task.refs.projectplanningtime;
    const { limit, offset } = this.state;
    this.setState({ isLoading: true }, () => {
      const related = {
        project: [
          "fullName",
          "name",
          "membersUserSet",
          "contactPartner",
          "clientPartner",
          "customerAddress"
        ]
      };
      setTimeout(() => {
        fetch(data, related).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const newData = Object.assign({}, data[0]);
            if (newData.lead) {
              newData.task["name"] = `${newData.task["name"]}`;
            }
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === newData.id);
            if (targetIndex !== -1) {
              recordList[targetIndex] = Object.assign({}, newData);
            } else {
              recordList.push({ ...newData });
            }
            const { members_user_Set } = newData.project;
            let _userDomain = screen ==='plannedTask' ? ` and self.user.id = ${this.userId}` : '';
            const criteria = {
              data: {
                _domain: `self.projectTask.id = ${newData.id}${_userDomain}`,
              }
            };
            search(criteria).then(res => {
              this.setState({ plannings: res.data });
            });
            this.fetchProject(newData);
            this.fetchAttachment(newData);
            this.setState(
              {
                task: newData,
                membersUserSet: members_user_Set,
                fields,
                recordList,
                isLoading: false
              },
              () => {
                this.getAllComment(limit, offset);
              }
            );
          }
        });
      });
    });
  }

  fetchAttachment(data) {
    const { search } = this.props.task.refs.attachment;
    const critera = {
      _domain: `self.isDirectory = false AND self.relatedId = :rid AND self.relatedModel = :rmodel`,
      _domainContext: {
        rid: data.id,
        rmodel: "com.axelor.apps.project.db.ProjectTask",
        model: "com.axelor.dms.db.DMSFile"
      }
    };
    search({ data: critera }).then(res => {
      this.setState({ attachments: res.data });
    });
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, task } = this.state;
      const targetIndex = recordList.findIndex(record => record.id === task.id);
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(task) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "app-task",
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

  closeEdit(close) {
    const { recordList, task } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(record => record.id === task.id);
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = task;
          this.setState({ edit: false, task, recordList });
          resolve(true);
        }
      });
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

  onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      this.setState({ recordList: list, offset: 0, total: 0, all: [] }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    } else {
      this.setState({ recordList: [record], task: record });
    }
    debounceCallback(() => {
      this.closeEdit().then(res => {
        this.fetchNewData(record, true);
        this.fetchAttachment(record, true);
      });
    });
  }

  closeLoading() {
    this.setState({ isLoading: false });
  }

  startLoading() {
    this.setState({ isLoading: true });
  }

  setSign(e) {
    this.setState({ signature: e });
    this.uploadSign(e);
  }

  saveRecord(record) {
    const { onUpdate } = this.props.route;
    const { update } = this.props.task;
    update(record).then(res => {
      const { data } = res;
      if (data && data.length > 0) {
        const newRecord = data[0];
        if (onUpdate) {
          onUpdate(data[0]);
          this.props.navigator.popPage();
        }
        this.closeEdit().then(res => {
          this.fetchNewData(newRecord);
        });
      } else {
        this.closeLoading();
      }
    });
  }

  async uploadChunk(chunk, headers) {
    const { uploadFile } = this.props.task.refs.metafile;
    return uploadFile(chunk, headers);
  }

  async uploadInChunk(file) {
    const chunkSize = 512 * 1024;
    const fileSize = file.size;
    let offset = 0;
    let end = 0;
    let id = null;
    let doUpload = true;
    const fileName = `sign_${Date.now()}`;
    // let response = null;
    while (doUpload) {
      end = offset + chunkSize < fileSize ? offset + chunkSize : fileSize;
      const blob = file.slice(offset, end);
      const headers = {
        "X-File-Name": fileName,
        "X-File-Offset": Math.min(offset, fileSize),
        "X-File-Size": file.size,
        "X-File-Type": file.type
      };
      if (id) {
        headers["X-File-Id"] = id;
      }
      const res = await this.uploadChunk(blob, headers);
      const { result } = res;
      if (result.id) {
        doUpload = false;
        return result;
      } else {
        if (result.fileId) {
          id = result.fileId;
        }
        offset = chunkSize + offset;
      }
    }
  }

  uploadSign(sign) {
    const { task, recordList } = this.state;
    this.getBlobAndHeader(sign).then(({ blob, headers }) => {
      if (blob) {
        this.uploadInChunk(blob).then(res => {
          const record = recordList.find(r => r.id === task.id);
          record.metaFile = { id: res.id };
          this.saveRecord(record);
        });
      }
    });
  }

  onSignature() {
    this.props.navigator.pushPage(
      {
        component: SignatureView,
        path: "SignatureView_" + Date.now(),
        onSign: e => this.setSign(e),
        navigator: this.props.navigator
      },
      { animation: "none" }
    );
  }

  removeAttachment(file) {
    const { attachments } = this.state;
    let targetIndex = attachments.findIndex(
      item => JSON.stringify(item) === JSON.stringify(file)
    );
    ons.notification
      .confirm("Are you sure want to Remove it", {
        title: translate("Alert.confirm"),
        id: "remove-attachment",
        buttonLabels: [translate("Alert.cancelButton"), "yes"]
      })
      .then(res => {
        if (res === 1) {
          const { remove } = this.props.task.refs.attachment;
          remove(file).then(res => {
            if (res.status === 0) {
              attachments.splice(targetIndex, 1);
              this.setState({ attachments });
            }
          });
        }
      });
  }

  showImage(item) {
    const { url } = this.props.user_data && this.props.user_data.data;
    const downloadUrl = url + "/ws/dms/inline/" + item.id;
    if (item.fileName.indexOf("pdf") !== -1) {
    } else {
      this.setState({ showImageDialog: true, attachmentView: downloadUrl });
    }
  }

  saveAttachment(pictureURL) {
    const { uploadFile, add } = this.props.task.refs.attachment;
    const { task } = this.state;
    this.setState({ isLoading: true });
    this.getBlobAndHeader(pictureURL).then(({ blob, headers }) => {
      if (blob && headers) {
        uploadFile(blob, headers).then(({ result }) => {
          const payload = {
            fileName: result.fileName,
            metaFile: { id: result.id },
            relatedId: task.id,
            relatedModel: "com.axelor.apps.project.db.ProjectTask"
          };
          add(payload).then(res => {
            this.setState({ isLoading: false });
            this.fetchAttachment(task);
          });
        });
      }
    });
  }
  getHeaders(file = {}) {
    const headers = {
      "X-File-Name": file.name,
      "X-File-Offset": Math.min(0, file.size),
      "X-File-Size": file.size,
      "X-File-Type": file.type
    };

    return headers;
  }

  getBlobAndHeader(url) {
    return new Promise(resolve => {
      URLToBlob(url).then(res => {
        if (res.status === 1) {
          const headers = this.getHeaders(res.file);
          resolve({ headers, blob: res.blob });
        } else {
          resolve({ status: 0 });
        }
      });
    });
  }

  openFileGallary() {
    openCamera(true).then(res => {
      if (res.status === 1) {
        const pictureURL = res.image;
        this.saveAttachment(pictureURL);
      }
    });
  }

  onSuccess(result) {
    console.log("Success:" + result);
  }

  onError(result) {
    console.log("Error:" + result);
    ons.notification.alert(result, {
      id: "phone-error"
    });
  }

  onMobileClick(e, contactPartner) {
    e.preventDefault();
    window.plugins.CallNumber &&
      window.plugins.CallNumber.callNumber(
        this.onSuccess,
        this.onError,
        contactPartner.mobile_phone,
        true
      );
  }

  renderAlertBox() {
    const { showErrorDialog, submitError } = this.state;
    const onOk = () => this.setState({ showErrorDialog: false });
    return (
      <AlertDialog isOpen={showErrorDialog} isCancelable={false}>
        <div className="alert-dialog-title">{submitError.title}</div>
        <div className="alert-dialog-content">{submitError.content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="button_ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  onCancel() {
    this.setState({ showImageDialog: false });
  }

  renderDialog() {
    return (
      <Dialog
        onCancel={() => this.onCancel()}
        isOpen={this.state.showImageDialog}
        id="attchment"
        isCancelable={true}
      >
        <img
          src={this.state.attachmentView}
          alt="attch"
          style={{ width: 300 }}
        ></img>
      </Dialog>
    );
  }
  manyToOneProps = (name, value, label, placeholder) => ({
    edit: this.state.edit,
    navigator: this.props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder
  });

  renderToolbar() {
    const { recordList, isNew, isEnableSignature } = this.state;
    const original = this.state.task;
    let task = {};
    if (isNew) {
      task = this.state.taskForm;
    } else {
      task = recordList.find(r => r.id === original.id) || {};
    }
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
            {task.name}
          </span>
        </div>
        <div
          key="1"
          className="right icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          {isEnableSignature && (
            <PageElement key="sign">
              {task.signURL ? (
                <div
                  className="task-signed-button"
                  onClick={() => this.onSignature()}
                >
                  <Translate text="app.task.signed" />
                </div>
              ) : (
                <div
                  style={{ color: "rgba(44, 196,211,1)", marginRight: 5 }}
                  className="round-icon"
                  onClick={() => this.onSignature()}
                >
                  <i className="fas fa-signature" style={{ fontSize: 20 }} />
                </div>
              )}
            </PageElement>
          )}
          <PageElement key="camera">
            <div
              style={{ color: "rgba(44, 196,211,1)", marginRight: 5 }}
              className="round-icon"
              onClick={() => this.openFileGallary()}
            >
              <Icon icon="fa-camera" style={{ fontSize: 20 }} />
            </div>
          </PageElement>
        </div>
      </Toolbar>
    );
  }

  taskDone() {
    const { task, recordList, isEnableSignature } = this.state;
    const record = recordList.find(r => r.id === task.id);
    if ((record.metaFile && record.metaFile.id) || !isEnableSignature) {
      record.status = "closed";
      ons.notification
        .confirm(translate("Alert.taskDone"), {
          title: translate("Alert.confirm"),
          id: "task-done",
          buttonLabels: [
            translate("Alert.yesTaskisDone"),
            translate("Alert.cancelButton")
          ]
        })
        .then(res => {
          if (res === 0) {
            this.saveRecord(record);
          }
        });
    } else {
      const submitError = {
        title: translate("app.task.signErrorTitle"),
        content: translate("app.task.signErrorMessage")
      };
      this.setState({ showErrorDialog: true, submitError });
    }
  }

  renderBottomBar(taskForm) {
    return (
      <div
        className="camera-container"
        style={{
          backgroundColor: "#E1AA46",
          display: "flex",
          justifyContent: "space-between",
          color: "white"
        }}
        onClick={e => this.taskDone()}
      >
        <Icon icon="check-square-o" style={{ marginLeft: 10 }} />
        <span style={{ marginRight: 10 }}>
          {translate("Task.bottomBarLabel")}
        </span>
      </div>
    );
  }

  getSignature(signURL) {
    const { signature } = this.state;
    const src = signature || signURL;
    return (
      <CardView title={translate("app.task.signature")}>
        {src && <img src={src} alt="" />}
      </CardView>
    );
  }
  getTimeRange(start, end) {
    let text = "";
    if (start) {
      text = start;
      if (end) {
        text = `${text} - ${end}`;
      }
    }
    return text;
  }
  renderItem(taskForm) {
    const {
      attachments,
      fields,
      plannings = [],
      clientPartner = {},
      contactPartner = {},
      isEnableSignature
    } = this.state;
    if (!fields) return null;
    const { project = {} } = taskForm;
    return (
      <div style={{ marginBottom: 65 }}>
        <CardView principalView>
          <div
            style={{ paddingBottom: 10, paddingTop: 20, textAlign: "center" }}
          >
            <CardView.TagButton>{taskForm.priority}</CardView.TagButton>
            <CardView.InputField
              value={taskForm.name}
              textClassName="task-name"
              className="principal-details-field"
              style={{ marginTop: 25, marginBottom: 2 }}
            />
            <CardView.InputField
              value={
                taskForm.project &&
                `Project: ${taskForm.project.fullName ||
                  taskForm.project.full_name}`
              }
              textClassName="lead-assigned-user"
              className="principal-details-field"
            />
            <CardView.InputField
              value={`${taskForm.task_date &&
                moment(taskForm.task_date).format("Do MMM")}  ${
                taskForm.task_end_date
                  ? `to ${moment(taskForm.task_end_date).format("Do MMM")}`
                  : ""
              }`}
              textClassName="lead-assigned-user"
              className="principal-details-field"
            />
          </div>
        </CardView>
        <Tabs
          tabs={[
            { title: translate("Task.info"), value: 1 },
            { title: translate("Task.more"), value: 2 },
            { title: translate("Task.planning"), value: 3 },
            {
              title: `${translate("app.task.comments")}(${this.state.total})`,
              value: 4,
              hide: () => this.state.isNew
            }
          ]}
          className="medium-size-tab"
          activeTab={this.state.overviewPanel}
          onChange={e => this.setState({ overviewPanel: e })}
          activeColor={this.state.overviewPanel === 1 ? "#86bc25" : "initial"}
        />
        <div className="opportunity-tab-container">
          {this.state.overviewPanel === 1 && (
            <div className="second-tabber">
              <CardView title={translate("app.task.customerInformation")}>
                <span style={{ color: "#D3D3D3", fontSize: "9pt" }}>
                  <Translate text="app.task.address" />
                </span>
                <div>
                  <span
                    style={{ fontSize: "9pt" }}
                    onClick={() =>
                      window.open(
                        `http://maps.google.com/?q=
                        ${
                          project.customer_address.fullName
                            ? project.customer_address.fullName
                            : ""
                        }`,
                        "_system"
                      )
                    }
                  >
                    {(project.customer_address &&
                      project.customer_address.fullName) ||
                      ""}
                  </span>
                </div>
                {/* {clientPartner.partner_address_list &&
                  clientPartner.partner_address_list.map((address, i) => (
                    <div key={i}>
                      <span
                        style={{ fontSize: "9pt" }}
                        onClick={() =>
                          window.open(
                            "http://maps.google.com/?q=" +
                              address.address.fullName,
                            "_system"
                          )
                        }
                      >
                        {address.address.fullName || ""}
                      </span>
                    </div>
                  ))} */}
                <CardView.InputField
                  title={translate("app.task.clientPartner")}
                  value={clientPartner.full_name}
                />
                <CardView.InputField
                  title={translate("app.task.contactPartner")}
                  value={contactPartner.full_name}
                />
                <CardView.InputField
                  title={translate("app.task.fixedPhone")}
                  value={contactPartner.fixed_phone}
                />
                <CardView.InputField
                  title={translate("app.task.mobilePhone")}
                  value={contactPartner.mobile_phone}
                  onClick={e => this.onMobileClick(e, contactPartner)}
                />
              </CardView>
              <CardView title={translate("app.task.attachments")}>
                <AttachmentList
                  files={attachments}
                  maxFiles={this.props.maxFiles}
                  removeAttachment={e => this.removeAttachment(e)}
                  platform={this.props.app.platform}
                  showImage={item => this.showImage(item)}
                />
              </CardView>
              {isEnableSignature && this.getSignature(taskForm.signURL)}
            </div>
          )}

          <CardView
            className="financila-tab"
            hidden={this.state.overviewPanel !== 2}
          >
            <div className="card-field">
              <span className="card-field-title">
                {translate("app.task.description")}
              </span>
              <div
                dangerouslySetInnerHTML={{ __html: taskForm.description }}
              ></div>
            </div>
            <CardView.InputField
              edit={false}
              title={translate("app.task.assignedTo")}
              onChange={e => {}}
              value={
                taskForm.assigned_to && (taskForm.assigned_to.fullName || "")
              }
            />
          </CardView>
          {this.state.overviewPanel === 3 && (
            <div>
              {plannings &&
                plannings.map((p, i) => (
                  <div className="task-tree-list" key={p.id}>
                    <div style={{ display: "flex", flex: 1 }}>
                      <div>
                        <p style={{ fontWeight: "bold",lineHeight:"5px" }}>
                          {moment(p.date).format("DD MMMM YYYY")}
                        </p>
                        <p style={{ lineHeight: "5px" }}>{p.user && p.user.fullName}</p>
                        <p style={{ lineHeight: "5px" }}>{this.getTimeRange(p.startTime, p.endTime)}</p>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: p.description
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {this.state.overviewPanel === 4 && this.renderCommentList()}
        </div>
      </div>
    );
  }

  renderPullHookLoader(props = {}) {
    return (
      <div style={{ marginTop: 60 }} className="custom-hook-loader" {...props}>
        <ProgressCircular indeterminate />
      </div>
    );
  }

  renderPullHook() {
    const { hookState, isLoading, task } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(task);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { recordList, isLoading, taskForm, isNew } = this.state;
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
        renderBottomBar={this.renderBottomBar(taskForm)}
      >
        {this.renderAlertBox()}
        {this.renderDialog()}
        {isNew ? (
          this.renderItem(taskForm)
        ) : (
          <React.Fragment>
            {this.renderPullHook()}
            <SwiperView
              recordList={recordList}
              renderItem={record => this.renderItem(record)}
              onActive={record => this.onRecordSwipe(record)}
              onInitSwiper={swiper => (this.swiper = swiper)}
            />
          </React.Fragment>
        )}
      </Page>
    );
  }
}

TaskView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => {
  return { user_data: state.user, app: state.app };
};

export default connectAppProject(
  connect(reduxConnect(mapPropsToState)(TaskView))
);
