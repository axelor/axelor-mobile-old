import React from "react";
import PropTypes from "prop-types";
import {
  AlertDialog,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Modal,
  Button,
  PullHook
} from "react-onsenui";
import ons from "onsenui";
import { connect as reduxConnect } from "react-redux";
import connect from "../../connect/qualitycontrol";
import Page, { PageElement } from "../../../page";
import Translate, { translate } from "../../../../locale";
import { CardView, SwiperView } from "./../../../../components";
import { debounceCallback } from "./../../../debounce";
import PageCommentList, {
  RenderManyToOne,
  Tabs
} from "../../../page-comment-list";
import { URLToBlob } from "../../../../cordova";
import connectAppProject from "../../connect/appConfigure";
import ControlPointTypes from "./ControlPointTypes";
import CorrectiveActionsList from "./CorrectiveActions";
import ControlPoint from "../controlPoint";
import { DraggableList } from "../components/DraggableList";
import SignatureInspector from "./Signature-inspector";
import { uploadInChunk } from "../components/Utils";

const relatedField = {
  controlPointList: ["statusSelect", "name", "sequence"],
  controlPointModelList: ["statusSelect", "name", "sequence"],
  qualityCorrectiveActionList: ["name", "details", "isApplicable"],
  project: ["fullName", "id", "customerAddress", "contactPartner", "company"]
};

