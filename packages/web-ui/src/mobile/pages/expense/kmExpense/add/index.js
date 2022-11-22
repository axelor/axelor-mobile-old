import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import { connectKMExpense } from "../../connect";
import moment from "moment";
import {
  AlertDialog,
  ProgressCircular,
  Modal,
  Toolbar,
  ToolbarButton,
  Icon,
  PullHook
} from "react-onsenui";
import ons from "onsenui";

import Page, { PageElement } from "../../../page";
import Translate, { translate } from "../../../../locale";
import Form from "../../../form";
import { CardView, Panel, SwiperView } from "./../../../../components";
import { debounceCallback } from "./../../../debounce";
import { getSepratedPrice } from "./../../../common.func";
import { RenderManyToOne } from "./../../../page-comment-list";
import "./index.css";

class KMExpenseEditor extends Component {
  constructor(props) {
    super(props);
    const { route } = props;
    let kmExpense = {
      project: null,
      expenseDate: moment().format("YYYY-MM-DD"),
      comments: "",
      kilometricTypeSelect: null,
      distance: null,
      fromCity: null,
      toCity: null,
      kilometricAllowParam: null,
      totalAmount: 0,
      toInvoice: false
    };
    if (route.data && route.data.id !== undefined) {
      kmExpense = route.record;
    }
    this.state = {
      search: "",
      selected: 0,
      loading: false,
      kmExpense: { ...kmExpense },
      recordList: [],
      edit: false,
      isNew: false,
      showInfoCard: false,
      pager: {
        offset: 0,
        limit: 20,
        total: 0
      },
      hookState: "initial",
      alert: null,
      submitError: {
        title: null,
        content: null
      },
      test: null,
      checked: true,
      text: "",
      showErrorDialog: false
    };
  }

  componentDidMount() {
    const { route } = this.props;
    const { data, getRecordsByIndex } = route;
    if (data && data.id !== undefined) {
      if (getRecordsByIndex) {
        const records = getRecordsByIndex(data, true);
        const targetIndex = records.findIndex(r => r.id === data.id);
        this.swiper.slideTo(targetIndex, 0, true);
        this.setState({ recordList: records, activeIndex: targetIndex });
        this.fetchNewData(data);
      }
    } else {
      this.setState({ isNew: true, edit: true, showInfoCard: true });
    }
  }

  renderAlertBox() {
    const { alert } = this.state;
    const {
      title = "",
      content = "",
      onCancel = () => this.setState({ alert: null })
    } = alert || {};
    return (
      <AlertDialog isOpen={!!alert} isCancelable={false}>
        <div className="alert-dialog-title">{title}</div>
        <div className="alert-dialog-content">{content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onCancel} className="alert-dialog-button">
            <Translate text="button_cancel" />
          </button>
          <button onClick={onCancel} className="alert-dialog-button">
            <Translate text="button_ok" />
          </button>
        </div>
      </AlertDialog>
    );
  }

  renderErrorAlertBox() {
    const { showErrorDialog, submitError } = this.state;
    const onOk = () => this.setState({ showErrorDialog: false });
    return (
      <AlertDialog isOpen={showErrorDialog} isCancelable={false}>
        <div className="alert-dialog-title">{submitError.title}</div>
        <div className="alert-dialog-content">{submitError.content}</div>
        <div className="alert-dialog-footer">
          <button onClick={onOk} className="alert-dialog-button">
            Ok
          </button>
        </div>
      </AlertDialog>
    );
  }

  getFieldLabel(field) {
    return field;
  }

