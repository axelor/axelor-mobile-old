import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import connect from "../connect/stock-move";
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
import { originTypeSelect, statusSelect, availableStatusSelect } from "./common";
import { CardView, TabberView, SwiperView } from "./../../../components";
import { AlertDialog, Modal } from "react-onsenui";
import { RenderManyToOne, Tabs } from "../../page-comment-list";
import { downloadFile, openFile } from "../../sale/sales/download";
import { runAction } from "../../common.func";

class StockMoveView extends Component {
  constructor(props) {
    super(props);
    const { info } = this.props.user_data.data;
    const activeTeam = info.active_team || null;
    this.state = {
      stockMove: {},
      stockMoveForm: {
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
            stockMove: data,
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
    return this.props.stockmove;
  }

  getCurrentRecord() {
    return this.state.stockMove;
  }

  fetchNewData(data) {
    const { fetch } = this.props.stockmove;
    const { stockmoveline } = this.props.api.refs;
    const { limit, offset } = this.state;
    const related = {
      stockMoveLineList: [
        "product",
        "availableStatusSelect",
        "availableStatus",
        "qty",
        "realQty",
        "unit",
        "trackingNumber",
        "netMass",
      ],
    };
    this.setState({ isLoading: true }, () => {
      setTimeout(() => {
        fetch(data, related).then(async(res) => {
          const { data } = res;
          if (data && data.length > 0) {
            const stockMove = Object.assign({}, data[0]);
            if(stockMove.stockMoveLineList && stockMove.stockMoveLineList.length) {
              const ids = stockMove.stockMoveLineList.map(e => e.id);
              const response = await stockmoveline.searchAll({
                search: {
                  fields: [
                    { fieldName: 'id', operator: 'in', value: ids },
                  ],
                  operator: 'and',
                },
              });
              if(response && Array.isArray(response.data)) {
                stockMove.stockMoveLineList = [...response.data];
              }
            }
            // const stockMoveLineList =
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              (r) => r.id === stockMove.id
            );
            recordList[targetIndex] = Object.assign({}, stockMove);
            this.setState(
              { stockMove, recordList, isLoading: false },
              () => {}
            );
          }
        });
      }, 300);
    });
  }

  changeField(field, value) {
    const {
      stockMove,
      recordList,
      stockMoveForm,
      isNew,
    } = this.state;
    if (isNew) {
      stockMoveForm[field] = value;
      this.setState({ stockMoveForm });
    } else {
      const targetIndex = recordList.findIndex(
        (r) => r.id === stockMove.id
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
      const { recordList, stockMove } = this.state;
      const targetIndex = recordList.findIndex(
        (record) => record.id === stockMove.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !==
          JSON.stringify(stockMove) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "crm-stockMove",
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
    const { recordList, stockMove } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        (record) => record.id === stockMove.id
      );
      this.isRecordChanged(close).then((ok) => {
        if (ok) {
          recordList[targetIndex] = stockMove;
          this.setState({ edit: false, stockMove, recordList });
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

  validateData(stockMoveForm) {
    let isValid = true;
    if (!stockMoveForm.name || !(stockMoveForm.name.length > 0)) {
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
      stockMoveForm.email_address &&
      !this.validateEmail(stockMoveForm.email_address)
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
      stockMove,
      recordList,
      stockMoveForm,
      isNew,
    } = this.state;
    const { onUpdate, onNewUpdate } = this.props.route;
    const { add, update } = this.props.stockmove;
    if (isNew) {
      if (!this.validateData(stockMoveForm)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add(stockMoveForm).then((res) => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "stockMove-error",
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
      const record = recordList.find((r) => r.row_id === stockMove.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      if (record.id !== undefined) {
        this.startLoading();
        update(record).then((res) => {
          if (res.status === -1) {
            ons.notification.alert(res.error.message, {
              id: "stockMove-error",
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
    const { remove } = this.props.stockmove;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-stockMove",
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
    const { fields } = this.props.stockmove;
    const targetIndex = fields.findIndex((field) => field.name === fieldName);
    return targetIndex !== -1 ? true : false;
  }

  isFollowUpPanelEmpty() {
    const { stockMove } = this.state;
    if (stockMove.user || stockMove.team) {
      return false;
    }
    return true;
  }

  isContactPanelEmpty() {
    const { stockMove } = this.state;
    if (
      stockMove.mobile_phone ||
      stockMove.fixed_phone ||
      stockMove.email_address
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

  onMobileClick(e, stockMoveForm) {
    e.preventDefault();
    window.plugins.CallNumber &&
      window.plugins.CallNumber.callNumber(
        this.onSuccess,
        this.onError,
        stockMoveForm.mobile_phone,
        true
      );
  }

  isPrimaryAddressEmpty() {
    const { stockMove } = this.state;
    if (
      stockMove.primary_address ||
      stockMove.primary_city ||
      stockMove.primary_country ||
      stockMove.primary_state ||
      stockMove.primary_postal_code
    ) {
      return false;
    }
    return true;
  }

  getFieldLabel(fieldName) {
    const { fields } = this.props.stockmove;
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

  renderStockMoveLineList(item, index) {
    const unit = item.unit ? item.unit.name : '';
    return (
      <ListItem key={index} modifier="longdivider" className="dashlet-row">
        <div className="customer-item">
          <span className="dashlet-list-head">
            {item.product && item.product.fullName}
          </span>
          {item.availableStatus && <span className="dashlet-list-normal">
            {item.availableStatus}
          </span>}
          {item.qty && <span className="dashlet-list-normal">{translate('StockMove.qty')}: {item.qty} {unit}</span>}
          {item.realQty && <span className="dashlet-list-normal" >{translate('StockMove.realQty')}: {item.realQty} {unit}</span>}
          {item.trackingNumber && <span className="dashlet-list-normal">
            {translate('StockMove.trackingNumber')}: {item.trackingNumber.trackingNumberSeq}
          </span>}
          {item.netMass && <span className="dashlet-list-normal">
            {translate('StockMove.netMass')}: {item.netMass}
          </span>}
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
    const original = this.state.stockMove;
    let stockMove = {};
    if (isNew) {
      stockMove = this.state.stockMoveForm;
    } else {
      stockMove =
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
            {stockMove.stockMoveSeq || ""}
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          {/* <PageElement key="delete" offline={!stockMove.id}>
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
                onClick={() => this.removeRecord(stockMove)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!stockMove.id}>
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

  renderLeadBasicFields(stockMoveForm) {
    const { stockMove } = this.state;
    return (
      <div>
        {this.hasField("name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("name")}
            onChange={(e) => this.changeField("name", e.target.value)}
            value={stockMoveForm.name}
          />
        )}
        {this.hasField("first_name") && (
          <CardView.InputField
            edit={this.state.edit}
            title={this.getFieldLabel("first_name")}
            onChange={(e) => this.changeField("first_name", e.target.value)}
            value={stockMoveForm.first_name}
          />
        )}
        {this.hasField("status_select") && (
          <CardView.FieldWrapper
            fieldLabel={this.getFieldLabel("status_select")}
            edit={this.state.edit}
          >
            <Select
              className="status-select-input"
              value={`${stockMoveForm.status_select}`}
              onChange={(e) =>
                this.changeField("status_select", e.target.value)
              }
              style={{ width: "100%" }}
            >
              <option disabled value></option>
              {Object.keys(statusSelect).map(
                (s, i) =>
                  ([null, undefined].includes(stockMove.status_select) ||
                    s >= stockMove.status_select) && (
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
            searchAPI={(e) => this.props.stockmove.refs.user.searchAll(e)}
            onChange={(e) => this.changeField("user", e.target.value)}
            {...this.manyToOneProps(
              "full_name",
              stockMoveForm.user,
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

  renderLeadBasic(stockMoveForm) {
    return (
      <CardView className="lead-principal-tab">
        {this.renderLeadBasicFields(stockMoveForm)}
      </CardView>
    );
  }

  async fetchRecordAfterStatusChange(stockMove, newStatusSelect) {
    const { recordList } = this.state;
    const { action, fetch, update } = this.props.api;
    const fetchRes = await fetch(stockMove);
        const data = fetchRes.data[0];
        update({
          version: data.version,
          id: data.id,
          statusSelect: newStatusSelect,
        }).then((result) => {
          if (result.data && Array.isArray(result.data)) {
            this.fetchNewData(result.data[0]);
            // const targetIndex = recordList.findIndex(
            //   (r) => r.id === stockMove.id
            // );
            // const record = { ...recordList[targetIndex] };
            // recordList[targetIndex] = { ...record, ...result.data[0] };
            // this.setState({ recordList, isLoading: false });
          } else {
            this.setState({ isLoading: false });
          }
        });
  }

  changeStatus(newStatusSelect, statusAction, stockMove) {
    const { recordList } = this.state;
    const { action, fetch, update } = this.props.api;
    const data = {
      action: `${statusAction}`,
      context: {
        _model: "com.axelor.apps.stock.db.StockMove",
        ...stockMove,
      },
    };
    this.setState({ isLoading: true });
    runAction(action, data.context, statusAction).then(res => {
        if (res.data && Array.isArray(res.data)) {
        const actionResponse = res.data[0];
        if(!actionResponse.pending || actionResponse.pending === '') {
          this.fetchRecordAfterStatusChange(stockMove, newStatusSelect);
        }
      } else {
        this.setState({ isLoading: false });
      }
    });
  }

  printPickingOrder(stockMove) {
    const { action, wsFilesURL } = this.props.api;
    const data = {
      context: {
        ...stockMove,
      },
    };
    const actionName = "action-print-picking-stock-move";
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

  printStockMove(stockMove) {
    const { action, wsFilesURL } = this.props.api;
    const data = {
      context: {
        ...stockMove,
      },
    };
    const actionName = "action-print-stock-move";
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

  renderWkfButtons(stockMove) {
    const { statusSelect } = stockMove;
    return (
      <React.Fragment>
        {statusSelect === 1 && (
          <CardView.ActionItem
            icon="fa-calendar"
            onClick={() =>
              this.changeStatus(
                2,
                "action-group-stock-stockmove-plan-click",
                stockMove
              )
            }
          >
            <Translate text="StockMove.plan" />
          </CardView.ActionItem>
        )}
        {statusSelect === 2 && (
          <CardView.ActionItem
            icon="fa-check"
            onClick={() =>
              this.changeStatus(
                3,
                "action-group-stock-stockmove-realize-click",
                stockMove
              )
            }
          >
            <Translate text="StockMove.realize" />
          </CardView.ActionItem>
        )}
      </React.Fragment>
    );
  }

  /* render lead view */
  renderItem(stockMoveForm) {
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
          this.renderLeadBasic(stockMoveForm)
        ) : (
          <CardView principalView>
            {edit ? (
              <div style={{ padding: "10px 10px 10px 15px" }}>
                {this.renderLeadBasicFields(stockMoveForm)}
              </div>
            ) : (
              <div
                style={{
                  paddingBottom: 10,
                  paddingTop: 20,
                  textAlign: "center",
                }}
              >
                {this.hasField("stockMoveSeq") && (
                  <CardView.InputField
                    edit={false}
                    title={this.getFieldLabel("stockMoveSeq")}
                    value={stockMoveForm["stockMoveSeq"]}

                  />
                )}

                <CardView.TagButton>
                  {translate(
                    `StockMove.statusSelect.${
                      statusSelect[stockMoveForm.statusSelect]
                    }`
                  )}
                </CardView.TagButton>

                {this.hasField("availableStatusSelect") && stockMoveForm.availableStatusSelect ? (
                  <CardView.InputField
                    value={availableStatusSelect ? translate(
                      `StockMove.availableStatusSelect.${
                        availableStatusSelect[stockMoveForm.availableStatusSelect]
                      }`
                    ) : ''}
                    textClassName="lead-person-name"
                    className="principal-details-field"
                    style={{ marginTop: 25, marginBottom: 2 }}
                  />
                ) : null}

                {this.hasField("originTypeSelect") && stockMoveForm.originTypeSelect && (
                  <CardView.InputField
                    value={translate(
                      `StockMove.originTypeSelect.${
                        originTypeSelect[stockMoveForm.originTypeSelect]
                      }`
                    )}
                    textClassName="lead-person-name"
                    className="principal-details-field"
                  />
                )}

                {this.hasField("estimatedDate") && (
                  <CardView.DateField
                    edit={this.state.edit}
                    title={this.getFieldLabel("estimatedDate")}
                    value={stockMoveForm.estimatedDate}
                    onChange={(e) => {
                      // this.changeStartDate(e.target.value);
                    }}
                  />
                )}
              </div>
            )}
            {!isNew && (
              <CardView.ActionView>
                {this.renderWkfButtons(stockMoveForm)}

                <CardView.ActionItem
                  icon="md-print"
                  onClick={() => this.printStockMove(stockMoveForm)}
                >
                  <Translate text="Production.printStockMove" />
                </CardView.ActionItem>
                <CardView.ActionItem
                  icon="md-print"
                  onClick={() => this.printPickingOrder(stockMoveForm)}
                >
                  <Translate text="Production.printPickingOrder" />
                </CardView.ActionItem>
              </CardView.ActionView>
            )}
          </CardView>
        )}
        <CardView>
          {this.hasField("company") &&
            this.state.enableMultiCompany && (
              <CardView.InputField
                edit={this.state.edit}
                title={translate("Production.company")}
                onChange={(e) => this.changeField("company", e.target.value)}
                value={
                  stockMoveForm.company
                    ? stockMoveForm.company.name
                    : "-"
                }
              />
            )}
          {this.hasField("fromStockLocation") && (
            <CardView.InputField
              edit={this.state.edit}
              title={translate("StockMove.fromStockLocation")}
              value={stockMoveForm.fromStockLocation ? stockMoveForm.fromStockLocation.name : "-"}
            />
          )}
          {this.hasField("realDate") && (
            <CardView.DateField
              edit={this.state.edit}
              title={translate("StockMove.realDate")}
              value={
                stockMoveForm["realDate"] || "-"
              }
            />
          )}
        </CardView>
        <Tabs
          tabs={[
            {
              title: <Translate text="StockMove.stockMoveLineListPanel" />,
              value: 1,
            },
            {
              title: <Translate text="StockMove.notePanel" />,
              value: 2,
            },
          ]}
          activeColor="#2187d4"
          activeTab={this.state.overviewPanel}
          onChange={(e) => this.setState({ overviewPanel: e })}
        />
        <div className="resource-tab-container">
          {this.state.overviewPanel === 1 && <div className="upcoming-list">
            <List
              dataSource={
                stockMoveForm.stockMoveLineList || []
              }
              renderRow={(row, index) =>
                this.renderStockMoveLineList(row, index)
              }
            />
            {stockMoveForm.stockMoveLineList &&
              stockMoveForm.stockMoveLineList.length === 0 && (
                <div className="empty-activity-list">
                  <Translate text="StockMove.noStockMoveLineList" />
                </div>
              )}
          </div>}
          <CardView
            className="lead-details-tab"
            hidden={this.state.overviewPanel !== 2}
          >
            <CardView.TextArea
              edit={this.state.edit}
              title={translate("StockMove.note")}
              className="address-text"
              value={
                stockMoveForm.note || "-"
              }
            />
            <CardView.TextArea
              edit={this.state.edit}
              title={translate("StockMove.pickingOrderComments")}
              className="address-text"
              value={
                stockMoveForm.pickingOrderComments || "-"
              }
            />
          </CardView>

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
    const { hookState, isLoading, stockMove } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={(e) => this.setState({ hookState: e.state })}
        onLoad={(done) => {
          this.fetchNewData(stockMove);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { isLoading, recordList, stockMoveForm, isNew } = this.state;
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

StockMoveView.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any,
};

const mapPropsToState = (state) => {
  return { user_data: state.user, app_state: state.app };
};

export default connect(reduxConnect(mapPropsToState)(StockMoveView));