class ControlForm extends PageCommentList {
  constructor(props) {
    super(props);
    this.state = {
      controlForm: {
        status_select: 1,
        dead_line_date: new Date(),
        control_point_list: [],
        optional_control_point_list: [],
        quality_corrective_action_list: [],
        responsible:
          (this.props.user_data.data &&
            this.props.user_data.data.info &&
            this.props.user_data.data.info.employee) ||
          null,
        team: null
      },
      recordList: [],
      fields: this.props.qualitycontrol.fields || [],
      activeTab: 1,
      submitError: {
        content: null,
        title: null
      },
      hookState: "initial",
      showErrorDialog: false,
      isLoading: false,
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0,
      signature: null,
      edit: true,
      isNew: false,
      customerSignature: null,
      inspectorSignature: null,
      process: {},
      user: this.props.user_data.data && this.props.user_data.data.info
    };
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex, process = {}, project } = route;
    const {
      controlPointModelList = [],
      optionalControlPointModelList = [],
      qualityCorrectiveActionList = []
    } = process;
    const { controlForm } = this.state;

    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: [...records], activeIndex: targetIndex });
        this.fetchNewData(data);
      }
    } else {
      this.setState(
        {
          isNew: true,
          controlForm: {
            ...controlForm,
            control_point_list: [...controlPointModelList],
            optional_control_point_list: [...optionalControlPointModelList],
            quality_corrective_action_list: [...qualityCorrectiveActionList],
            project
          },
          process: process
        },
        () => this.saveRecord(false, true)
      );
    }
  }

  async fetchNewData(data, fromSwipe = false) {
    const { fetch, fields } = this.props.qualitycontrol;
    this.setState({ isLoading: true });
    const related = {
      ...relatedField,
      optionalControlPointList: ["controlPointType", "name"]
    };
    const res = await fetch(data, related);
    const dataRes = res.data;
    if (dataRes && dataRes.length > 0) {
      const newData = Object.assign({}, dataRes[0]);
      const recordList = [...this.state.recordList];
      const targetIndex = recordList.findIndex(r => r.id === newData.id);
      if (targetIndex !== -1) {
        recordList[targetIndex] = Object.assign({}, newData);
      } else {
        recordList.push({ ...newData });
      }
      this.setState({
        controlForm: { ...newData },
        fields,
        recordList,
        isLoading: false
      });
    }
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, controlForm } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === controlForm.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !==
          JSON.stringify(controlForm) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "quality-control",
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

  async closeEdit(close) {
    const { recordList, controlForm } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === controlForm.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = controlForm;
          this.setState({ edit: true, controlForm, recordList });
          resolve(true);
        }
      });
    });
  }

  onBackButtonClick(canBack) {
    const { edit } = this.state;
    if (canBack) {
      this.navigateToList();
    } else {
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
  }

  async onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      this.setState({ recordList: list, offset: 0, total: 0, all: [] }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    } else {
      this.setState({ recordList: [record], controlForm: record });
    }
    await debounceCallback;
    await this.closeEdit();
    await this.fetchNewData(record, true);
  }

  changeField(name, value) {
    const { controlForm, recordList, isNew } = this.state;
    if (isNew) {
      this.setState({
        controlForm: {
          ...controlForm,
          [name]: value
        }
      });
    } else {
      const targetIndex = recordList.findIndex(r => r.id === controlForm.id);
      const record = { ...recordList[targetIndex] };
      record[name] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  setSign(e, type) {
    this.setState({ [`${type}Signature`]: e });
  }

  async setCustomerSign(e) {
    const { controlForm, recordList } = this.state;
    const { action } = this.props.qualitycontrol;
    const customerResult = await this.uploadSign(e);
    const inspectorResult = await this.uploadSign(
      this.state.inspectorSignature
    );
    const record = recordList.find(r => r.id === controlForm.id);

    if (customerResult && inspectorResult) {
      record.customer_signature = { id: customerResult.id };
      record.inspector_signature = { id: inspectorResult.id };
      record.status_select = 6;
      record.end_date = new Date();
    }
    await this.saveRecord(false);
    const actionQuality = {
      context: {
        id: record.id
      }
    };
    action(
      "com.axelor.apps.quality.mobile.QualityMobileController:sendEmail",
      actionQuality
    );
  }

  uploadSign(sign) {
    const { uploadFile } = this.props.qualitycontrol.refs.metafile;
    return new Promise((resolve, reject) => {
      this.getBlobAndHeader(sign).then(({ blob, headers }) => {
        if (blob) {
          uploadInChunk(blob, uploadFile).then(res => {
            resolve(res);
          });
        } else {
          reject();
        }
      });
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

  preFillProcessData = async newRecord => {
    const { action } = this.props.qualitycontrol;
    const { user = {}, process } = this.state;
    const { action: ActionWizard } = this.props.qualitycontrol.refs.wizard;
    const context = {
      context: {
        qualityProcess: { id: process.id, name: process.name },
        _id: newRecord.id,
        _model: "com.axelor.apps.base.db.Wizard",
        _qualityControl: { id: newRecord.id },
        _signal: "preFillControlPointsBtn"
      }
    };
    let res = await ActionWizard(
      "action-quality-control-method-pre-fill-operations",
      context
    );
    if (res) {
      const actionQuality = {
        context: {
          id: newRecord.id,
          model: "com.axelor.apps.quality.db.QualityControl",
          responsible: newRecord.responsible || null,
          team: newRecord.team || null,
          _myActiveTeamId: user.active_team && user.active_team.id,
          _userId: user["user.id"]
        }
      };
      let result = await action(
        "action-quality-control-group-onload-actions",
        actionQuality
      );
      if (result) {
        const { fetch } = this.props.qualitycontrol;
        this.setState({ isLoading: true });
        let newFetchedRecord = await fetch(newRecord, relatedField);
        if (newFetchedRecord) {
          const { data } = newFetchedRecord;
          this.setState({
            controlForm: data[0],
            isNew: false,
            edit: false,
            isLoading: false
          });
          await this.onRecordSwipe(data[0]);
        }
      }
    }
  };

  getPrintingSettings = async () => {
    const { controlForm } = this.state;
    const { project = {} } = controlForm;
    const { company } = project;
    if (company && company.id) {
      const { fetch } = this.props.qualitycontrol.refs.company;
      const res = await fetch(company);
      const { data } = res;
      return data && data[0] && data[0].printingSettings;
    }
  };

  async saveRecord(
    returnToList = true,
    isQualityProcess = false,
    isOptionalControlPoint = false
  ) {
    const { controlForm, recordList } = this.state;
    const { update, add } = this.props.qualitycontrol;
    const { updateControl, addControl } = this.props.route;

    const record = recordList.find(r => r.row_id === controlForm.row_id);
    if (record && record.id !== undefined) {
      try {
        this.setState({ isLoading: true });
        const result = await update(record);
        if (updateControl && result) {
          const { data } = result;
          const newRecord = data[0];
          this.setState({ isLoading: false });
          updateControl(newRecord);
        }
        if (returnToList) {
          this.navigateToList();
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      this.setState({ isLoading: true });
      try {
        const printingSettings = await this.getPrintingSettings();
        let res = await add({
          ...controlForm,
          control_point_list: null,
          optional_control_point_list: null,
          quality_corrective_action_list: null,
          start_date: new Date(),
          printing_settings: printingSettings
        });
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "controlForm-error"
          });
          this.setState({ isLoading: false });
        } else {
          if (res && !isOptionalControlPoint && !isQualityProcess) {
            this.setState({
              isLoading: false
            });
          }
          if (addControl) {
            const control = res && res.data && res.data[0];
            addControl(control);
            if (isQualityProcess && control.id) {
              await this.preFillProcessData(control);
            }
          }
          if (returnToList) {
            await this.navigateToList();
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  navigateToList = async () => {
    this.props.navigator.resetPage(
      { name: "controls", key: Date.now() },
      { animation: "none" }
    );
  };

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

  renderControlPointView = item => {
    const { controlForm } = this.state;
    const { control_point_list } = controlForm;
    this.props.navigator.pushPage(
      {
        component: ControlPoint,
        key: "ControlPoint" + Date.now(),
        data: item,
        control: controlForm,
        onUpdate: record => {
          if (record) {
            const target = control_point_list.findIndex(
              d => d.id === record.id
            );
            control_point_list[target] = { ...record };
            this.setState({
              controlForm: { ...controlForm, control_point_list }
            });
          }
        }
      },
      { animation: "none" }
    );
  };

  renderToolbar() {
    const { controlForm, recordList, isLoading } = this.state;
    const control = recordList.find(r => r.row_id === controlForm.row_id) || {};
    const canBack = this.props.navigator.routes[0].name !== "controls";
    return (
      <Toolbar noshadow modifier="transparent" style={{ background: "#fff" }}>
        <div className="left left-icon-width">
          <ToolbarButton
            onClick={() => this.onBackButtonClick(canBack)}
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
            onClick={() => this.onBackButtonClick(canBack)}
            style={{ display: "inline-block" }}
          >
            {!isLoading
              ? control.id !== undefined
                ? control.name
                : "New control"
              : ""}
          </span>
        </div>
        <div
          key="1"
          className="right icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="save">
            <div
              style={{ color: "rgba(44, 196,211,1)", marginRight: 5 }}
              className="round-icon"
              onClick={() => this.saveRecord()}
            >
              <Icon icon="fa-save" style={{ fontSize: 20 }} />
            </div>
          </PageElement>
        </div>
      </Toolbar>
    );
  }

  correctActions(controlForm) {
    ons.notification
      .confirm(translate("Alert.endControlHeader"), {
        title: translate("Alert.endControlTitle"),
        id: "corrective-actions",
        cancelable: true,
        buttonLabels: [
          translate("Alert.yesButton"),
          translate("Alert.noButton")
        ]
      })
      .then(res => {
        let component = CorrectiveActionsList,
          key = "";
        if (res === 0) {
          key = "correct_actions_list_" + Date.now();
          component = CorrectiveActionsList;
        } else if (res === 1) {
          component = SignatureInspector;
          key = "signature_inspector_" + Date.now();
        }
        if (res === 0 || res === 1) {
          this.props.navigator.pushPage(
            {
              key,
              component,
              data: controlForm,
              setSign: (data, type) => this.setSign(data, type),
              setCustomerSign: data => this.setCustomerSign(data),
              onChange: data => {
                const { recordList } = this.state;
                const targetIndex = recordList.findIndex(
                  r => r.id === controlForm.id
                );
                const record = { ...recordList[targetIndex] };
                record["quality_corrective_action_list"] = [...data];
                recordList[targetIndex] = { ...record };
                this.setState({ recordList });
              }
            },
            { animation: "none" }
          );
        }
      });
  }

  checkStatus = (control_point_list, controlForm) => {
    let isStatusDone =
      control_point_list &&
      control_point_list.find(obj => {
        return (obj.statusSelect || obj.status_select) !== 2;
      });

    if (!isStatusDone) {
      this.correctActions(controlForm);
    } else {
      ons.notification.alert(translate("app.quality.endControlError"), {
        id: "status-error"
      });
    }
  };

  renderBottomBar(controlForm) {
    const { control_point_list = [] } = controlForm;

    if (control_point_list && control_point_list.length > 0) {
      return (
        <div
          className="camera-container"
          style={{
            backgroundColor: "#E1AA46",
            display: "flex",
            justifyContent: "flex-end",
            color: "white"
          }}
          onClick={() => this.checkStatus(control_point_list, controlForm)}
        >
          <span style={{ marginRight: 10 }}>
            {translate("app.quality.bottomBarLabelEndControl")}
          </span>
        </div>
      );
    }
  }

  onDeleteContactPoint = item => {
    const { app } = this.props;
    const { platform = "Android" } = app;
    let buttonLabels = [];
    if (platform === "Android") {
      buttonLabels = [
        translate("Alert.okButton"),
        translate("Alert.cancelButton")
      ];
    } else if (platform === "Ios") {
      buttonLabels = [
        translate("Alert.cancelButton"),
        translate("Alert.okButton")
      ];
    }

    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "delete-contact-point",
        buttonLabels
      })
      .then(res => {
        if (res === 0 && platform === "Android") {
          this.deleteControlPoint(item);
        }
        if (res === 1 && platform === "Ios") {
          this.deleteControlPoint(item);
        }
      });
  };

  deleteControlPoint = item => {
    const { controlForm } = this.state;
    const { control_point_list, optional_control_point_list } = controlForm;
    const target = control_point_list.findIndex(d => d.id === item.id);
    const optionalTarget = optional_control_point_list.findIndex(
      d => d.id === item.id
    );
    if (target >= 0) {
      control_point_list.splice(target, 1);
    }
    if (optionalTarget >= 0) {
      optional_control_point_list.splice(optionalTarget, 1);
    }

    this.setState({
      controlForm: {
        ...controlForm,
        control_point_list,
        optional_control_point_list
      }
    });
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { controlForm } = this.state;
    const { control_point_list } = controlForm;
    let temp;
    temp = control_point_list[oldIndex];
    control_point_list[oldIndex] = control_point_list[newIndex];
    control_point_list[newIndex] = temp;

    control_point_list.forEach((point, index) => {
      control_point_list[index].sequence = index;
    });

    this.setState({
      controlForm: { ...controlForm, control_point_list }
    });
  };

  renderItem(controlForm) {
    const { getRecordsByIndex, recordIndex, updateControl } = this.props.route;
    const { fields, user = {} } = this.state;
    if (!fields) return null;
    const getField = key => {
      const field = fields.find(f => f.name === key);
      return field.label ? translate(`app.${field.label}`) : "";
    };
    const { active_team = {} } = user;
    const { project } = controlForm;
    const { customer_address, contact_partner } = project || {};
    const { fullName: fullCustomerAddress } = customer_address || {};
    const { fullName: contactFullName } = contact_partner || {};
    return (
      <div style={{ marginBottom: 65 }}>
        <CardView principalView>
          <div style={{ padding: "10px 10px 10px 15px" }}>
            <CardView.InputField
              edit={this.state.edit}
              title={getField("name")}
              onChange={e => this.changeField("name", e.target.value)}
              value={controlForm && controlForm.name}
            />
            <RenderManyToOne
              name="project"
              fieldLabel={getField("project")}
              placeholder={getField("project")}
              targetName="full_name"
              displayField="name"
              value={controlForm && controlForm.project}
              liveSearch={false}
              searchAPI={() => this.props.qualitycontrol.refs.project.search()}
              onChange={e => this.changeField("project", e.target.value)}
              edit={this.state.edit}
              navigator={this.props.navigator}
              all={true}
            />
          </div>
        </CardView>
        <Tabs
          tabs={[
            { title: translate("app.quality.controlPointTab"), value: 1 },
            { title: translate("app.quality.details"), value: 2 }
          ]}
          activeColor="#E1AA46"
          activeTab={this.state.activeTab}
          onChange={e => this.setState({ activeTab: e })}
          titleClassName="contact-tab"
        />
        {this.state.activeTab === 1 &&
        controlForm.control_point_list &&
        controlForm.control_point_list.length > 0 ? (
          <DraggableList
            pressDelay={200}
            items={controlForm.control_point_list}
            onSortEnd={this.onSortEnd}
            renderControlPointView={this.renderControlPointView}
            onDeleteContactPoint={this.onDeleteContactPoint}
            edit={this.state.edit}
          />
        ) : (
          this.state.activeTab === 1 && (
            <div
              className="list-container"
              style={{ padding: "15px", justifyContent: "center" }}
            >
              {translate("common.noControlPointList")}
            </div>
          )
        )}
        {this.state.activeTab === 2 && (
          <CardView>
            <div style={{ padding: "10px 10px 10px 15px" }}>
              <RenderManyToOne
                name="responsible"
                fieldLabel={getField("responsible")}
                placeholder={getField("responsible")}
                targetName="name"
                displayField="name"
                value={controlForm && controlForm.responsible}
                liveSearch={false}
                searchAPI={e =>
                  this.props.qualitycontrol.refs.responsible.search(e)
                }
                onChange={e => this.changeField("responsible", e.target.value)}
                edit={this.state.edit}
                navigator={this.props.navigator}
              />
              <RenderManyToOne
                name="team"
                fieldLabel={getField("team")}
                placeholder={getField("team")}
                targetName="name"
                displayField="name"
                value={controlForm && controlForm.team}
                liveSearch={false}
                searchAPI={e => {
                  if (e.search) {
                    const { searchAll } = this.props.qualitycontrol.refs.team;
                    return searchAll(e);
                  } else {
                    const { searchAll } = this.props.qualitycontrol.refs.team;
                    const options = {
                      data: {
                        _domain: `self.typeSelect = 'quality'`,
                        _domainContext: {
                          myActiveTeamId: active_team.id
                        }
                      }
                    };

                    return searchAll({ ...options });
                  }
                }}
                onChange={e => this.changeField("team", e.target.value)}
                edit={this.state.edit}
                navigator={this.props.navigator}
              />
              <CardView.InputField
                edit={false}
                title={translate("app.quality.customerAddress")}
                value={fullCustomerAddress}
              />
              <CardView.InputField
                edit={false}
                title={translate("app.quality.contact")}
                value={contactFullName}
              />
            </div>
          </CardView>
        )}
        <div style={{ margin: 15 }}>
          <Button
            style={{
              backgroundColor: "#2F84D0",
              borderRadius: 20,
              width: "100%",
              marginTop: 10,
              textTransform: "inherit",
              textAlign: "center"
            }}
            onClick={async () => {
              this.props.navigator.pushPage(
                {
                  key: "ControlPointTypes " + new Date(),
                  component: ControlPointTypes,
                  data: controlForm,
                  recordIndex,
                  updateControl,
                  recordList: this.state.recordList,
                  onSave: async (controlPoint, recordList, control) => {
                    const targetIndex = recordList.findIndex(
                      r => r.id === control.id
                    );
                    if (targetIndex !== -1) {
                      const record = { ...recordList[targetIndex] };
                      const { control_point_list = [] } = record;
                      control_point_list.push({ ...controlPoint });
                      recordList[targetIndex] = {
                        ...record,
                        control_point_list
                      };
                      this.setState({ recordList, isLoading: true });
                      await this.saveRecord(false, false, true);
                    } else {
                      console.log("ERROR");
                    }
                  },
                  getRecordsByIndex
                },
                { animation: "none" }
              );
            }}
          >
            {translate("app.quality.addControlPoint")}
          </Button>
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
    const { hookState, isLoading, controlForm } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(controlForm);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { recordList, isLoading, controlForm, isNew } = this.state;
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
        renderBottomBar={this.renderBottomBar(controlForm)}
      >
        {this.renderAlertBox()}
        {isNew ? (
          this.renderItem(controlForm)
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

ControlForm.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => {
  return { user_data: state.user, app: state.app };
};

export default connectAppProject(
  connect(reduxConnect(mapPropsToState)(ControlForm))
);