  changeValue(field, value) {
    const { kmExpense, recordList, isNew } = this.state;
    if (isNew) {
      kmExpense[field] = value;
      this.setState({ kmExpense });
    } else {
      const targetIndex = recordList.findIndex(
        r => r.row_id === kmExpense.row_id
      );
      const record = { ...recordList[targetIndex] };
      record[field] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  validateData(kmExpense) {
    let isValid = true;
    if (!kmExpense.project) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_project")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!kmExpense.expenseDate) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_expense_date")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!kmExpense.kilometricAllowParam) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_kap")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!kmExpense.kilometricTypeSelect) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_km_type")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!kmExpense.distance) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_distance")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!kmExpense.fromCity) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_from_city")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!kmExpense.toCity) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_to_city")
        }
      });
      isValid = false;
      return isValid;
    }
    return isValid;
  }

  closeLoading() {
    this.setState({ loading: false });
  }

  startLoading() {
    this.setState({ loading: true });
  }

  saveKMExpense() {
    const { kmExpense, recordList, isNew } = this.state;
    const { add, update } = this.props.kmExpense;
    const { updateNewItem } = this.props.route;
    if (isNew) {
      if (!this.validateData(kmExpense)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      add(kmExpense).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "add-expense-error"
          });
          this.setState({ isLoading: false });
        } else {
          const { data } = res;
          if (data && data.length > 0) {
            const newRecord = data[0];
            if (updateNewItem) {
              updateNewItem(newRecord);
            }
            this.setState({ isNew: false, edit: false }, () => {
              this.onRecordSwipe(newRecord);
            });
          } else {
            this.setState({
              loading: false,
              alert: {
                title: <Translate text={"app.expenses.error"} />,
                content: res.error.message || (
                  <Translate text={"app.expenses.errorOthers"} />
                )
              }
            });
          }
        }
      });
    } else {
      const record = recordList.find(r => r.row_id === kmExpense.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      update(record).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "update-expense-error"
          });
          this.setState({ isLoading: false });
        } else {
          if (`${res.status}` === "0") {
            const newRecord = res.data[0];
            if (this.props.route.updateItem) {
              this.props.route.updateItem(newRecord);
            }
            this.closeEdit().then(res => {
              this.fetchNewData(newRecord);
            });
          } else {
            this.setState({
              loading: false,
              alert: {
                title: <Translate text={"app.expenses.error"} />,
                content: res.error.message || (
                  <Translate text={"app.expenses.errorOthers"} />
                )
              }
            });
          }
        }
      });
    }
  }

  computeTotalAmount() {
    const { app } = this.props;
    const { action } = this.props.kmExpense;
    const { kmExpense } = this.state;
    const actionName = "action-kilometric-allowance-method-compute";

    if (app.mode === "online") {
      action(actionName, kmExpense).then(res => {
        console.log(res);
      });
    }
  }

  goBack() {
    this.props.navigator.popPage();
  }

  renderToolbar() {
    const { isNew, recordList } = this.state;
    const { route } = this.props;
    const original = this.state.kmExpense;
    let kmExpense = {};
    if (isNew) {
      kmExpense = this.state.kmExpense;
    } else {
      kmExpense = recordList.find(r => r.row_id === original.row_id) || {};
    }
    const isEdit = route.data && route.data.id !== undefined;
    const canBack = this.props.navigator.routes[0].name === "km_expense";
    return (
      <Toolbar noshadow modifier="transparent">
        <div className="left left-icon-width">
          <ToolbarButton onClick={() => this.onBackButtonClick(canBack)}>
            <Icon icon={"md-arrow-left"} />
          </ToolbarButton>
        </div>
        <div className="center ellipse-toolbar left-align-title">
          <span
            onClick={() => this.onBackButtonClick()}
            style={{ display: "inline-block" }}
          >
            <Translate
              text={`app.expense.kmExpense.${isEdit ? "edit" : "add"}.title`}
            />
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!kmExpense.id}>
            {this.state.edit ? (
              <div
                key="cancel"
                style={{
                  marginRight: 5,
                  color: "rgba(44, 196,211,1)",
                  display: isNew ? "none" : "inherit"
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
                onClick={() => this.removeExpense(kmExpense)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!kmExpense.id}>
            {this.state.edit ? (
              <div
                onClick={() => this.saveKMExpense()}
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
                onClick={() => this.editExpense()}
                style={{ padding: "5px 15px 5px 0px" }}
              >
                <div
                  key="edit"
                  style={{ color: "rgba(44, 196,211,1)" }}
                  className="round-icon"
                  onClick={() => this.editExpense()}
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

  fetchNewData(data) {
    const { fetch } = this.props.kmExpense;
    this.setState({ loading: true }, () => {
      setTimeout(() => {
        fetch(data).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const kmExpense = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(
              r => r.id === kmExpense.id
            );
            recordList[targetIndex] = Object.assign({}, kmExpense);
            this.setState({ kmExpense, recordList, loading: false });
          }
        });
      }, 300);
    });
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, kmExpense } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === kmExpense.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(kmExpense) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "km-expense",
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
    const { recordList, kmExpense } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === kmExpense.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = kmExpense;
          this.setState({ edit: false, kmExpense, recordList });
          resolve(true);
        }
      });
    });
  }

  onBackButtonClick(canBack) {
    const { edit } = this.state;
    if (!edit) {
      canBack
        ? this.goBack()
        : this.props.navigator.replacePage(
            { name: "km_expense" },
            { animation: "none" }
          );
      return;
    }
    this.isRecordChanged(true).then(ok => {
      if (ok) {
        canBack
          ? this.goBack()
          : this.props.navigator.replacePage(
              { name: "km_expense" },
              { animation: "none" }
            );
      }
    });
  }

  editExpense() {
    this.setState({ edit: true, showInfoCard: true });
  }

  removeExpense(record) {
    const { remove } = this.props.kmExpense;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-km-expense"
      })
      .then(res => {
        if (res === 1) {
          remove(record).then(res => {
            if (this.props.route.removeItem) {
              this.props.route.removeItem(record);
            }
            this.props.navigator.popPage();
          });
        }
      });
  }

  onRecordSwipe(record) {
    const { getRecordsByIndex } = this.props.route;
    if (getRecordsByIndex) {
      const list = getRecordsByIndex(record);
      this.setState({ recordList: list }, () => {
        const { recordList } = this.state;
        const targetIndex = recordList.findIndex(r => r.id === record.id);
        this.fetchNewData(record);
        this.swiper.slideTo(targetIndex, 0, true);
      });
    } else {
      this.setState({ recordList: [record], expense: record });
    }

    debounceCallback(() => {
      this.setState({ edit: false, showInfoCard: false }, () => {
        this.fetchNewData(record);
      });
    });
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

  renderPrincipalFields(kmExpense) {
    return (
      <div style={{ padding: "0px 10px 10px 10px" }}>
        <Form.RadioWizard
          options={[
            { value: 1, label: translate("app.expense.oneWay") },
            { value: 2, label: translate("app.expense.twoWay") }
          ]}
          value={kmExpense.kilometricTypeSelect}
          name="startOnSelect"
          onChange={e =>
            this.changeValue("kilometricTypeSelect", e.target.value)
          }
        />
        <CardView.DateField
          title={translate("app.expense.expenseDate")}
          onChange={e => this.changeValue("expenseDate", e.target.value)}
          value={kmExpense.expenseDate || ""}
          edit={this.state.edit}
        />
        <CardView.InputField
          title={translate("app.expense.fromCity")}
          onChange={e => this.changeValue("fromCity", e.target.value)}
          value={kmExpense.fromCity || ""}
          edit={this.state.edit}
        />
        <CardView.InputField
          title={translate("app.expense.toCity")}
          onChange={e => this.changeValue("toCity", e.target.value)}
          value={kmExpense.toCity || ""}
          edit={this.state.edit}
        />
        <CardView.Number
          title={translate("app.expense.distance")}
          onChange={e => this.changeValue("distance", e.target.value)}
          value={kmExpense.distance || ""}
          edit={this.state.edit}
        />
      </div>
    );
  }

  renderItem(kmExpense) {
    let kmTypeText = "";
    if (kmExpense.kilometricTypeSelect === 1) {
      kmTypeText = translate("app.expense.oneWay");
    } else if (kmExpense.kilometricTypeSelect === 2) {
      kmTypeText = translate("app.expense.twoWay");
    }
    let cityText = "";
    if (kmExpense.fromCity) {
      cityText = `${kmExpense.fromCity}`;
    }
    if (kmExpense.toCity) {
      cityText = `${cityText} To ${kmExpense.toCity}`;
    }

    return (
      <div style={{ marginBottom: 40 }}>
        <CardView principalView>
          {this.state.edit ? (
            this.renderPrincipalFields(kmExpense)
          ) : (
            <div
              style={{ paddingBottom: 10, paddingTop: 10, textAlign: "center" }}
            >
              <CardView.InputField
                value={kmTypeText}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={kmExpense.project && kmExpense.project.fullName}
                textClassName="title-name"
                className="principal-details-field"
              />
              <CardView.InputField
                value={cityText}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={moment(kmExpense.expenseDate).format("DD MMM YYYY")}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={`${kmExpense.distance} km`}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={
                  kmExpense.totalAmount
                    ? `${getSepratedPrice(
                        Number(kmExpense.totalAmount).toFixed(2)
                      )} €`
                    : ""
                }
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
            </div>
          )}
        </CardView>
        <Panel headerTitle={translate("Message.information")}>
          <CardView>
            <RenderManyToOne
              name="project"
              searchAPI={e =>
                this.props.kmExpense.refs.taskproject.searchAll(e)
              }
              onChange={e => this.changeValue("project", e.target.value)}
              {...this.manyToOneProps(
                "fullName",
                kmExpense.project,
                translate("app.expense.project"),
                translate("app.expense.select_project")
              )}
            />
            <RenderManyToOne
              name="kilometricAllowParam"
              searchAPI={e => this.props.kmExpense.refs.kap.searchAll(e)}
              onChange={e =>
                this.changeValue("kilometricAllowParam", e.target.value)
              }
              {...this.manyToOneProps(
                "name",
                kmExpense.project,
                translate("app.expense.kap"),
                translate("app.expense.kap")
              )}
            />
            <CardView.TextArea
              title={translate("app.expense.comments")}
              onChange={e => this.changeValue("comments", e.target.value)}
              value={kmExpense.comments || ""}
              edit={this.state.edit}
            />
          </CardView>
        </Panel>
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
    const { hookState, isLoading, kmExpense } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(kmExpense);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { loading, kmExpense, isNew, recordList } = this.state;
    return (
      <Page
        {...this.props}
        isRecordChanged={() => this.isRecordChanged(true)}
        title={this.renderToolbar()}
        renderToolbar={() => this.renderToolbar()}
        renderModal={
          loading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={loading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
        onScroll={this.infiniteScroller}
      >
        {this.renderAlertBox()}
        {this.renderErrorAlertBox()}
        {isNew ? (
          this.renderItem(kmExpense)
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

KMExpenseEditor.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app });

export default connectKMExpense(reduxConnect(mapPropsToState)(KMExpenseEditor));
