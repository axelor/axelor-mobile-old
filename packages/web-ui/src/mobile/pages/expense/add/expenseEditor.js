import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect as reduxConnect } from "react-redux";
import { connectExpense } from "../connect";
import Page, { PageElement } from "../../page";
import {
  AlertDialog,
  ProgressCircular,
  Modal,
  Icon,
  Toolbar,
  ToolbarButton,
  Switch,
  PullHook
} from "react-onsenui";
import Translate, { translate } from "../../../locale";
import "./index.css";
import moment from "moment";
import ons from "onsenui";
import { CardView, Panel, SwiperView } from "./../../../components";
import { debounceCallback } from "./../../debounce";
import { getSepratedPrice } from "./../../common.func";
import { RenderManyToOne } from "./../../page-comment-list";

class ExpenseEditor extends Component {
  constructor(props) {
    super(props);
    const { route } = this.props;
    let expense = {};
    if (route.record && route.record.id !== undefined) {
      expense = route.record;
    }
    this.state = {
      search: "",
      selected: 0,
      loading: false,
      recordList: [],
      edit: false,
      isNew: false,
      showInfoCard: false,
      flag: false,
      expense: {
        project: null,
        expenseProduct: null,
        expenseDate: moment().format("YYYY-MM-DD"),
        comments: "",
        kilometricTypeSelect: null,
        fromCity: null,
        toCity: null,
        kilometricAllowParam: null,
        totalAmount: "0.00",
        totalTax: "0.00",
        toInvoice: false,
        justification: null,
        ...expense
      },
      pager: {
        offset: 0,
        limit: 20,
        total: 0
      },
      hookState: "initial",
      test: null,
      checked: true,
      text: "",
      showErrorDialog: false,
      visibility: true,
      submitError: {
        title: null,
        content: null
      },
      activeIndex: 0
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

  fetchNewData(data) {
    const { fetch } = this.props.expense;
    this.setState({ loading: true }, () => {
      setTimeout(() => {
        fetch(data).then(res => {
          const { data } = res;
          if (data && data.length > 0) {
            const expense = Object.assign({}, data[0]);
            const { recordList } = this.state;
            const targetIndex = recordList.findIndex(r => r.id === expense.id);
            recordList[targetIndex] = Object.assign({}, expense);
            this.setState({
              expense,
              recordList,
              loading: false,
              flag: false,
              edit: false
            });
          }
        });
      }, 300);
    });
  }

  isRecordChanged(close) {
    return new Promise((resolve, reject) => {
      const { recordList, expense } = this.state;
      const targetIndex = recordList.findIndex(
        record => record.id === expense.id
      );
      if (
        JSON.stringify(recordList[targetIndex]) !== JSON.stringify(expense) &&
        close
      ) {
        ons.notification
          .confirm(translate("Alert.confirmClose"), {
            title: translate("Alert.confirm"),
            id: "expense-editor",
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
    const { recordList, expense } = this.state;
    return new Promise((resolve, reject) => {
      const targetIndex = recordList.findIndex(
        record => record.id === expense.id
      );
      this.isRecordChanged(close).then(ok => {
        if (ok) {
          recordList[targetIndex] = expense;
          this.setState({ edit: false, expense, recordList });
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
            { name: "expenses" },
            { animation: "none" }
          );
      return;
    }

    this.isRecordChanged(true).then(ok => {
      if (ok) {
        canBack
          ? this.goBack()
          : this.props.navigator.replacePage(
              { name: "expenses" },
              { animation: "none" }
            );
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
      this.closeEdit().then(res => {
        this.fetchNewData(record);
      });
    });
  }

  getFieldLabel(field) {
    return field;
  }

  changeValue(field, value) {
    const { expense, recordList, isNew } = this.state;
    if (isNew) {
      expense[field] = value;
      this.setState({ expense });
    } else {
      const targetIndex = recordList.findIndex(
        r => r.row_id === expense.row_id
      );
      const record = { ...recordList[targetIndex] };
      record[field] = value;
      recordList[targetIndex] = { ...record };
      this.setState({ recordList });
    }
  }

  renderErrorAlertBox() {
    const { showErrorDialog, submitError } = this.state;
    const onOk = () =>
      this.setState({
        showErrorDialog: false,
        submitError: { title: "", content: "" }
      });
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

  validateData(expense) {
    let isValid = true;
    if (!expense.project) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_project")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!expense.expenseProduct) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_expense_product")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!expense.expenseDate) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_expense_date")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!expense.totalAmount) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_total_amount")
        }
      });
      isValid = false;
      return isValid;
    }
    if (!expense.totalTax) {
      this.setState({
        submitError: {
          title: translate("Alert.saveErrorTitle"),
          content: translate("app.expense.require_total_tax")
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

  saveExpense() {
    const { expense, recordList, isNew } = this.state;
    const { add, update } = this.props.expense;
    const { updateNewItem } = this.props.route;
    if (isNew) {
      if (!this.validateData(expense)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      expense.totalAmount = Number(expense.totalAmount).toFixed(2);
      expense.untaxedAmount = expense.totalAmount - expense.totalTax;
      expense.comments = expense.comments || "";
      this.startLoading();
      add(expense).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "expense-error"
          });
          this.setState({ loading: false });
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
      const record = recordList.find(r => r.row_id === expense.row_id);
      if (!this.validateData(record)) {
        this.setState({ showErrorDialog: true });
        return;
      }
      this.startLoading();
      record.totalAmount = Number(record.totalAmount).toFixed(2);
      record.untaxedAmount = record.totalAmount - record.totalTax;
      record.comments = record.comments || "";
      update(record).then(res => {
        if (res.status === -1) {
          ons.notification.alert(res.error.message, {
            id: "expense-error"
          });
          this.setState({ loading: false });
        } else {
          if (`${res.status}` === "0") {
            const newRecord = res.data[0];
            if (this.props.route.updateItem) {
              this.props.route.updateItem(newRecord);
            }
            this.fetchNewData(newRecord);
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

  takePicture() {
    this.setState({ visibility: false, flag: true });
    window.navigator.camera.getPicture(
      imageData => {
        this.setState({ visibility: true }, () => {
          this.changeValue("justification", `${imageData}`);
        });
      },
      message => {
        this.setState({ visibility: true });
        console.log(message);
      },
      {
        quality: 10,
        encodingType: window.navigator.camera.EncodingType.JPEG,
        destinationType: window.navigator.camera.DestinationType.DATA_URL
      }
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

  renderPrincipalFields(expense) {
    return (
      <div style={{ padding: "10px 10px 10px 10px" }}>
        <RenderManyToOne
          name="expenseProduct"
          searchAPI={e => this.props.expense.refs.expensetype.searchAll(e)}
          onChange={e => this.changeValue("expenseProduct", e.target.value)}
          {...this.manyToOneProps(
            "fullName",
            expense.expenseProduct,
            translate("app.expense.expenseType"),
            translate("app.expense.select_type")
          )}
        />
        <RenderManyToOne
          name="project"
          searchAPI={e => {
            return this.props.expense.refs.taskproject.searchAll(e).then(res => {
              const {search = {}} = e;
              const {data = []} = res;
              if(search.fields && search.fields.length) {
                const {fieldName, value} = search.fields[0] || {};
                if(fieldName && value && value.length && Array.isArray(data)) {
                  const _value = value ? value.toLowerCase() : '';
                  const newData = data.filter(d => d[fieldName] && d[fieldName].toLowerCase().indexOf(_value) !== -1);
                  return {...res, total: newData.length, data: [...newData]};
                }
              }
              return res;
            });
          }}
          onChange={e => this.changeValue("project", e.target.value)}
          {...this.manyToOneProps(
            "fullName",
            expense.project,
            translate("app.expense.project"),
            translate("app.expense.select_project")
          )}
        />
        <CardView.DateField
          title={translate("app.expense.expenseDate")}
          onChange={e => this.changeValue("expenseDate", e.target.value)}
          value={expense.expenseDate || ""}
          edit={this.state.edit}
        />
        <CardView.Number
          title={translate("app.expense.totalAmount")}
          onChange={e => this.changeValue("totalAmount", e.target.value)}
          value={expense.totalAmount || ""}
          edit={this.state.edit}
          defaultValue="0.00"
        />
        <CardView.Number
          title={translate("app.expense.totalTax")}
          onChange={e => this.changeValue("totalTax", e.target.value)}
          value={expense.totalTax || ""}
          edit={this.state.edit}
          defaultValue="0.00"
        />
      </div>
    );
  }
  renderItem(expense) {
    let imageJustification = `${expense.picture}`;
    if (this.state.flag) {
      imageJustification = `data:image/jpeg;base64,${expense.justification}`;
    }

    return (
      <div style={{ marginBottom: 40 }}>
        <CardView principalView>
          {this.state.edit ? (
            this.renderPrincipalFields(expense)
          ) : (
            <div
              style={{ paddingBottom: 10, paddingTop: 10, textAlign: "center" }}
            >
              <CardView.InputField
                value={
                  expense.expenseProduct && expense.expenseProduct.fullName
                }
                textClassName="lead-person-name"
                className="principal-details-field"
                style={{ marginTop: 25, marginBottom: 2 }}
              />
              <CardView.InputField
                value={expense.project && expense.project.fullName}
                textClassName="title-name"
                className="principal-details-field"
              />
              <CardView.InputField
                value={
                  expense.totalAmount
                    ? `${getSepratedPrice(
                        Number(expense.totalAmount).toFixed(2)
                      )} €`
                    : ""
                }
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={
                  expense.totalTax
                    ? `${getSepratedPrice(
                        Number(expense.totalTax).toFixed(2)
                      )} €`
                    : ""
                }
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
              <CardView.InputField
                value={moment(expense.expenseDate).format("DD MMM YYYY")}
                textClassName="lead-assigned-user"
                className="principal-details-field"
              />
            </div>
          )}
        </CardView>
        <Panel headerTitle="Information">
          <CardView>
            <CardView.TextArea
              title={translate("app.expense.comments")}
              onChange={e => this.changeValue("comments", e.target.value)}
              value={expense.comments || ""}
              edit={this.state.edit}
            />
          </CardView>
          <div className="switch-container">
            <span>
              <Translate text="app.expense.toInvoice" />
            </span>
            <span className="expense-switch">
              <Switch
                checked={expense.toInvoice || false}
                onChange={e => this.changeValue("toInvoice", e.value)}
              />
            </span>
          </div>
          <div style={{ paddingLeft: 10 }}>
            {(expense.justification || expense.picture) && (
              <img
                src={imageJustification}
                height="175"
                style={{ width: 125 }}
                alt="take-proof"
              />
            )}
          </div>
        </Panel>
      </div>
    );
  }

  renderBottomBar() {
    const { edit } = this.state;
    return this.state.visibility && edit ? (
      <div className="camera-container" onClick={() => this.takePicture()}>
        <Icon icon="camera" style={{ color: "white" }} />
        <span className="camera-text">
          <Translate text="app.expense.takeAPicture" />
        </span>
      </div>
    ) : null;
  }

  goBack() {
    this.props.navigator.popPage();
  }

  editExpense() {
    this.setState({ edit: true, showInfoCard: true });
  }

  removeExpense(record) {
    const { remove } = this.props.expense;
    ons.notification
      .confirm(translate("Alert.confirmDelete"), {
        title: translate("Alert.confirm"),
        id: "remove-expense"
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

  renderToolbar(title) {
    const { isNew, recordList } = this.state;
    const { route } = this.props;
    const original = this.state.expense;
    let expense = {};
    if (isNew) {
      expense = this.state.expense;
    } else {
      expense = recordList.find(r => r.row_id === original.row_id) || {};
    }
    const isEdit = route.data && route.data.id !== undefined;
    const canBack = this.props.navigator.routes[0].name === "expenses";
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
            <Translate text={`app.expense.${isEdit ? "edit" : "add"}.title`} />
          </span>
        </div>
        <div
          key="1"
          className="right right-icons"
          style={{ color: "#717171", justifyContent: "flex-end" }}
        >
          <PageElement key="delete" offline={!expense.id}>
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
                onClick={() => this.removeExpense(expense)}
              >
                <Icon icon="fa-trash" />
              </div>
            )}
          </PageElement>
          <PageElement key="edit" offline={!expense.id}>
            {this.state.edit ? (
              <div
                onClick={() => this.saveExpense()}
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
            <Translate text="button_cancel" />
          </button>
          <button onClick={onOk} className="alert-dialog-button">
            <Translate text="button_ok" />
          </button>
        </div>
      </AlertDialog>
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
    const { hookState, isLoading, expense } = this.state;
    let hookContent = null;
    if (hookState === "action") {
      hookContent = this.renderPullHookLoader();
    }
    return (
      <PullHook
        disabled={isLoading}
        onChange={e => this.setState({ hookState: e.state })}
        onLoad={done => {
          this.fetchNewData(expense);
          done();
        }}
        fixedContent={true}
      >
        {hookContent}
      </PullHook>
    );
  }
  render() {
    const { loading, expense, isNew, recordList } = this.state;
    return (
      <Page
        {...this.props}
        isRecordChanged={() => this.isRecordChanged(true)}
        title={this.renderToolbar()}
        renderToolbar={() => this.renderToolbar(expense)}
        renderModal={
          loading && (
            <Modal className="auth-modal swiper-view-loader" isOpen={loading}>
              <ProgressCircular indeterminate />
            </Modal>
          )
        }
        renderBottomBar={this.renderBottomBar()}
      >
        {this.renderErrorAlertBox()}
        {this.renderAlertBox()}
        {isNew ? (
          this.renderItem(expense)
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

ExpenseEditor.propTypes = {
  navigator: PropTypes.any,
  route: PropTypes.any
};

const mapPropsToState = state => ({ app: state.app });

export default connectExpense(reduxConnect(mapPropsToState)(ExpenseEditor));
