import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import connect from "../connect/manuf-order";
import {
  List,
  ListItem,
  Toolbar,
  ToolbarButton,
  Icon,
  ProgressCircular,
  Select,
  PullHook,
  Toast,
} from "react-onsenui";

import ons from "onsenui";
import { connect as reduxConnect } from "react-redux";

import Page, { PageElement } from "../../page";
import { debounceCallback } from "../../debounce";
import Translate, { translate } from "../../../locale";
import "./style.css";
import { statusSelect, prioritySelect } from "./common";
import { CardView, TabberView, SwiperView } from "./../../../components";
import { AlertDialog, Modal } from "react-onsenui";
import { RenderManyToOne, Tabs } from "../../page-comment-list";
import { downloadFile, openFile } from "../../sale/sales/download";
import OperationOrderView from "../operation-orders/view";

class ManufOrderView extends Component {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    const activeTeam = info.active_team || null;
    this.state = {
      manufOrder: {},
      manufOrderForm: {},
      recordList: [],
      upcomingEventList: [],
      completedEventList: [],
      dashletType: 1,
      overviewPanel: 1,
      activityLoading: false,
      submitError: {
        content: null,
        title: null,
      },
      hookState: "initial",
      edit: false,
      isNew: false,
      showErrorDialog: false,
      isLoading: false,
      commentMessage: "",
      all: [],
      total: 0,
      limit: 4,
      offset: 0,
      activeIndex: 0,
    };
  }

  async componentDidMount() {
    const { route } = this.props;
    const {
      data,
      getRecordsByIndex,
      manageWorkshop,
      enableMultiCompany,
    } = route;

    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex((r) => r.id === data.id);
        if (targetIndex !== -1) {
          this.swiper.slideTo(targetIndex, 0, true);
          this.setState({
            recordList: records,
            activeIndex: targetIndex,
            manageWorkshop,
            enableMultiCompany,
          });
          this.fetchNewData(data);
        } else {
          this.setState(
            {
              recordList: [data],
              operationOrder: data,
              manageWorkshop,
              enableMultiCompany,
            },
            () => {
              this.fetchNewData(data);
            }
          );
        }
      }
    } else {
      this.setState({
        isNew: true,
        edit: true,
        manageWorkshop,
        enableMultiCompany,
      });
    }
  }

  getApi() {
    return this.props.manuforder;
  }

  getCurrentRecord() {
    return this.state.manufOrder;
  }

  fetchNewData(data) {
    const { fetch } = this.props.manuforder;
    const { limit, offset } = this.state;
    const related = {
      productionOrder: ["project"],
      timesheet: ["project"],
      operationOrderList: ["name", "operationName"],
      toProduceProdProductList: ["product", "qty", "unit"],
      prodProcess: ["name"],
      toConsumeProdProductList: ["product", "qty", "plannedQty", "unit"],
    };
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, related).then((res) => {
          const { data } = res;
          if (data && data.length > 0) {
            const manufOrder = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              (r) => r.id === manufOrder.id
            );
            recordList[targetIndex] = Object.assign({}, manufOrder);
            this.setState(
              { manufOrder, recordList, isLoading: false },
              () => {}
            );
          }
        });
      }, 300);
    });
  }

  changeField(field, value) {
    const { manufOrder, recordList, manufOrderForm, isNew } = this.state;
    if (isNew) {
      manufOrderForm[field] = value;
      this.setState({ manufOrderForm });
    } else {
      const targetIndex = recordList.findIndex((r) => r.id === manufOrder.id);
      const record = { ...recordList[targetIndex] };
      record[field] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  editRecord() {
    this.setState({ edit: true });
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, manufOrder } = this.state;
      const targetIndex = recordList.findIndex(
        (record) => record.id === manufOrder.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !==
          JSON.stringify(manufOrder) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "crm-operationorder",
            buttonLabels: [
              translate("Alert.cancelButton"),
              translate("Alert.yesButton"),
            ],
          })
          .then((res) => {
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
    const { recordList, manufOrder } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        (record) => record.id === manufOrder.id
      );
      this.isRecordChanged(close).then((ok) => {
        if (ok) {
          recordList[targetIndex] = manufOrder;
          this.setState({ edit: false, manufOrder, recordList });
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
    this.isRecordChanged(true).then((ok) => {
      if (ok) {
        this.props.navigator.popPage();
      }
    });
  }

  validateEmail(emailField = {}) {
    const { address } = emailField;
    var reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+?\.[a-zA-Z]{2,3}$/;
    return reg.test(address);
  }

  validateData(manufOrderForm) {
    let isValid = true;
    return isValid;
  }

  closeLoading() {
    this.setState({ isLoading: false });
  }

  startLoading() {
    this.setState({ isLoading: true });
  }

  saveRecord() {
    const { manufOrder, recordList, manufOrderForm, isNew } = this.state;
    const { onUpdate, onNewUpdate } = this.props.route;
    const { add, update } = this.props.manuforder;
    if (isNew) {
      if (!this.validateData(manufOrderForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add(manufOrderForm).then((res) => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "manufOrder-error",
          });
          this.setState({ isLoading: false });
        } else {
          const { data } = res;
          if (data && data.length > 0) {
            const newRecord = data[0];
            if (onNewUpdate) {
              onNewUpdate(newRecord);
            }
            this.setState({ isNew: false, edit: false }, () => {
              this.onRecordSwipe(newRecord);
            });
          } else {
            this.closeLoading();
          }
        }
      });
    } else {
      const record = recordList.find((r) => r.row_id === manufOrder.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        update(record).then((res) => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "manufOrder-error",
            });
            this.setState({ isLoading: false });
          } else {
            const { data } = res;
            if (data && data.length > 0) {
              const newRecord = data[0];
              if (onUpdate) {
                onUpdate(newRecord);
              }
              this.closeEdit().then((res) => {
                this.fetchNewData(newRecord);
              });
            } else {
              this.closeLoading();
            }
          }
        });
      }
    }
  }

  removeRecord(record) {
    const { remove } = this.props.manuforder;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-operationorder",
      })
      .then((res) => {
        if (res === 1) {
          remove(record).then((res) => {
            if (this.props.route.removeRecord) {
              this.props.route.removeRecord(record);
            }
            this.props.navigator.popPage();
          });
        }
      });
  }

  hasField(fieldName) {
    const { fields } = this.props.manuforder;
    const targetIndex = fields.findIndex((field) => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  isFollowUpPanelEmpty() {
    const { manufOrder } = this.state;
    if (manufOrder.user || manufOrder.team) {
      return false;
    }
    return true;
  }

  isContactPanelEmpty() {
    const { manufOrder } = this.state;
    if (
      manufOrder.mobile_phone ||
      manufOrder.fixed_phone ||
      manufOrder.email_address
    ) {
      return false;
    }
    return true;
  }

  onSuccess(result) {
    console.log("Success:" + result);
  }

  onError(result) {
    console.log("Error:" + result);
    ons.notification.alert(result, {
      id: "phone-error",
    });
  }

  onMobileClick(e, manufOrderForm) {
    e.preventDefault();
    window.plugins.CallNumber &&
      window.plugins.CallNumber.callNumber(
        this.onSuccess,
        this.onError,
        manufOrderForm.mobile_phone,
        true
      );
  }

  isPrimaryAddressEmpty() {
    const { manufOrder } = this.state;
    if (
      manufOrder.primary_address ||
      manufOrder.primary_city ||
      manufOrder.primary_country ||
      manufOrder.primary_state ||
      manufOrder.primary_postal_code
    ) {
      return false;
    }
    return true;
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.manuforder;
    const targetIndex = fields.findIndex((field) => field.name === fieldName);
    return targetIndex !== -1
      ? translate(fields[targetIndex].label)
      : undefined;
  }

  mapObjectToList(object) {
    return Object.keys(object).map((key) => {
      return { id: key, name: object[key] };
    });
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

  openOperationOrder(manufOrder) {
    const { manageWorkshop, enableMultiCompany } = this.state;
    this.props.navigator.pushPage(
      {
        component: OperationOrderView,
        path: "OperationOrderView",
        data: manufOrder,
        manageWorkshop,
        enableMultiCompany,
        onUpdate: (record) => {
          // const targetIndex = eventList.findIndex((e) => e.id === record.id);
          // eventList[targetIndex] = { ...record };
          // this.setState({ eventList });
        },
      },
      { animation: "none" }
    );
  }

  renderOperationOrderList(item, index) {
    return (
      <ListItem
        key={index}
        modifier="longdivider"
        className="dashlet-row"
        onClick={() => this.openOperationOrder(item)}
      >
        <div className="customer-item">
          <span className="dashlet-list-normal">{item.name}</span>
          <span className="dashlet-list-normal">{item.operationName}</span>
        </div>
      </ListItem>
    );
  }

  renderConsumeProduceProductList(item, index) {
    return (
      <ListItem key={index} modifier="longdivider" className="dashlet-row">
        <div className="customer-item">
          <span className="dashlet-list-normal">
            {item.product && item.product.fullName}
          </span>
          <span className="dashlet-list-normal">
            {Number(item.qty).toFixed(2)}
            {item.unit ? ` ${item.unit.name}` : ""}
          </span>
        </div>
      </ListItem>
    );
  }

  renderToolbar() {
    const { recordList, isNew } = this.state;
    const original = this.state.manufOrder;
    let manufOrder = {};
    if (isNew) {
      manufOrder = this.state.manufOrderForm;
    } else {
      manufOrder = recordList.find((r) => r.row_id === original.row_id) || {};
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
            {manufOrder ? manufOrder.manufOrderSeq : ""}
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!manufOrder.id}>
            {this.state.edit && (
              <div
                key="cancel"
                style={{
                  color: "rgba(44, 196,211,1)",
                  marginRight: 5,
                  display: isNew ? "none" : "inherit",
                }}
                className="round-icon"
                onClick={() => this.closeEdit(true)}
              >
                <Icon icon="fa-close" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!manufOrder.id}>
            {this.state.edit ? (
              <div
                onClick={() => this.saveRecord()}
                style={{ padding: "5px 15px 5px 0px" }}
              >
                <div
                  key="save"
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                >
                  <Icon icon="fa-save" />
                </div>
              </div>
            ) : (
              <div
                onClick={() => this.editRecord()}
                style={{ padding: "5px 15px 5px 0px" }}
              >
                <div
                  key="edit"
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                >
                  <Icon icon="fa-pencil" />
                </div>
              </div>
            )}
          </PageElement>
        </div>
      </Toolbar>
    );
  }

  manyToOneProps = (name, value, label, placeholder) => ({
    edit: this.state.edit,
    navigator: this.props.navigator,
    targetName: name,
    displayField: name,
    value,
    fieldLabel: label,
    placeholder: placeholder,
  });

  renderLeadBasicFields(manufOrderForm) {
    const { manufOrder } = this.state;
    return (
      <div>
        {this.hasField("name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("name")}
            onChange={(e) => this.changeField("name", e.target.value)}
            value={manufOrderForm.name}
          />
        )}
        {this.hasField("first_name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("first_name")}
            onChange={(e) => this.changeField("first_name", e.target.value)}
            value={manufOrderForm.first_name}
          />
        )}
        {this.hasField("status_select") && (
          <CardView.FieldWrapper
            fieldLabel={this.getFieldLabel("status_select")}
            edit={this.state.edit}
          >
            <Select
              className="status-select-input"
              value={`${manufOrderForm.status_select}`}
              onChange={(e) =>
                this.changeField("status_select", e.target.value)
              }
              style={{ width: "100%" }}
            >
              <option disabled value></option>
              {Object.keys(statusSelect).map(
                (s, i) =>
                  ([null, undefined].includes(manufOrder.status_select) ||
                    s >= manufOrder.status_select) && (
                    <option key={i} value={s}>
                      {translate(`Production.status.${statusSelect[s]}`)}
                    </option>
                  )
              )}
            </Select>
          </CardView.FieldWrapper>
        )}
        {this.hasField("user") && (
          <RenderManyToOne
            name="user"
            searchAPI={(e) => this.props.manuforder.refs.user.searchAll(e)}
            onChange={(e) => this.changeField("user", e.target.value)}
            {...this.manyToOneProps(
              "full_name",
              manufOrderForm.user,
              this.getFieldLabel("user"),
              translate("select_user")
            )}
          />
        )}
      </div>
    );
  }

  onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      this.setState({ recordList: list, offset: 0, total: 0, all: [] }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex((r) => r.id === record.id);
        this.fetchNewData(record);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    }
    debounceCallback(() => {
      this.closeEdit().then((res) => {
        this.fetchNewData(record);
      });
    });
  }

  renderLeadBasic(manufOrderForm) {
    return (
      <CardView className="lead-principal-tab">
        {this.renderLeadBasicFields(manufOrderForm)}
      </CardView>
    );
  }

  changeStatus(newStatusSelect, statusAction, manufOrder) {
    const { recordList } = this.state;
    const { action, fetch, update } = this.props.api;
    const data = {
      context: {
        _model: "com.axelor.apps.production.db.OperationOrder",
        ...manufOrder,
      },
    };
    const actionName = `${statusAction},save`;
    this.setState({ isLoading: true });
    action(actionName, data).then(async (res) => {
      if (res.data && Array.isArray(res.data)) {
        const fetchRes = await fetch(manufOrder);
        const data = fetchRes.data[0];
        update({
          version: data.version,
          id: data.id,
          statusSelect: newStatusSelect,
        }).then((result) => {
          if (result.data && Array.isArray(result.data)) {
            const targetIndex = recordList.findIndex(
              (r) => r.id === manufOrder.id
            );
            const record = { ...recordList[targetIndex] };
            recordList[targetIndex] = {
              ...record,
              version: result.data[0].version,
              statusSelect: result.data[0].statusSelect,
            };
            this.setState({ recordList, isLoading: false });
          } else {
            this.setState({ isLoading: false });
          }
        });
      } else {
        this.setState({ isLoading: false });
      }
    });
  }

  printOrder(manufOrder) {
    const { action, wsFilesURL } = this.props.api;
    const data = {
      context: {
        ...manufOrder,
      },
    };
    const actionName = "action-manuf-order-method-print";
    this.setState({ downloadToast: true });
    action(actionName, data).then((d) => {
      wsFilesURL(d.data[0].view.views[0].name).then((res) => {
        var url_string = res;
        var url = new URL(url_string);
        var name = url.searchParams.get("name");
        downloadFile(res, name).then(({ nativeURL }) => {
          setTimeout(() => {
            this.setState({ downloadToast: false });
            openFile(nativeURL, "application/pdf");
          }, 1500);
        });
      });
    });
  }

  renderWkfButtons(manufOrder) {
    const { statusSelect } = manufOrder;
    return (
      <React.Fragment>
        {statusSelect === 1 && (
          <CardView.ActionItem
            icon="fa-calendar"
            onClick={() =>
              this.changeStatus(3, "action-manuf-order-method-plan", manufOrder)
            }
          >
            <Translate text="Production.plan" />
          </CardView.ActionItem>
        )}
        {statusSelect === 3 && (
          <CardView.ActionItem
            icon="fa-play"
            onClick={() =>
              this.changeStatus(
                4,
                "action-manuf-order-method-start",
                manufOrder
              )
            }
          >
            <Translate text="Production.start" />
          </CardView.ActionItem>
        )}
        {statusSelect === 4 && (
          <React.Fragment>
            <CardView.ActionItem
              icon="fa-pause"
              onClick={() =>
                this.changeStatus(
                  5,
                  "action-manuf-order-method-pause",
                  manufOrder
                )
              }
            >
              <Translate text="Production.pause" />
            </CardView.ActionItem>
            <CardView.ActionItem
              icon="fa-power-off"
              onClick={() =>
                this.changeStatus(
                  6,
                  "action-manuf-order-method-finish",
                  manufOrder
                )
              }
            >
              <Translate text="Production.finish" />
            </CardView.ActionItem>
          </React.Fragment>
        )}
        {statusSelect === 5 && (
          <CardView.ActionItem
            icon="fa-step-forward"
            onClick={() =>
              this.changeStatus(
                4,
                "action-manuf-order-method-resume",
                manufOrder
              )
            }
          >
            <Translate text="Production.resume" />
          </CardView.ActionItem>
        )}
      </React.Fragment>
    );
  }

  /* render lead view */
  renderItem(manufOrderForm) {
    const { activityLoading, isNew, edit } = this.state;
    return (
      <div style={{ marginBottom: 25 }}>
        {isNew && edit ? (
          this.renderLeadBasic(manufOrderForm)
        ) : (
          <CardView principalView>
            {/* {edit ? (
              <div style={{ padding: "10px 10px 10px 15px" }}>
                {this.renderLeadBasicFields(manufOrderForm)}
              </div>
            ) : ( */}
            <div
              style={{
                paddingBottom: 10,
                paddingTop: 20,
                textAlign: "center",
              }}
            >
              {this.hasField("manufOrderSeq") && (
                <CardView.InputField
                  edit={false}
                  title={this.getFieldLabel("manufOrderSeq")}
                  value={manufOrderForm.manufOrderSeq}
                  onChange={(e) => {
                    // this.changeStartDate(e.target.value);
                  }}
                />
              )}

              <CardView.TagButton
                className={`priority-tag-button prioritySelect-${manufOrderForm.prioritySelect}`}
              >
                {translate(
                  `Production.priorityStatus.${
                    prioritySelect[manufOrderForm.prioritySelect]
                  }`
                )}
              </CardView.TagButton>

              <CardView.TagButton>
                {translate(
                  `Production.status.${
                    statusSelect[manufOrderForm.statusSelect]
                  }`
                )}
              </CardView.TagButton>

              {this.hasField("plannedStartDateT") && (
                <CardView.DateTimeField
                  edit={false}
                  title={this.getFieldLabel("plannedStartDateT")}
                  value={manufOrderForm.plannedStartDateT}
                  onChange={(e) => {
                    // this.changeStartDate(e.target.value);
                  }}
                />
              )}
              {this.hasField("product") && (
                <CardView.InputField
                  value={
                    manufOrderForm.product
                      ? manufOrderForm.product.fullName
                      : ""
                  }
                  textClassName="lead-person-name"
                  className="principal-details-field"
                  style={{ marginTop: 25, marginBottom: 2 }}
                />
              )}
              <div className="qty-container">
                {this.hasField("qty") && (
                  <CardView.InputField
                    value={
                      manufOrderForm.qty
                        ? `${Number(manufOrderForm.qty).toFixed(2)}`
                        : "0"
                    }
                    textClassName="lead-person-name"
                    className="principal-manuf-qty-details-field"
                    style={{ marginTop: 25, marginBottom: 2 }}
                  />
                )}
                {this.hasField("unit") && (
                  <CardView.InputField
                    value={manufOrderForm.unit ? manufOrderForm.unit.name : ""}
                    textClassName="lead-person-name"
                    className="principal-manuf-qty-details-field"
                    style={{ marginTop: 25, marginBottom: 2 }}
                  />
                )}
              </div>
            </div>
            {/* )} */}
            {!isNew && (
              <CardView.ActionView>
                {this.renderWkfButtons(manufOrderForm)}

                <CardView.ActionItem
                  icon="md-print"
                  onClick={() => this.printOrder(manufOrderForm)}
                >
                  <Translate text="Production.manufOrder" />
                </CardView.ActionItem>
              </CardView.ActionView>
            )}
          </CardView>
        )}
        <CardView
          className="lead-details-tab"
          hidden={this.state.overviewPanel !== 1}
        >
          {this.hasField("qty") && this.state.edit && (
            <CardView.InputField
              type="number"
              edit={this.state.edit}
              title={translate("Production.qty")}
              value={manufOrderForm.qty}
              textClassName="lead-person-name"
              className="principal-manuf-qty-details-field"
              style={{ marginTop: 25, marginBottom: 2 }}
              onChange={(e) => this.changeField("qty", e.target.value)}
            />
          )}
          {this.hasField("company") && this.state.enableMultiCompany && (
            <CardView.InputField
              edit={false}
              title={translate("Production.company")}
              onChange={(e) => this.changeField("company", e.target.value)}
              value={manufOrderForm.company ? manufOrderForm.company.name : "-"}
            />
          )}

          {this.hasField("workshopStockLocation") &&
            this.state.manageWorkshop && (
              <CardView.InputField
                edit={false}
                title={translate("Production.workshopStockLocation")}
                onChange={(e) =>
                  this.changeField("workshopStockLocation", e.target.value)
                }
                value={
                  manufOrderForm.workshopStockLocation
                    ? manufOrderForm.workshopStockLocation.name
                    : "-"
                }
              />
            )}

          {this.hasField("note") && (
            <CardView.TextArea
              edit={false}
              title={translate("Production.note")}
              onChange={(e) => this.changeField("note", e.target.value)}
              value={manufOrderForm.note || "-"}
            />
          )}

          {this.hasField("billOfMaterial") && (
            <CardView.InputField
              edit={false}
              title={translate("Production.billOfMaterial")}
              onChange={(e) =>
                this.changeField("billOfMaterial", e.target.value)
              }
              value={
                manufOrderForm.billOfMaterial
                  ? manufOrderForm.billOfMaterial.fullName
                  : "-"
              }
            />
          )}
          {this.hasField("prodProcess") && (
            <CardView.InputField
              edit={false}
              title={translate("Production.prodProcess")}
              onChange={(e) => this.changeField("prodProcess", e.target.value)}
              value={
                manufOrderForm.prodProcess
                  ? manufOrderForm.prodProcess.name
                  : "-"
              }
            />
          )}
        </CardView>
        <Tabs
          tabs={[
            {
              title: <Translate text="Production.SaleOrderPanel" />,
              value: 1,
            },
          ]}
          activeColor="#2187d4"
          activeTab={this.state.overviewPanel}
          onChange={(e) => this.setState({ overviewPanel: e })}
        />
        <CardView>
          {this.hasField("saleOrder") && (
            <CardView.InputField
              edit={false}
              title={translate("Production.SaleOrderPanel")}
              onChange={(e) => this.changeField("saleOrder", e.target.value)}
              value={
                manufOrderForm.saleOrder
                  ? manufOrderForm.saleOrder.fullName
                  : "-"
              }
            />
          )}
          {this.hasField("moCommentFromSaleOrder") && (
            <CardView.TextArea
              edit={false}
              title={translate("Production.moCommentFromSaleOrder")}
              className="address-text"
              onChange={(e) =>
                this.changeField("moCommentFromSaleOrder", e.target.value)
              }
              value={manufOrderForm.moCommentFromSaleOrder || "-"}
            />
          )}
        </CardView>
        {!this.state.isNew && (
          <div>
            <TabberView>
              <TabberView.Tab
                className="event-list-tab"
                titleClassName="event-list-tabber-title"
                activeColor="#E2AA46"
                title={translate("Production.operationOrderList")}
                active={true}
              />
            </TabberView>
            <div className="tab-content">
              <div className="upcoming-list">
                <List
                  dataSource={manufOrderForm.operationOrderList}
                  renderRow={(row, index) =>
                    this.renderOperationOrderList(row, index)
                  }
                />
                {manufOrderForm.operationOrderList.length === 0 && (
                  <div className="empty-activity-list">
                    <Translate text="Production.noHumanResourceList" />
                  </div>
                )}
                {activityLoading && (
                  <div className="loader-ui">
                    <ProgressCircular indeterminate />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {!this.state.isNew && (
          <div>
            <TabberView>
              <TabberView.Tab
                className="event-list-tab"
                titleClassName="event-list-tabber-title"
                activeColor="#E2AA46"
                title={translate("Production.produceProductList")}
                active={this.state.dashletType === 1}
                onClick={() => this.setState({ dashletType: 1 })}
              />
              {!manufOrderForm.isConsProOnOperation && (
                <TabberView.Tab
                  className="event-list-tab"
                  titleClassName="event-list-tabber-title"
                  activeColor="#E2AA46"
                  title={translate("Production.ConsumeProductList")}
                  active={this.state.dashletType === 2}
                  onClick={() => this.setState({ dashletType: 2 })}
                />
              )}
            </TabberView>
            <div className="tab-content">
              {this.state.dashletType === 1 && (
                <div className="upcoming-list">
                  <List
                    dataSource={manufOrderForm.toProduceProdProductList}
                    renderRow={(row, index) =>
                      this.renderConsumeProduceProductList(row, index)
                    }
                  />
                  {manufOrderForm.toProduceProdProductList.length === 0 && (
                    <div className="empty-activity-list">
                      <Translate text="Production.noProduceProductList" />
                    </div>
                  )}
                  {activityLoading && (
                    <div className="loader-ui">
                      <ProgressCircular indeterminate />
                    </div>
                  )}
                </div>
              )}
              {this.state.dashletType === 2 && (
                <div className="completed-list">
                  <List
                    dataSource={manufOrderForm.toConsumeProdProductList}
                    renderRow={(row, index) =>
                      this.renderConsumeProduceProductList(row, index)
                    }
                  />
                  {manufOrderForm.toConsumeProdProductList.length === 0 && (
                    <div className="empty-activity-list">
                      <Translate text="Production.noConsumeProductList" />
                    </div>
                  )}
                  {activityLoading && (
                    <div className="loader-ui">
                      <ProgressCircular indeterminate />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
    const { hookState, isLoading, manufOrder } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={(e) => this.setState({ hookState: e.state })}
        onLoad={(done) => {
          this.fetchNewData(manufOrder);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, manufOrderForm, isNew } = this.state;
    return (
      <Page
        {...this.props}
        renderToolbar={() => this.renderToolbar()}
        isRecordChanged={() => this.isRecordChanged(true)}
        renderModal={
          isLoading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={isLoading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
      >
        <Toast isOpen={Boolean(this.state.downloadToast)}>
          <div className="message">Opening a file, please wait...</div>
        </Toast>
        {this.renderAlertBox()}

        <React.Fragment>
          {this.renderPullHook()}
          <SwiperView
            recordList={recordList}
            renderItem={(record) => this.renderItem(record)}
            onActive={(record) => this.onRecordSwipe(record)}
            onInitSwiper={(swiper) => (this.swiper = swiper)}
          />
        </React.Fragment>
      </Page>
    );
  }
}

ManufOrderView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(ManufOrderView));
