import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import connect from "../connect/operation-orders";
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
import { typeSelect, statusSelect } from "./common";
import { CardView, TabberView, SwiperView } from "./../../../components";
import { AlertDialog, Modal } from "react-onsenui";
import { RenderManyToOne, Tabs } from "../../page-comment-list";
import { downloadFile, openFile } from "../../sale/sales/download";
import StockMoveView from "../stock-move/view";
import {statusSelect as stockMoveStatusSelect} from "../stock-move/common";

class OperationOrderView extends Component {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    const activeTeam = info.active_team || null;
    this.state = {
      operationOrder: {},
      operationOrderForm: {
        typeSelect: null,
      },
      recordList: [],
      upcomingEventList: [],
      completedEventList: [],
      dashletType: 2,
      overviewPanel: 1,
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

  componentDidMount() {
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
    return this.props.operationorder;
  }

  getCurrentRecord() {
    return this.state.operationOrder;
  }

  fetchNewData(data) {
    const { fetch } = this.props.operationorder;
    const {objectdescription} = this.props.api.refs;
    const { limit, offset } = this.state;
    const related = {
      manufOrder: [
        "isConsProOnOperation",
        "typeSelect",
        "company",
        "workshopStockLocation",
      ],
      workCenter: ["name", "workCenterTypeSelect"],
      prodHumanResourceList: ["employee", "product", "duration"],
      prodProcessLine: ["description", "objectDescriptionList"],
      toConsumeProdProductList: ["product", "qty", "plannedQty", "unit"],
      inStockMoveList: ["company", "stockMoveSeq", "estimatedDate", "fromStockLocation", "statusSelect"]
    };
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, related).then(async (res) => {
          const { data } = res;
          if (data && data.length > 0) {
            const operationOrder = Object.assign({}, data[0]);
            if(operationOrder.prodProcessLine && operationOrder.prodProcessLine.objectDescriptionList && operationOrder.prodProcessLine.objectDescriptionList.length) {
              const ids = operationOrder.prodProcessLine.objectDescriptionList.map(item => item.id);
              const response = await objectdescription.searchAll({
                search: {
                  fields: [
                    { fieldName: 'id', operator: 'in', value: ids },
                  ],
                  operator: 'and',
                },
              });
              if(response && Array.isArray(response.data)) {
                operationOrder.prodProcessLine.objectDescriptionList = [...response.data];
              }
            }
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              (r) => r.id === operationOrder.id
            );
            recordList[targetIndex] = Object.assign({}, operationOrder);
            this.setState(
              { operationOrder, recordList, isLoading: false },
              () => {}
            );
          }
        });
      }, 300);
    });
  }

  changeField(field, value) {
    const {
      operationOrder,
      recordList,
      operationOrderForm,
      isNew,
    } = this.state;
    if (isNew) {
      operationOrderForm[field] = value;
      this.setState({ operationOrderForm });
    } else {
      const targetIndex = recordList.findIndex(
        (r) => r.id === operationOrder.id
      );
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
      const { recordList, operationOrder } = this.state;
      const targetIndex = recordList.findIndex(
        (record) => record.id === operationOrder.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !==
          JSON.stringify(operationOrder) &&
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
    const { recordList, operationOrder } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        (record) => record.id === operationOrder.id
      );
      this.isRecordChanged(close).then((ok) => {
        if (ok) {
          recordList[targetIndex] = operationOrder;
          this.setState({ edit: false, operationOrder, recordList });
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

  validateData(operationOrderForm) {
    let isValid = true;
    if (!operationOrderForm.name || !(operationOrderForm.name.length > 0)) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.nameRequired"),
        },
      });
    }
    // validate an email
    if (
      operationOrderForm.email_address &&
      !this.validateEmail(operationOrderForm.email_address)
    ) {
      isValid = false;
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("Alert.invalidEmail"),
        },
      });
    }
    return isValid;
  }

  closeLoading() {
    this.setState({ isLoading: false });
  }

  startLoading() {
    this.setState({ isLoading: true });
  }

  saveRecord() {
    const {
      operationOrder,
      recordList,
      operationOrderForm,
      isNew,
    } = this.state;
    const { onUpdate, onNewUpdate } = this.props.route;
    const { add, update } = this.props.operationorder;
    if (isNew) {
      if (!this.validateData(operationOrderForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add(operationOrderForm).then((res) => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "operationOrder-error",
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
      const record = recordList.find((r) => r.row_id === operationOrder.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        update(record).then((res) => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "operationOrder-error",
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
    const { remove } = this.props.operationorder;
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
    const { fields } = this.props.operationorder;
    const targetIndex = fields.findIndex((field) => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  isFollowUpPanelEmpty() {
    const { operationOrder } = this.state;
    if (operationOrder.user || operationOrder.team) {
      return false;
    }
    return true;
  }

  isContactPanelEmpty() {
    const { operationOrder } = this.state;
    if (
      operationOrder.mobile_phone ||
      operationOrder.fixed_phone ||
      operationOrder.email_address
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

  onMobileClick(e, operationOrderForm) {
    e.preventDefault();
    window.plugins.CallNumber &&
      window.plugins.CallNumber.callNumber(
        this.onSuccess,
        this.onError,
        operationOrderForm.mobile_phone,
        true
      );
  }

  isPrimaryAddressEmpty() {
    const { operationOrder } = this.state;
    if (
      operationOrder.primary_address ||
      operationOrder.primary_city ||
      operationOrder.primary_country ||
      operationOrder.primary_state ||
      operationOrder.primary_postal_code
    ) {
      return false;
    }
    return true;
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.operationorder;
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

  handlePickingOrderPdf(e, order) {
    e.stopPropagation();
    const actionName = "action-print-picking-stock-move";
    const { action, wsFilesURL } = this.props.operationorder.refs.stockmove;
    const data = {
      context: {
        ...order,
      },
    };
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

  handleStockMovePdf(e, order) {
    e.stopPropagation();
    const actionName = "action-print-stock-move";
    const { action, wsFilesURL } = this.props.operationorder.refs.stockmove;
    const data = {
      context: {
        ...order,
      },
    };
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

  renderHumanResourceList(item, index) {
    return (
      <ListItem key={index} modifier="longdivider" className="dashlet-row">
        <div className="customer-item">
          <span className="dashlet-list-head">
            {item.employee && item.employee.name}
          </span>
          <span className="dashlet-list-normal">
            {item.product && item.product.fullName}
          </span>
          <span className="dashlet-list-normal">
            {(item.duration / 3600).toFixed(2)}
          </span>
        </div>
      </ListItem>
    );
  }

  renderConsumeProductList(item, index) {
    return (
      <ListItem key={index} modifier="longdivider" className="dashlet-row">
        <div className="customer-item">
          <span className="dashlet-list-normal">
            {item.product && item.product.fullName}
          </span>
          <span className="dashlet-list-head">
            {item.unit && item.unit.name}
          </span>
          <span className="dashlet-list-normal">{item.qty}</span>
        </div>
      </ListItem>
    );
  }

  handleStockMoveItemClick(item) {
    this.props.navigator.pushPage(
      {
        component: StockMoveView,
        path: "StockMoveView",
        data: item,
        enableMultiCompany: this.state.enableMultiCompany,
      },
      { animation: "none" }
    )
  }

  renderInStockMoveList(item, index) {
    return (
      <ListItem onClick={() => this.handleStockMoveItemClick(item)} key={index} modifier="longdivider" className="dashlet-row">
        <div className="customer-item">
          <span className="dashlet-list-head">
            {item.stockMoveSeq}
          </span>

          <span className="dashlet-list-normal">
            {item.statusSelect && translate(
              `StockMove.statusSelect.${
                stockMoveStatusSelect[item.statusSelect]
              }`
            )}
          </span>
          {this.state.enableMultiCompany && <span className="dashlet-list-normal">
            {item.company && item.company.name}
          </span>}
          <span className="dashlet-list-normal">
            {item.fromStockLocation && item.fromStockLocation.name}
          </span>
          <span className="dashlet-list-normal">
            {item.estimatedDate}
          </span>
          <div className="instock-move-item-print-view">
            <CardView.ActionItem
              titleClassName="order-action-title"
              iconClassName="print-order-icon"
              className="print-order-container"
              icon="fa-print"
              onClick={(e) => this.handlePickingOrderPdf(e, item)}
            >
              <Translate text="Production.printPickingOrder" />
            </CardView.ActionItem>
            <CardView.ActionItem
              titleClassName="order-action-title"
              iconClassName="print-order-icon"
              className="print-order-container"
              icon="fa-print"
              onClick={(e) => this.handleStockMovePdf(e, item)}
            >
              <Translate text="Production.printStockMove" />
            </CardView.ActionItem>
          </div>
        </div>
      </ListItem>
    );
  }

  renderObjectDescriptionList(item, index) {
    return (
      <ListItem key={index} modifier="longdivider" className="dashlet-row">
        <div className="customer-item">
          <span className="dashlet-list-normal">{item.description}</span>
        </div>
      </ListItem>
    );
  }

  renderToolbar() {
    const { recordList, isNew } = this.state;
    const original = this.state.operationOrder;
    let operationOrder = {};
    if (isNew) {
      operationOrder = this.state.operationOrderForm;
    } else {
      operationOrder =
        recordList.find((r) => r.row_id === original.row_id) || {};
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
            {operationOrder.prodProcessLine
              ? operationOrder.prodProcessLine.name
              : ""}
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          {/* <PageElement key="delete" offline={!operationOrder.id}>
            {this.state.edit ? (
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
            ) : (
              <div
                key="delete"
                style={{ color: "#F44336", marginRight: 5 }}
                className="round-icon"
                onClick={() => this.removeRecord(operationOrder)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!operationOrder.id}>
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
          </PageElement> */}
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

  renderLeadBasicFields(operationOrderForm) {
    const { operationOrder } = this.state;
    return (
      <div>
        {this.hasField("typeSelect") && (
          <CardView.FieldWrapper
            fieldLabel={this.getFieldLabel("typeSelect")}
            edit={this.state.edit}
          >
            <Select
              className="status-select-input"
              value={`${operationOrderForm.manufOrder.typeSelect}`}
              onChange={(e) => this.changeField("typeSelect", e.target.value)}
              style={{ width: "100%" }}
            >
              <option disabled value></option>
              {Object.keys(typeSelect).map((s, i) => (
                <option key={i} value={s}>
                  {translate(`${typeSelect[s]}`)}
                </option>
              ))}
            </Select>
          </CardView.FieldWrapper>
        )}
        {this.hasField("name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("name")}
            onChange={(e) => this.changeField("name", e.target.value)}
            value={operationOrderForm.name}
          />
        )}
        {this.hasField("first_name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("first_name")}
            onChange={(e) => this.changeField("first_name", e.target.value)}
            value={operationOrderForm.first_name}
          />
        )}
        {this.hasField("status_select") && (
          <CardView.FieldWrapper
            fieldLabel={this.getFieldLabel("status_select")}
            edit={this.state.edit}
          >
            <Select
              className="status-select-input"
              value={`${operationOrderForm.status_select}`}
              onChange={(e) =>
                this.changeField("status_select", e.target.value)
              }
              style={{ width: "100%" }}
            >
              <option disabled value></option>
              {Object.keys(statusSelect).map(
                (s, i) =>
                  ([null, undefined].includes(operationOrder.status_select) ||
                    s >= operationOrder.status_select) && (
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
            searchAPI={(e) => this.props.operationorder.refs.user.searchAll(e)}
            onChange={(e) => this.changeField("user", e.target.value)}
            {...this.manyToOneProps(
              "full_name",
              operationOrderForm.user,
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

  renderLeadBasic(operationOrderForm) {
    return (
      <CardView className="lead-principal-tab">
        {this.renderLeadBasicFields(operationOrderForm)}
      </CardView>
    );
  }

  changeStatus(newStatusSelect, statusAction, operationOrder) {
    const { recordList } = this.state;
    const { action, fetch, update } = this.props.api;
    const data = {
      context: {
        _model: "com.axelor.apps.production.db.OperationOrder",
        ...operationOrder,
      },
    };
    const actionName = `${statusAction},save`;
    this.setState({ isLoading: true });
    action(actionName, data).then(async (res) => {
      if (res.data && Array.isArray(res.data)) {
        const fetchRes = await fetch(operationOrder);
        const data = fetchRes.data[0];
        update({
          version: data.version,
          id: data.id,
          statusSelect: newStatusSelect,
        }).then((result) => {
          if (result.data && Array.isArray(result.data)) {
            const targetIndex = recordList.findIndex(
              (r) => r.id === operationOrder.id
            );
            const record = { ...recordList[targetIndex] };
            recordList[targetIndex] = { ...record, ...result.data[0] };
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

  printOrder(operationOrder) {
    const { action, wsFilesURL } = this.props.api;
    const data = {
      context: {
        ...operationOrder,
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

  renderWkfButtons(operationOrder) {
    const { statusSelect } = operationOrder;
    return (
      <React.Fragment>
        {statusSelect === 1 && (
          <CardView.ActionItem
            icon="fa-calendar"
            onClick={() =>
              this.changeStatus(
                3,
                "action-operation-order-group-plan",
                operationOrder
              )
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
                "action-operation-order-group-start",
                operationOrder
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
                  "action-operation-order-group-pause",
                  operationOrder
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
                  "action-operation-order-group-finish",
                  operationOrder
                )
              }
            >
              <Translate text="Production.finish" />
            </CardView.ActionItem>
          </React.Fragment>
        )}
        {statusSelect === 5 && (
          <CardView.ActionItem
            icon="fa-play"
            onClick={() =>
              this.changeStatus(
                4,
                "action-operation-order-group-resume",
                operationOrder
              )
            }
          >
            <Translate text="Production.start" />
          </CardView.ActionItem>
        )}
      </React.Fragment>
    );
  }

  /* render lead view */
  renderItem(operationOrderForm) {
    const { isNew, edit } = this.state;
    const checkWorkCenterTypeSelect = (workCenter) => {
      if (workCenter && [2, 3].includes(workCenter.workCenterTypeSelect)) {
        return true;
      }
      return false;
    };
    return (
      <div style={{ marginBottom: 25 }}>
        {isNew && edit ? (
          this.renderLeadBasic(operationOrderForm)
        ) : (
          <CardView principalView>
            {edit ? (
              <div style={{ padding: "10px 10px 10px 15px" }}>
                {this.renderLeadBasicFields(operationOrderForm)}
              </div>
            ) : (
              <div
                style={{
                  paddingBottom: 10,
                  paddingTop: 20,
                  textAlign: "center",
                }}
              >
                {this.hasField("manufOrder.manufOrderSeq") && (
                  <CardView.InputField
                    edit={false}
                    title={this.getFieldLabel("manufOrder.manufOrderSeq")}
                    value={operationOrderForm["manufOrder.manufOrderSeq"]}
                    onChange={(e) => {
                      // this.changeStartDate(e.target.value);
                    }}
                  />
                )}

                <CardView.TagButton>
                  {translate(
                    `Production.status.${
                      statusSelect[operationOrderForm.statusSelect]
                    }`
                  )}
                </CardView.TagButton>

                {this.hasField("plannedStartDateT") && (
                  <CardView.DateTimeField
                    edit={this.state.edit}
                    title={this.getFieldLabel("plannedStartDateT")}
                    value={operationOrderForm.plannedStartDateT}
                    onChange={(e) => {
                      // this.changeStartDate(e.target.value);
                    }}
                  />
                )}
                {this.hasField("manufOrder.product") && (
                  <CardView.InputField
                    value={
                      operationOrderForm.manufOrder &&
                      operationOrderForm.manufOrder.product
                        ? operationOrderForm.manufOrder.product.fullName
                        : ""
                    }
                    textClassName="lead-person-name"
                    className="principal-details-field"
                    style={{ marginTop: 25, marginBottom: 2 }}
                  />
                )}
              </div>
            )}
            {!isNew && (
              <CardView.ActionView>
                {this.renderWkfButtons(operationOrderForm)}

                <CardView.ActionItem
                  icon="md-print"
                  onClick={() => this.printOrder(operationOrderForm)}
                >
                  <Translate text="Production.operationOrder" />
                </CardView.ActionItem>
              </CardView.ActionView>
            )}
          </CardView>
        )}
        <CardView>
          {this.hasField("manufOrder.company") &&
            this.state.enableMultiCompany && (
              <CardView.InputField
                edit={this.state.edit}
                title={translate("Production.company")}
                onChange={(e) => this.changeField("company", e.target.value)}
                value={
                  operationOrderForm.manufOrder &&
                  operationOrderForm.manufOrder.company
                    ? operationOrderForm.manufOrder.company.name
                    : "-"
                }
              />
            )}
          {this.hasField("priority") && (
            <CardView.InputField
              edit={this.state.edit}
              title={translate("Production.priority")}
              onChange={(e) => this.changeField("priority", e.target.value)}
              value={operationOrderForm.priority || "-"}
            />
          )}
          {this.hasField("operationOrderForm.workshopStockLocation") && (
            <CardView.InputField
              edit={this.state.edit}
              title={translate("Production.workshopStockLocation")}
              onChange={(e) =>
                this.changeField("workshopStockLocation", e.target.value)
              }
              value={
                operationOrderForm["manufOrderForm.workshopStockLocation"]
                  ? operationOrderForm["workshopStockLocation"].name
                  : "-"
              }
            />
          )}
        </CardView>
        <Tabs
          tabs={[
            {
              title: <Translate text="Production.resources_panel" />,
              value: 1,
            },
          ]}
          activeColor="#2187d4"
          activeTab={this.state.overviewPanel}
          onChange={(e) => this.setState({ overviewPanel: e })}
        />
        <div className="resource-tab-container">
          <CardView
            className="lead-details-tab"
            hidden={this.state.overviewPanel !== 1}
          >
            {this.hasField("workCenter") && (
              <CardView.InputField
                edit={this.state.edit}
                title={translate("Production.workCenter")}
                onChange={(e) => this.changeField("workCenter", e.target.value)}
                value={
                  operationOrderForm.workCenter
                    ? operationOrderForm.workCenter.name
                    : "-"
                }
              />
            )}
            {this.hasField("machine") &&
              checkWorkCenterTypeSelect(operationOrderForm.workCenter) && (
                <CardView.InputField
                  edit={this.state.edit}
                  title={translate("Production.machine")}
                  onChange={(e) => this.changeField("machine", e.target.value)}
                  value={
                    operationOrderForm.machine
                      ? operationOrderForm.machine.name
                      : "-"
                  }
                  onClick={(e) => this.onMobileClick(e, operationOrderForm)}
                />
              )}
          </CardView>
          {this.state.overviewPanel === 1 && <React.Fragment>
            <TabberView containerClassName="object-descrioption-container">
              <TabberView.Tab
                className="event-list-tab"
                titleClassName="event-list-tabber-title"
                activeColor="#E2AA46"
                title={translate("Production.human_resources_panel")}
              />
            </TabberView>
            <div className="upcoming-list">
              <List
                dataSource={operationOrderForm.prodHumanResourceList || []}
                renderRow={(row, index) =>
                  this.renderHumanResourceList(row, index)
                }
              />
              {operationOrderForm.prodHumanResourceList &&
                operationOrderForm.prodHumanResourceList.length === 0 && (
                  <div className="empty-activity-list">
                    <Translate text="Production.noHumanResourceList" />
                  </div>
                )}
            </div>
          </React.Fragment>}
          {/* <TabberView>
            <TabberView.Tab
              className="event-list-tab"
              titleClassName="event-list-tabber-title"
              activeColor="#E2AA46"
              title={translate("Production.human_resources_panel")}
            />
          </TabberView>
          <div className="tab-content">
            <div className="upcoming-list">
              <List
                dataSource={operationOrderForm.prodHumanResourceList || []}
                renderRow={(row, index) =>
                  this.renderHumanResourceList(row, index)
                }
              />
              {operationOrderForm.prodHumanResourceList &&
                operationOrderForm.prodHumanResourceList.length === 0 && (
                  <div className="empty-activity-list">
                    <Translate text="Production.noHumanResourceList" />
                  </div>
                )}
            </div>
          </div> */}
        </div>
        <Tabs
          tabs={[
            {
              title: <Translate text="Production.prodProcessLinePanel" />,
              value: 1,
            },
          ]}
          activeColor="#2187d4"
          activeTab={this.state.overviewPanel}
          onChange={(e) => this.setState({ overviewPanel: e })}
        />
        <CardView>
          {this.hasField("prodProcessLine.description") && (
            <CardView.TextArea
              edit={this.state.edit}
              title={translate("Production.prodProcessLine.description")}
              className="address-text"
              onChange={(e) =>
                this.changeField("prodProcessLine", e.target.value)
              }
              value={
                operationOrderForm.prodProcessLine
                  ? operationOrderForm.prodProcessLine.description || "-"
                  : "-"
              }
            />
          )}
        </CardView>
        <TabberView containerClassName="object-descrioption-container">
          <TabberView.Tab
            className="event-list-tab"
            titleClassName="event-list-tabber-title"
            activeColor="#E2AA46"
            title={translate("Production.ObjectDesctiptionPanel")}
          />
        </TabberView>
        <div className="tab-content">
          <div className="upcoming-list">
            <List
              dataSource={
                operationOrderForm.prodProcessLine ? operationOrderForm.prodProcessLine.objectDescriptionList : []
              }
              renderRow={(row, index) =>
                this.renderObjectDescriptionList(row, index)
              }
            />
            {operationOrderForm.prodProcessLine &&
              operationOrderForm.prodProcessLine.objectDescriptionList &&
              operationOrderForm.prodProcessLine.objectDescriptionList
                .length === 0 && (
                <div className="empty-activity-list">
                  <Translate text="Production.noObjectDescriptionList" />
                </div>
              )}
          </div>
        </div>

        {!this.state.isNew && (
          <div className="consume-product-container">
            <TabberView>
              {/* <TabberView.Tab
                className="event-list-tab"
                titleClassName="event-list-tabber-title"
                activeColor="#E2AA46"
                title={translate("Production.human_resources_panel")}
                active={this.state.dashletType === 1}
                onClick={() => this.setState({ dashletType: 1 })}
              /> */}
              {operationOrderForm.manufOrder &&
                operationOrderForm.manufOrder.isConsProOnOperation && (
                  <TabberView.Tab
                    className="event-list-tab"
                    titleClassName="event-list-tabber-title"
                    activeColor="#E2AA46"
                    title={translate("Production.ConsumeProductList")}
                    active={this.state.dashletType === 2}
                    onClick={() => this.setState({ dashletType: 2 })}
                  />
                )}
                {operationOrderForm.manufOrder &&
                operationOrderForm.manufOrder.isConsProOnOperation && (
                  <TabberView.Tab
                    className="event-list-tab"
                    titleClassName="event-list-tabber-title"
                    activeColor="#E2AA46"
                    title={translate("Production.IsStockMoveList")}
                    active={this.state.dashletType === 3}
                    onClick={() => this.setState({ dashletType: 3 })}
                  />
                )}
            </TabberView>
            <div className="tab-content">
              {/* {this.state.dashletType === 1 && (
                <div className="upcoming-list">
                  <List
                    dataSource={operationOrderForm.prodHumanResourceList || []}
                    renderRow={(row, index) =>
                      this.renderHumanResourceList(row, index)
                    }
                  />
                  {operationOrderForm.prodHumanResourceList &&
                    operationOrderForm.prodHumanResourceList.length === 0 && (
                      <div className="empty-activity-list">
                        <Translate text="Production.noHumanResourceList" />
                      </div>
                    )}
                </div>
              )} */}
              {this.state.dashletType === 2 && operationOrderForm.manufOrder && operationOrderForm.manufOrder.isConsProOnOperation && (
                <div className="completed-list">
                  <List
                    dataSource={operationOrderForm.toConsumeProdProductList}
                    renderRow={(row, index) =>
                      this.renderConsumeProductList(row, index)
                    }
                  />
                  {operationOrderForm.toConsumeProdProductList.length === 0 && (
                    <div className="empty-activity-list">
                      <Translate text="Production.noConsumeProductList" />
                    </div>
                  )}
                </div>
              )}
              {this.state.dashletType === 3 && operationOrderForm.manufOrder && operationOrderForm.manufOrder.isConsProOnOperation && (
                <div className="completed-list">
                  <List
                    dataSource={operationOrderForm.inStockMoveList}
                    renderRow={(row, index) =>
                      this.renderInStockMoveList(row, index)
                    }
                  />
                  {operationOrderForm.inStockMoveList.length === 0 && (
                    <div className="empty-activity-list">
                      <Translate text="Production.noInStockMoveList" />
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
    const { hookState, isLoading, operationOrder } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={(e) => this.setState({ hookState: e.state })}
        onLoad={(done) => {
          this.fetchNewData(operationOrder);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, operationOrderForm, isNew } = this.state;
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

OperationOrderView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(OperationOrderView));
